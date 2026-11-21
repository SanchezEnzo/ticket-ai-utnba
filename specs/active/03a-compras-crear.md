# 03a: Compras (dominio completo, crear, pagar y listar)
 
## Casos de uso que cubre
- Como comprador, quiero poder realizar una compra sobre un Evento
  seleccionando uno de los tipos de entrada disponibles y la cantidad deseada,
  sin superar el cupo disponible.
- Como comprador, quiero poder visualizar mis compras, diferenciando con
  claridad el estado en el que se encuentran y cuántos días faltan para el
  evento en caso de estar en estado confirmada.
Este spec implementa **todo el dominio de `Compra`** (incluidas las
transiciones de uso, cancelación y reembolso), pero expone por API solo
crear, pagar y listar. Los endpoints de uso y cancelación se agregan en el
spec 03b, sobre un dominio que ya está probado.
 
## Documentos de referencia
- `docs/business-context.md`: sección 3 completa (compras, estados, transiciones, historial)
- `docs/architecture.md`: "Dominio rico", entidades, endpoints
- `docs/testing.md`: secciones 4.1 (Compra) y 4.2 (Compras)
## Requisito previo
Spec `02-eventos.md` cerrado, con la validación con zod disponible
(middleware `validar`, `req.validado` e `idSchema`).
 
## Alcance
 
### 1. Reloj: días de calendario
En `src/domain/reloj.js` agregar `diasCalendario(desde, hasta)`: cantidad de
días de calendario entre dos fechas, calculada en la zona horaria
`America/Argentina/Buenos_Aires` (con `Intl.DateTimeFormat`, sin
dependencias). Un evento de mañana a las 21:00 está a 1 día aunque falten
menos de 24 horas; un evento de hoy está a 0.
 
### 2. Dominio
 
**`EstadoCompra`**: enum con `PENDIENTE`, `CONFIRMADA`, `UTILIZADA`,
`CANCELADA`, `REEMBOLSADA`.
 
**`SISTEMA`**: constante exportada que representa al sistema como actor
(`{ id: "sistema", nombre: "Sistema" }`). Se usa como "quién" en el
reembolso automático.
 
**`CambioEstadoCompra`**: compra (su id), estado, quién (un `Usuario` o
`SISTEMA`) y fechaHora (`ahora()` al momento del cambio). Vive embebido en la
`Compra` como `historial`; no tiene repositorio propio.
 
**`Compra`**: id, comprador, evento, tipoEntrada, cantidad, total, estado,
historial y (spec 04) mensajes.
 
`Compra.crear({ comprador, evento, tipoEntrada, cantidad })`
- `cantidad` debe ser un número entero >= 1, si no `ValidationError`.
- El `tipoEntrada` debe pertenecer al `evento`, si no `ValidationError`.
- El comprador no puede ser el organizador del evento: `ForbiddenError`.
- Si el evento ya se realizó: `ConflictError`.
- Si no hay cupo para la cantidad: `ConflictError`. El cupo no cambia.
- Si todo está bien: reserva el cupo (`tipoEntrada.reservar`), calcula
  `total = precio x cantidad`, nace **PENDIENTE** y registra el primer
  `CambioEstadoCompra` (quién = comprador).
- Es atómico: si algo falla, ni el cupo ni nada más cambia.
`compra.actualizarEstado(nuevoEstado, usuario)`
 
| Desde | Hacia | Quién puede | Condiciones y efecto |
|---|---|---|---|
| PENDIENTE | CONFIRMADA | el comprador | (el pago es simulado) |
| CONFIRMADA | UTILIZADA | el organizador **de ese evento** | |
| PENDIENTE | CANCELADA | el comprador | el evento no se realizó. Libera el cupo. Estado final |
| CONFIRMADA | CANCELADA | el comprador | el evento no se realizó. Libera el cupo. **Registra CANCELADA y enseguida REEMBOLSADA** (quién = `SISTEMA`). El estado queda REEMBOLSADA |
 
- Cualquier otra combinación origen/destino es inválida y lanza
  `ConflictError`. Incluye pedir REEMBOLSADA desde afuera (solo ocurre dentro
  de la cancelación de una compra CONFIRMADA), pedir el mismo estado en el que
  ya está, y todo lo que salga de un estado final (UTILIZADA, CANCELADA,
  REEMBOLSADA).
- Se valida primero que la transición exista; después que `usuario` sea
  quien corresponde (`ForbiddenError` si no); después las condiciones
  (evento no realizado: `ConflictError`).
