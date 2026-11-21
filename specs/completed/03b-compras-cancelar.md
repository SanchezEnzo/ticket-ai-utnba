# 03b: Compras (uso, cancelación y reembolso)
 
## Casos de uso que cubre
- Como organizador, quiero poder marcar una compra como utilizada (simula
  escanear la entrada).
- Como comprador, quiero poder cancelar una compra, y que si ya estaba
  confirmada se me reembolse.
El dominio de `Compra` (tabla de transiciones, cupo, historial, reembolso
automático) **ya está implementado y probado en el spec 03a**. Este spec solo
expone dos acciones por API sobre ese dominio. No se agregan reglas nuevas.
 
## Documentos de referencia
- `docs/business-context.md`: sección 3 (transiciones) y sección 9 (casos borde)
- `docs/architecture.md`: capas, endpoints, manejo de errores
- `docs/testing.md`: sección 4.2 (Compras)
## Requisito previo
Spec `03a-compras-crear.md` cerrado, y la validación con zod disponible
(middleware `validar` y carpeta `src/schemas/`, definidos en el spec 01).
 
## Alcance
 
### 1. Validación de la URL con zod
Los parámetros de ruta de estos endpoints se validan con un schema de zod en
el borde HTTP, **antes** de llegar al controller.
 
- Se reutiliza `compraIdParamsSchema` de `src/schemas/compras.js` (definido
  en el spec 03a, sobre el `idSchema` del spec 01). No se crean schemas nuevos
  para el id.
- Los endpoints usan el middleware `validar({ params: compraIdParamsSchema })`
  en la definición de la ruta. Si el schema falla, el middleware lanza un
  `ValidationError` (400) con el formato de error unificado; el controller
  nunca recibe datos inválidos.
- El controller lee el id de `req.validado.params`, el resultado ya parseado
  por el schema (no de `req.params`).
- Zod vive solo en `routes/`, `middleware/` y `schemas/`. **El dominio no
  importa zod**: sus validaciones de negocio siguen siendo `ValidationError`
  propios.
- Estos endpoints no reciben body ni query. Si llega un body, se ignora. Si
  llega cualquier parámetro de query, responde 400 (schema `z.object({}).strict()`).
### 2. Servicio
`CompraService` agrega:
- `usar(compraId, usuario)`: busca la compra (`NotFoundError` si no existe) y
  llama a `compra.actualizarEstado(EstadoCompra.UTILIZADA, usuario)`.
- `cancelar(compraId, usuario)`: busca la compra (`NotFoundError` si no
  existe) y llama a `compra.actualizarEstado(EstadoCompra.CANCELADA, usuario)`.
  El reembolso automático lo resuelve el dominio, no el service.
- Después de cambiar el estado, persiste con `CompraRepository.guardar` (y con
  `EventoRepository.guardar` si el cupo vive en el evento) para no depender de
  que las referencias en memoria sean compartidas.
- El service **no** tiene `if` sobre estados ni sobre quién es el organizador:
  todo eso lo decide `Compra`.
### 3. Endpoints
Ambos requieren autenticación y responden 200 con la compra en la misma forma
que el spec 03a.
 
**`POST /compras/:id/uso`**: CONFIRMADA → UTILIZADA.
- 400 si `:id` no cumple el schema o llega un parámetro de query.
- 403 si el usuario no es el organizador **de ese evento** (incluye al
  comprador y a otro organizador).
- 404 si la compra no existe.
- 409 si la compra no está CONFIRMADA (incluye PENDIENTE, UTILIZADA, CANCELADA,
  REEMBOLSADA y marcarla dos veces).
- Marcar como utilizada no depende de la fecha del evento (es una simulación).
**`POST /compras/:id/cancelacion`**: cancela la compra.
- PENDIENTE → CANCELADA: libera el cupo, sin reembolso.
- CONFIRMADA → CANCELADA → REEMBOLSADA: libera el cupo; el historial registra
  CANCELADA (quién = comprador) y REEMBOLSADA (quién = sistema); la respuesta
  trae estado REEMBOLSADA.
- 400 si `:id` no cumple el schema o llega un parámetro de query.
- 403 si el usuario no es el comprador de esa compra (incluye al organizador).
- 404 si la compra no existe.
- 409 si la compra está UTILIZADA, CANCELADA o REEMBOLSADA, o si el evento ya
  se realizó.
