---
sessionId: session-261121-233625-1cay
---

# Requirements

### Overview
Implementar el chat de la compra: un sistema de mensajes REST con polling donde el **comprador** y el **organizador del evento** pueden intercambiar mensajes sobre una compra, en cualquier estado de la misma.

### User Stories
- Como comprador, quiero enviar mensajes al organizador sobre una compra.
- Como organizador, quiero responder los mensajes de un comprador sobre una compra de mi evento.

### Scope

**In Scope:**
- Clase `Mensaje` embebida en `Compra.mensajes` (sin repositorio propio).
- `Compra.enviarMensaje(usuario, texto)` y `Compra.leerMensajes(usuario, desde)` con validación de acceso.
- `MensajeService` con `enviar` y `listar`.
- Schemas de Zod en `src/schemas/mensaje.schema.js`.
- Endpoints `GET /compras/:id/mensajes?desde=` y `POST /compras/:id/mensajes`.
- Mensajes de ejemplo en el seed.
- Tests de dominio y API.
- Actualización de `docs/architecture.md`.

**Out of Scope:**
- Pantalla del chat y polling en el front (spec del front).
- Mensajes leídos/no leídos, notificaciones, edición, borrado, adjuntos, paginación.
- WebSockets, SSE, long polling.

### Functional Requirements
- Solo el comprador y el organizador del evento pueden leer y escribir mensajes (`ForbiddenError` para otros).
- Texto: `trim`, no vacío, máx 1000 caracteres (`ValidationError`).
- Se puede enviar en cualquier estado (PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA) y si el evento ya se realizó.
- Un mensaje no cambia estado, cupo ni historial.
- Fechas estrictamente crecientes: si `ahora()` ≤ último mensaje, usa último + 1ms.
- `leerMensajes`: sin `desde` devuelve todos; con `desde` solo estrictamente posteriores. Orden cronológico.
- Respuesta de mensaje: `{ id, autor: { id, nombre, apellido }, texto, fechaHora }`. Sin email, contraseña ni hash.
- `GET /compras` y `GET /eventos/:id/compras` NO incluyen mensajes.


# Technical Design

### Current Implementation
- `Compra.js`: Clase con `crear()`, `actualizarEstado()`, `diasParaEvento()`, `paraRespuesta()`. Constructor recibe `id, comprador, evento, tipoEntrada, cantidad, total, estado, historial`.
- `CompraService.js`: Busca compra, llama al dominio, persiste con `compraRepository.guardar` y `eventoRepository.guardar`.
- `CompraController.js`: Lee de `req.validado`, llama al service, responde con `compra.paraRespuesta()`.
- `routes/compras.js`: Rutas con `authMiddleware`, `validar()`, y `asyncHandler`.
- `schemas/compras.js`: `compraIdParamsSchema` (reutilizable), `crearCompraBodySchema`, `emptyQuerySchema`.
- `schemas/comun.js`: `idSchema` para IDs.
- `middleware/validar.js`: Valida `params`, `query`, `body` con Zod, pone datos en `req.validado`.
- `reloj.js`: `ahora()`, `fijarAhora()`, `restaurarReloj()`, `sumarDias()`.
- `seed/compras.js`: Crea compras en los 5 estados usando `Compra.crear()` y `actualizarEstado()`.
- `test/domain/Compra.test.js`: Fixture con `crearFixture()` que crea usuarios, categoría, tipo de entrada y evento. Tests de `crear` y `actualizarEstado`.
- `test/api/compras.test.js`: Usa `crearApp()` y `login()` helpers.
- `test/helpers/crearApp.js`: Crea app con repositorios y servicios nuevos.

### Key Decisions
1. **Mensaje como objeto plano embebido en `Compra.mensajes`**: No necesita clase propia ni repositorio. Se construye dentro de `enviarMensaje` y se guarda como parte de la compra.
2. **Validación de acceso en `Compra`**: La regla "solo comprador y organizador" vive en `Compra.enviarMensaje` y `Compra.leerMensajes`. El service no compara IDs.
3. **Fechas estrictamente crecientes**: Dentro de `enviarMensaje`, comparar con el último mensaje y ajustar si es necesario. Usa `ahora()` del reloj.
4. **Schema separado**: `mensaje.schema.js` para mantener coherencia con el patrón de un archivo por recurso.
5. **MensajeService independiente**: Sigue el patrón de services existentes (clase con inyección por constructor).

### Proposed Changes

#### 1. Dominio — `Compra.js`
- Agregar `mensajes` al constructor (lista vacía por defecto).
- `enviarMensaje(usuario, texto)`:
  - Validar que `usuario` sea el comprador o el organizador del evento → `ForbiddenError` si no.
  - Validar texto: `trim`, no vacío, máx 1000 caracteres → `ValidationError`.
  - Calcular `fechaHora`: `ahora()`, pero si hay mensajes y `ahora()` ≤ último mensaje, usar último + 1ms.
  - Crear objeto mensaje `{ id, autor: usuario, texto, fechaHora }` con ID único.
  - Agregar a `this.mensajes`, devolver el mensaje.
- `leerMensajes(usuario, desde)`:
  - Mismo control de acceso que `enviarMensaje`.
  - Filtrar por `desde` (opcional, estrictamente posterior).
  - Devolver ordenados cronológicamente.
- `paraRespuesta()`: Mantener sin cambios (NO incluir mensajes).
- `crear()`: Inicializar `mensajes` como `[]`.