- Un cambio que falla **no deja rastro**: ni estado, ni cupo, ni historial.
- Una compra UTILIZADA no se puede cancelar. Una compra de un evento ya
  realizado no se puede cancelar.
`compra.diasParaEvento()`: si está CONFIRMADA, `diasCalendario(ahora(),
evento.fecha)` con mínimo 0. En cualquier otro estado, `null`.
 
### 3. Repositorio
`CompraRepository` (interfaz + memoria): `guardar`, `buscarPorId`,
`listarPorComprador`.
 
### 4. Seed de compras
Ampliar el seed (determinístico) con compras del usuario comprador que
cubran **todos los estados**, construidas a través del dominio
(`Compra.crear` y `actualizarEstado`), para que el cupo quede consistente:
- una PENDIENTE,
- una CONFIRMADA de un evento futuro (a unos 10 días),
- una UTILIZADA del evento ya realizado,
- una CANCELADA (cancelada desde PENDIENTE),
- una REEMBOLSADA (cancelada desde CONFIRMADA).
Para las compras del evento ya realizado el seed puede usar
`fijarAhora(...)` con una fecha anterior al evento y **siempre**
`restaurarReloj()` en un `finally`. Así el historial queda con fechas
coherentes.
 
### 5. Servicio y endpoints
`CompraService`: `crear`, `pagar`, `misCompras`. Orquesta repositorios y
llama al dominio; no decide reglas.
 
Todos requieren autenticación.
 
**`POST /compras`**
```json
{ "eventoId": "...", "tipoEntradaId": "...", "cantidad": 2 }
```
- 201 con la compra. Queda PENDIENTE y reserva el cupo.
- 400 si falta un campo, `cantidad` no es un entero >= 1 (incluye texto como
  `"2"`), el evento no existe o el tipo de entrada no existe o no es de ese
  evento.
- 403 si el usuario es el organizador del evento.
- 409 si el evento ya se realizó o no hay cupo suficiente.
**`POST /compras/:id/pago`**: PENDIENTE → CONFIRMADA. Responde 200 con la compra.
- 404 si la compra no existe. 403 si el usuario no es el comprador.
- 409 si la compra no está PENDIENTE (incluye pagar dos veces).
**`GET /compras`**: las compras del usuario autenticado, de la más reciente
a la más antigua (por la fecha del primer cambio de estado). Solo las suyas.
 
**Forma de la respuesta de una compra**
```json
{
  "id": "...",
  "estado": "CONFIRMADA",
  "cantidad": 2,
  "total": 30000,
  "diasParaEvento": 10,
  "evento": { "id": "...", "nombre": "...", "fecha": "2027-03-20T21:00:00.000Z" },
  "tipoEntrada": { "id": "...", "nombre": "General", "precio": 15000 },
  "comprador": { "id": "...", "nombre": "...", "apellido": "..." },
  "historial": [
    { "estado": "PENDIENTE", "quien": { "id": "...", "nombre": "...", "apellido": "..." },
      "fechaHora": "2027-03-10T15:00:00.000Z" }
  ]
}
```
- `diasParaEvento` es `null` salvo en compras CONFIRMADA.
- Nunca incluye email, contraseña ni hash de ningún usuario.
### 6. Validación con zod
Schemas en `src/schemas/compras.js`, aplicados con el middleware `validar`.
Los controllers leen de `req.validado`. Los schemas validan **forma y tipo**;
las reglas de negocio (cantidad entera >= 1, cupo, permisos, estados) siguen
en el dominio.
- `crearCompraBodySchema` (`POST /compras`), `.strict()`: `eventoId` y
  `tipoEntradaId` con `idSchema`, y `cantidad` como número. Sin coerción de
  tipos: `"2"` falla con 400. Que la cantidad sea un entero >= 1 lo sigue
  validando `Compra.crear`.
- `compraIdParamsSchema = z.object({ id: idSchema }).strict()`. Se usa en
  `POST /compras/:id/pago` y el spec 03b lo reutiliza.
- `GET /compras` y `POST /compras/:id/pago` no reciben query: schema
  `z.object({}).strict()`, que rechaza cualquier parámetro con 400.
- `POST /compras/:id/pago` no recibe body: se ignora.
### 7. Documentación
Actualizar `docs/architecture.md`: `Compra.crear`, `SISTEMA`, `historial`
embebido en `Compra`, `diasParaEvento()`, `diasCalendario` en `reloj.js`, y
el mapeo de transición inválida a `ConflictError` (409).
 
## Tests
 