### 4. Orden de validación
Es el del dominio (spec 03a): primero que la transición exista (409), después
que el usuario sea quien corresponde (403), después las condiciones (409).
La validación del schema (400) y la búsqueda de la compra (404) ocurren antes.
 
### 5. Documentación
Actualizar `docs/architecture.md`: la tabla de endpoints ya los incluye, se
agrega a la sección de errores que `validar` traduce los errores de zod a
`ValidationError`.
 
## Tests
 
`test/api/compras.test.js` (se amplía el archivo del spec 03a)
 
Uso
- Flujo: crear → pagar → el organizador marca UTILIZADA: 200, estado
  UTILIZADA, el historial tiene 3 entradas con quién correcto.
- **El comprador intenta marcar su propia compra como UTILIZADA: 403.**
- **Otro organizador intenta marcar una compra ajena: 403.**
- Marcar una compra PENDIENTE: 409. Marcarla dos veces: 409.
- Marcar una compra CANCELADA y una REEMBOLSADA: 409.
- Compra inexistente: 404. Sin token: 401.
- `:id` inválido (por ejemplo con espacios o caracteres como `%20`, `..`,
  más de 64 caracteres): 400 con el formato unificado.
- Parámetro de query en la URL (`?x=1`): 400.
Cancelación
- **Cancelar PENDIENTE:** 200, estado CANCELADA, el `cupoDisponible` del tipo
  vuelve al valor anterior a la compra, el historial no tiene REEMBOLSADA.
- **Cancelar CONFIRMADA:** 200, estado REEMBOLSADA, el cupo vuelve, el historial
  tiene CANCELADA (quién = comprador) y REEMBOLSADA (quién = sistema).
- **Cancelar UTILIZADA: 409** y nada cambia (estado ni cupo).
- **Cancelar una compra de un evento ya realizado: 409** y nada cambia. Armarlo
  creando y pagando la compra en un evento futuro y avanzando el reloj con
  `fijarAhora` más allá de la fecha del evento; `restaurarReloj()` siempre
  en `afterEach` o `finally`.
- Cancelar dos veces: 409 y el cupo no se devuelve dos veces.
- El organizador intenta cancelar: 403. Un tercero: 403.
- Compra inexistente: 404. Sin token: 401.
- `:id` inválido: 400. Parámetro de query: 400.
- Flujo completo: crear → pagar → cancelar → REEMBOLSADA, verificando el
  estado y el cupo (con `GET /eventos/:id`) en cada paso.
- Dos compras que agotan el cupo, la primera se cancela, y una tercera
  compra ahora funciona.
- Ninguna respuesta contiene email, contraseña ni hash.
`test/api/schemas.test.js` (o dentro de `errores.test.js`)
- `compraIdParamsSchema`: acepta ids válidos; rechaza vacío, con espacios,
  con `/`, con más de 64 caracteres y claves de más.
- El middleware `validar` traduce un error de zod a 400 con el formato
  unificado y un `message` legible en español.
## Criterios de aceptación
- [ ] `npm test` completo pasa y se muestra la salida.
- [ ] Los 6 casos borde de `business-context.md` sección 9 sobre uso y
  cancelación tienen test (cancelar UTILIZADA, cancelar evento realizado,
  cancelar PENDIENTE sin reembolso, cancelar CONFIRMADA hasta REEMBOLSADA,
  comprador marca su compra como UTILIZADA, otro organizador marca compra ajena).
- [ ] Ni el service ni los controllers tienen `if` sobre estados o permisos.
- [ ] El dominio no importa zod ni Express.
- [ ] Los parámetros de ruta pasan por un schema de zod; los controllers no
  validan formato a mano.
- [ ] Ningún `new Date(` ni `Date.now(` fuera de `reloj.js`.
- [ ] Los tests que cambian el reloj lo restauran siempre.
- [ ] `package.json` tiene solo `express` y `zod` en `dependencies`.
- [ ] `docs/architecture.md` actualizado.
## Fuera de este spec
- Vista de compras de un evento para el organizador (spec 03c).
- Mensajes de la compra (spec 04) y reseñas (spec 05).
- Reglas nuevas de estados o de reembolso (el dominio no cambia).
 