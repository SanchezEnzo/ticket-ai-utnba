# 03c: Compras de un evento (vista del organizador)

## Casos de uso que cubre
- Como organizador, quiero poder visualizar las compras realizadas sobre uno
  de mis eventos, con el estado de cada una y cuántas entradas quedan
  disponibles de cada tipo.

## Documentos de referencia
- `docs/business-context.md`: sección 1 (permisos por relación con el recurso)
  y sección 3 ("Visualización")
- `docs/architecture.md`: capas, "Validación de requests", endpoints
- `docs/testing.md`: sección 4.2 (Compras)

## Requisito previo
Specs `02-eventos.md`, `03a-compras-crear.md` y `03b-compras-cancelar.md`
cerrados.

## Alcance

### 1. Dominio
`Evento.esOrganizadoPor(usuario)`: verdadero si el organizador del evento es
ese usuario (comparación por id). Es la única regla nueva: quién es "el
organizador de ese evento". No se duplica la comparación de ids en el service
ni en el controller.

### 2. Repositorio
`CompraRepository.listarPorEvento(eventoId)`: todas las compras de un evento,
de cualquier comprador y cualquier estado. Se agrega a la interfaz y a la
implementación en memoria.

### 3. Servicio
`CompraService.comprasDelEvento(eventoId, usuario)`:
1. Busca el evento (`NotFoundError` si no existe).
2. Verifica el acceso: si `!evento.esOrganizadoPor(usuario)`, lanza
   `ForbiddenError`. Es un permiso de lectura de un recurso, por eso lo
   verifica el service (ver `docs/architecture.md`).
3. Devuelve el evento y sus compras ordenadas de la más reciente a la más
   antigua (por la fecha del primer cambio de estado, igual que
   `GET /compras`).

No hay `if` sobre estados: el service lista todas las compras tal como están.

### 4. Validación con zod
En `src/schemas/evento.schema.js` se reutiliza `eventoIdParamsSchema` (spec 02).
La ruta usa `validar({ params: eventoIdParamsSchema, query: sinQuerySchema })`,
donde `sinQuerySchema = z.object({}).strict()` (si no existe todavía, se crea
en `src/schemas/comun.schema.js` y se reutiliza). El controller lee de
`req.datos`. El endpoint no recibe body: se ignora.

### 5. Endpoint
**`GET /eventos/:id/compras`**: requiere autenticación.
- 200 con:
```json
{
  "evento": { "id": "...", "nombre": "...", "fecha": "2027-03-20T21:00:00.000Z" },
  "tiposEntrada": [
    { "id": "...", "nombre": "General", "cupo": 200, "cupoDisponible": 148 }
  ],
  "compras": [ /* compras, con la misma forma que en el spec 03a */ ]
}
```
- `tiposEntrada` trae **todos** los tipos del evento con su `cupo` y su
  `cupoDisponible` actuales, aunque un tipo no tenga compras.
- Cada elemento de `compras` tiene exactamente la forma de una compra del spec
  03a (estado, cantidad, total, `diasParaEvento`, evento, tipoEntrada, comprador
  con id, nombre y apellido, e historial). El comprador **nunca** incluye
  email, contraseña ni hash. Se reutiliza el mismo armado de la respuesta que
  usa `GET /compras`, sin duplicarlo.
- Incluye las compras de **todos** los estados (PENDIENTE, CONFIRMADA,
  UTILIZADA, CANCELADA y REEMBOLSADA).
- Funciona también si el evento ya se realizó (el organizador puede consultar
  su historial).
- 400 si `:id` no cumple el schema o llega un parámetro de query.
- 403 si el usuario no es el organizador de ese evento (incluye a quien tiene
  compras en el evento).
- 404 si el evento no existe.
- Si el evento no tiene compras: `compras` es una lista vacía y `tiposEntrada`
  sigue completo.

### 6. Documentación
Actualizar `docs/architecture.md`: `Evento.esOrganizadoPor` y
`CompraRepository.listarPorEvento`.

## Tests

`test/domain/Evento.test.js` (se amplía)
- `esOrganizadoPor`: verdadero para el organizador, falso para otro usuario y
  para el comprador.

`test/api/compras.test.js` (se amplía, o `eventos-compras.test.js`)
- El organizador del evento recibe 200 con la forma indicada y los tipos de
  entrada con su cupo.
- **Un tercero que no es organizador de ese evento recibe 403.**
- **El comprador de una compra de ese evento recibe 403.**
- **El organizador de otro evento recibe 403.**
- Evento inexistente: 404. `:id` inválido: 400. Parámetro de query: 400.
  Sin token: 401.
- Solo trae las compras **de ese evento** (crear compras en dos eventos y
  verificar que no se mezclan).
- Trae compras de **varios compradores** y de **todos los estados**: armar con
  la API una PENDIENTE, una CONFIRMADA, una UTILIZADA, una CANCELADA y una
  REEMBOLSADA y verificar el estado de cada una.
- Orden: de la más reciente a la más antigua.
- **El cupo disponible es correcto y se mueve:**
  - tras crear una compra de N entradas, el `cupoDisponible` del tipo baja N;
  - tras cancelarla (PENDIENTE o CONFIRMADA), vuelve a su valor anterior;
  - una compra UTILIZADA no devuelve cupo.
- **Invariante:** para cada tipo de entrada, `cupo - cupoDisponible` es igual
  a la suma de `cantidad` de las compras en estado PENDIENTE, CONFIRMADA o
  UTILIZADA de ese tipo. Verificarlo después de una secuencia de compras y
  cancelaciones.
- Un tipo de entrada sin compras aparece igual, con `cupoDisponible` igual a
  `cupo`.
- Evento sin compras: 200 con `compras` vacía.
- El organizador consulta un evento ya realizado (el del seed): 200.
- Ninguna respuesta contiene email, contraseña ni hash de los compradores.

## Criterios de aceptación
- [ ] `npm test` completo pasa y se muestra la salida.
- [ ] La comparación "es el organizador" vive en `Evento.esOrganizadoPor`; el
  service y el controller no comparan ids a mano.
- [ ] El service no tiene `if` sobre estados de compra.
- [ ] `GET /compras` y este endpoint comparten el armado de la respuesta de una
  compra (sin código duplicado).
- [ ] Params y query se validan con zod; el controller lee de `req.datos`.
- [ ] Ningún `new Date(` ni `Date.now(` fuera de `reloj.js`.
- [ ] `package.json` sigue teniendo solo `express` y `zod`.
- [ ] `docs/architecture.md` actualizado.

## Fuera de este spec
- Acciones del organizador sobre las compras (marcar como utilizada ya está en
  el spec 03b).
- Mensajes de la compra (spec 04) y reseñas (spec 05).
- Paginación, filtros por estado o por comprador, exportaciones.