#### 2. Servicio — `MensajeService.js` (nuevo)
- Constructor: `{ compraRepository }`.
- `enviar(compraId, usuario, texto)`: Buscar compra (`NotFoundError`), llamar `compra.enviarMensaje(usuario, texto)`, `compraRepository.guardar(compra)`, devolver mensaje.
- `listar(compraId, usuario, desde)`: Buscar compra (`NotFoundError`), devolver `compra.leerMensajes(usuario, desde)`.

#### 3. Schema — `mensaje.schema.js` (nuevo)
- `compraIdParamsSchema`: Importar de `compras.js` o reusar `compraIdParamsSchema`.
- `listarMensajesQuerySchema`: `.strict()`, `desde` opcional string ISO 8601 con zona horaria, convertir a `Date`.
- `enviarMensajeBodySchema`: `.strict()`, `texto` string, `min(1)` después de trim, `max(1000)`.
- `sinQuerySchema`: `.strict()` vacío para POST.

#### 4. Controller — `MensajeController.js` (nuevo)
- Constructor: `{ mensajeService }`.
- `enviar = async (req, res) =>`: Leer `compraId` de `req.validado.params`, `texto` de `req.validado.body`, llamar service, responder 201 con formato de mensaje.
- `listar = async (req, res) =>`: Leer `compraId` de `req.validado.params`, `desde` de `req.validado.query`, llamar service, responder 200 con arreglo.

#### 5. Rutas — `routes/compras.js` (modificar)
- Agregar `GET /:id/mensajes` con `authMiddleware`, `validar({ params, query })`, `asyncHandler(mensajeController.listar)`.
- Agregar `POST /:id/mensajes` con `authMiddleware`, `validar({ params, body, query: sinQuerySchema })`, `asyncHandler(mensajeController.enviar)`.

#### 6. Composition Root — `server.js` y `test/helpers/crearApp.js` (modificar)
- Instanciar `MensajeService` y `MensajeController`.
- Pasar `mensajeController` a `crearRutasCompra`.

#### 7. Seed — `seed/compras.js` (modificar)
- Agregar mensajes a la compra CONFIRMADA (3 mensajes entre comprador y organizador) y a la REEMBOLSADA (1 mensaje).
- Usar `fijarAhora` para fechas anteriores a `ahora()` y `enviarMensaje` para respetar reglas.

#### 8. Documentación — `docs/architecture.md` (modificar)
- Agregar `Mensaje` a entidades.
- Documentar `Compra.enviarMensaje` y `Compra.leerMensajes`.
- Documentar schema `mensaje.schema.js`.
- Documentar garantía de fechas crecientes.

#### 9. Tests
- `test/domain/Compra.test.js`: Agregar tests de `enviarMensaje` y `leerMensajes` (comprador envía, organizador envía, tercero → ForbiddenError, texto vacío/1001 chars, 5 estados, fechas crecientes, leer con/sin `desde`).
- `test/api/mensajes.test.js` (nuevo): Tests de API completos según spec.


# Delivery Steps

### * Step 1: Dominio: Mensaje en Compra
Agregar `mensajes` a `Compra` con `enviarMensaje` y `leerMensajes`, y tests de dominio.

- En `Compra.js`: agregar `mensajes` al constructor (vacío por defecto), método `enviarMensaje(usuario, texto)` con validación de acceso (comprador u organizador), validación de texto (trim, no vacío, máx 1000 chars), fechas estrictamente crecientes, y método `leerMensajes(usuario, desde)` con mismo control de acceso y filtrado por fecha.
- En `Compra.crear()`: inicializar `mensajes` como `[]`.
- En `test/domain/Compra.test.js`: tests de enviar (comprador, organizador, tercero → ForbiddenError), texto inválido, 5 estados, fechas crecientes con `fijarAhora`, leer con/sin `desde`, tercero lee → ForbiddenError.

###   Step 2: Schema, Service, Controller y Rutas
Crear la capa API completa: schemas de Zod, MensajeService, MensajeController, y rutas.

- `src/schemas/mensaje.schema.js`: `listarMensajesQuerySchema` (desde opcional ISO 8601 → Date), `enviarMensajeBodySchema` (texto string 1-1000 chars, strict), `sinQuerySchema`.
- `src/services/MensajeService.js`: `enviar(compraId, usuario, texto)` y `listar(compraId, usuario, desde)`.
- `src/controllers/MensajeController.js`: `enviar` (201) y `listar` (200), leyendo de `req.validado`.
- `src/routes/compras.js`: Agregar `GET /:id/mensajes` y `POST /:id/mensajes` con auth, validación y asyncHandler.
- `src/server.js` y `test/helpers/crearApp.js`: Instanciar y conectar MensajeService y MensajeController.

###   Step 3: Seed con mensajes y documentación
Agregar mensajes de ejemplo al seed y actualizar la documentación de arquitectura.

- `src/seed/compras.js`: Agregar 3 mensajes a la compra CONFIRMADA (intercambio comprador-organizador) y 1 mensaje a la REEMBOLSADA, usando `fijarAhora` para fechas pasadas y `enviarMensaje` para respetar reglas.
- `docs/architecture.md`: Documentar `Mensaje`, `Compra.enviarMensaje`, `Compra.leerMensajes`, `mensaje.schema.js`, y la garantía de fechas crecientes.

### ✓ Step 4: Tests de API y validación final
Tests de integración API completos y ejecución de toda la suite de tests.

- `test/api/mensajes.test.js`: Tests de comprador y organizador envían y leen, tercero → 403, 5 estados → 201, compra inexistente → 404, sin token → 401, `desde` con valores válidos e inválidos, texto inválido, polling, `GET /compras` sin mensajes, mensajes del seed, sin datos sensibles en respuestas.
- Ejecutar `npm test` y verificar que todo pasa.