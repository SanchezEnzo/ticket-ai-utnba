---
sessionId: session-261121-200758-bhlp
---

# Requirements

### Overview & Goals

Implementar `GET /eventos/:id/compras` para que el organizador de un evento pueda ver todas las compras realizadas, con el estado de cada una y cuántas entradas quedan disponibles de cada tipo.

### Scope

**In Scope:**
- `Evento.esOrganizadoPor(usuario)`: método de dominio que verifica si un usuario es el organizador.
- `CompraRepository.listarPorEvento(eventoId)`: nuevo método de repositorio.
- `CompraService.comprasDelEvento(eventoId, usuario)`: servicio con validación de acceso.
- `GET /eventos/:id/compras`: endpoint con auth, validación zod y respuesta con evento, tiposEntrada y compras.
- Tests de dominio y API.
- Actualizar `docs/architecture.md`.

**Out of Scope:**
- Acciones del organizador sobre compras (ya en 03b).
- Mensajes (spec 04) y reseñas (spec 05).
- Paginación, filtros o exportaciones.

### Acceptance Criteria

- `npm test` completo pasa.
- `esOrganizadoPor` vive en `Evento`; service y controller no comparan ids.
- El service no tiene `if` sobre estados de compra.
- `GET /compras` y este endpoint comparten el armado de respuesta (`compra.paraRespuesta()`).
- Params y query validados con zod; controller lee de `req.validado`.
- Ningún `new Date(` ni `Date.now(` fuera de `reloj.js`.
- `package.json` con solo `express` y `zod`.
- `docs/architecture.md` actualizado.

# Delivery Steps

### ✓ Step 1: Dominio y repositorio: esOrganizadoPor y listarPorEvento
Agregar el método `esOrganizadoPor(usuario)` en `Evento` y `listarPorEvento(eventoId)` en `CompraRepository`, con tests de dominio.

- `backend/src/domain/Evento.js`: agregar `esOrganizadoPor(usuario)` que compara `this.organizador.id === usuario.id`.
- `backend/src/repositories/CompraRepository.js`: agregar `listarPorEvento(eventoId)` que filtra por `compra.evento.id`.
- `backend/test/domain/Evento.test.js`: agregar tests de `esOrganizadoPor` (verdadero para el organizador, falso para otro usuario y para el comprador).
- Ejecutar `npm run test:domain` para validar.

### ✓ Step 2: Servicio, controller y ruta: comprasDelEvento
Agregar `comprasDelEvento` en el service, handler en el controller, y la ruta `GET /eventos/:id/compras` con validación.

- `backend/src/services/CompraService.js`: agregar `comprasDelEvento(eventoId, usuario)` que busca el evento, verifica `esOrganizadoPor`, y devuelve evento + compras ordenadas (más reciente primero) + tipos de entrada con cupo.
- `backend/src/controllers/EventoController.js`: agregar handler `comprasDelEvento` que llama al service y responde con evento resumido, tiposEntrada y compras.
- `backend/src/routes/eventos.js`: agregar `GET /:id/compras` con auth, validación de params y query, y asyncHandler.
- Reutilizar `eventoIdParamsSchema` y `emptyQuerySchema` para validación.

### ✓ Step 3: Tests de API y documentación
Agregar tests de API integrales para el nuevo endpoint y actualizar la documentación.

- `backend/test/api/compras.test.js` (o nuevo archivo `eventos-compras.test.js`): tests de permisos (organizador 200, tercero 403, comprador 403, organizador de otro evento 403), validación (404, 400, 401), formato de respuesta, cupoDisponible correcto, invariantes de cupo, compras de varios estados, orden, evento sin compras, evento ya realizado, y datos sensibles.
- `docs/architecture.md`: verificar que `esOrganizadoPor` y `listarPorEvento` estén documentados.
- Ejecutar `npm test` completo y mostrar la salida.