`test/domain/reloj.test.js`
- `diasCalendario`: mismo día = 0, mañana a la noche = 1 aunque falten menos
  de 24 horas, cruce de medianoche en hora argentina, varios días.
`test/domain/Compra.test.js`
- `crear`: nace PENDIENTE, total correcto, cupo reservado, historial con una
  entrada (quién = comprador, fechaHora = `ahora()`).
- `crear` falla, sin cambiar el cupo, con: cantidad 0, negativa, 1,5, texto y
  `NaN`; tipo de entrada de otro evento; comprador igual al organizador;
  evento ya realizado; cantidad mayor al cupo.
- Comprar **exactamente** el cupo disponible funciona, y la compra siguiente
  de 1 entrada falla.
- **Tabla exhaustiva de transiciones:** los 5 estados origen x los 5 destino
  (25 combinaciones), generados con un arreglo de casos, no escritos uno por
  uno. Solo PENDIENTE→CONFIRMADA, CONFIRMADA→UTILIZADA, PENDIENTE→CANCELADA y
  CONFIRMADA→CANCELADA son válidas (con el actor correcto). Las otras 21
  lanzan `ConflictError`.
- Actor incorrecto, para cada transición válida: pagar un tercero, pagar el
  organizador, usar el comprador, usar otro organizador, cancelar el
  organizador, cancelar un tercero: todos `ForbiddenError`.
- Cancelar desde PENDIENTE: estado CANCELADA, cupo devuelto, historial de 2
  entradas, sin REEMBOLSADA.
- Cancelar desde CONFIRMADA: estado final REEMBOLSADA, cupo devuelto,
  historial con CANCELADA (quién = comprador) y REEMBOLSADA (quién =
  `SISTEMA`).
- Cancelar una compra UTILIZADA falla y no cambia nada.
- Cancelar una compra cuyo evento ya se realizó falla y no cambia nada
  (fijar el reloj, avanzarlo después de la fecha del evento).
- Una transición que falla no cambia estado, cupo ni historial.
- `diasParaEvento`: número solo si CONFIRMADA, `null` en los demás estados,
  0 el mismo día y nunca negativo.
 
`test/api/compras.test.js`
- Crear: 201, forma de la respuesta, y `GET /eventos/:id` muestra el
  `cupoDisponible` reducido.
- Cada causa de 400 de la lista anterior.
- Body con tipos incorrectos o claves de más: `cantidad` como texto
  (`"2"`), `eventoId` numérico, claves no declaradas, campos faltantes: 400
  por el schema.
- `:id` de formato inválido en `/pago`, o un parámetro de query en
  `GET /compras` o en `/pago`: 400.
- Organizador comprando su propio evento: 403.
- Evento ya realizado (el del seed): 409.
- Cantidad mayor al cupo: 409 y el cupo no cambia.
- Dos compras que juntas superan el cupo: la primera 201, la segunda 409.
- Pagar: 200 y estado CONFIRMADA; pagar de nuevo: 409; pagar compra ajena:
  403; pagar compra inexistente: 404.
- `GET /compras`: solo las del usuario (no las de otro), con las compras de
  todos los estados del seed, y `diasParaEvento` solo en la CONFIRMADA.
- Ninguna respuesta contiene email, contraseña ni hash.
- Sin token: 401.
## Criterios de aceptación
- [ ] `npm test` completo pasa y se muestra la salida.
- [ ] La tabla de transiciones se prueba con las 25 combinaciones.
- [ ] Toda regla de estados y cupo está en `Compra` / `TipoEntrada`; el
  service y los controllers no tienen `if` sobre estados.
- [ ] Un cambio fallido no deja cambios parciales (verificado en tests).
- [ ] Ningún `new Date(` ni `Date.now(` fuera de `reloj.js`.
- [ ] El seed contiene compras en los 5 estados y el cupo es coherente con ellas.
- [ ] Params, query y body de estos endpoints se validan con schemas de zod;
  los controllers leen solo de `req.validado`.
- [ ] Zod no se importa fuera de `src/schemas/` y `src/middleware/validar.js`.
- [ ] `package.json` sigue teniendo solo `express` y `zod`.
- [ ] `docs/architecture.md` actualizado.
## Fuera de este spec
- Endpoints de uso (`/uso`) y cancelación (`/cancelacion`) (spec 03b).
- Vista de compras de un evento para el organizador (spec 03c).
- Mensajes de la compra (spec 04) y reseñas (spec 05).
- Detalle de una compra por id (no está en la tabla de endpoints).
 