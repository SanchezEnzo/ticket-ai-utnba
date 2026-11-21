# Spec 02: Eventos y Catálogo

### ✓ Step 1: Entidades de dominio: Categoria, TipoEntrada y Evento
Se crean las entidades con toda la lógica de negocio y los tests de dominio.
- `src/domain/Categoria.js`: clase con id, nombre, descripción. Factory `crear()`.
- `src/domain/TipoEntrada.js`: clase con id, nombre, descripción, precio, cupo, cupoDisponible. Factory `crear()` con validaciones. Métodos `hayCupoPara()`, `reservar()`, `liberar()`. Lanza `ValidationError`.
- `src/domain/Evento.js`: clase con id, nombre, descripción, categoría, fecha, tiposEntrada, multimedia, organizador. Factory `crear()` con validaciones. Métodos `precioDesde()`, `tuPrecioEstaEntre()`, `yaSeRealizo()` (usa `ahora()` del reloj), `sinDetalles()` para respuestas API. Lanza `ValidationError`.
- `test/domain/TipoEntrada.test.js`: creación válida/inválida, `hayCupoPara` en límites, `reservar` y `liberar` con cantidades válidas e inválidas.
- `test/domain/Evento.test.js`: `precioDesde`, `tuPrecioEstaEntre`, `yaSeRealizo` con reloj fijado, validaciones de creación.
- `src/domain/reloj.js`: agregadas `parsearFecha()` y `sumarDias()` para evitar `new Date()` en otros archivos.

### ✓ Step 2: Repositorios en memoria y seed de categorías y eventos
Se crean los repositorios con generación de IDs por contador y el seed determinístico.
- `src/repositories/CategoriaRepository.js`: clase con `guardar`, `buscarPorId`, `listar`. Contador interno para IDs (`cat_1`, `cat_2`, ...).
- `src/repositories/EventoRepository.js`: clase con `guardar`, `buscarPorId`, `listar`. Contador interno para IDs (`evt_1`, `evt_2`, ...). Los tipos de entrada también usan contador (`te_1`, ...).
- `src/seed/eventos.js`: seed determinístico con fechas relativas a `ahora()`. 5 categorías, 9 eventos futuros, 2+ del mismo organizador, 1 evento con 3 tipos de entrada, 1 evento pasado. Exporta los IDs y nombres para los tests.

### ✓ Step 3: Schemas de zod, EventoService, EventoController y rutas
Se implementa la validación, el servicio, el controller y las rutas de eventos.
- `src/schemas/eventos.js`: `eventoIdParamsSchema`, `listarEventosQuerySchema`, `crearEventoBodySchema`. Todos con `.strict()`. Sin coerción de tipos.
- `src/services/EventoService.js`: clase, constructor `{ eventoRepository, categoriaRepository, usuarioRepository }`. Métodos: `listarCategorias()`, `buscarEventoPorId(id)`, `crearEvento(datos, organizador)`, `listarEventos({ q, categoria, orden })`.
- `src/controllers/EventoController.js`: clase, constructor `{ eventoService }`. Handlers como arrow functions class fields.
- `src/routes/eventos.js`: `crearRutasEvento({ eventoController, authMiddleware })`. Rutas con auth y validación.
- `src/routes/categorias.js`: `crearRutasCategorias({ eventoController, authMiddleware })`. Ruta `GET /categorias`.

### ✓ Step 4: Cableado en app.js, server.js, crearApp.js y tests de API
Se cablean los nuevos componentes y se crean los tests de integración.
- `src/app.js`: agregar `crearRutasEvento` y `crearRutasCategorias` con auth y controllers.
- `src/server.js`: instanciar CategoriaRepository, EventoRepository, EventoService, EventoController. Llamar al seed de eventos.
- `test/helpers/crearApp.js`: instanciar los nuevos repositorios, service y controller. Llamar al seed de eventos.
- `test/api/eventos.test.js`: 26 tests de API (categorías, detalle, creación, búsqueda, filtros, orden, validación, permisos).
- Actualizar `docs/architecture.md`.
- Ejecutar `npm test` y verificar que todos los tests pasan.

# Resultados

- `npm test`: **96 tests pasados, 0 fallados** (33 auth + 18 TipoEntrada + 14 Evento + 26 API eventos + 5 errores).
- `new Date()` solo en `reloj.js`. `Date.now()` no usado en ningún archivo.
- Zod importado solo en `src/schemas/` y `src/middleware/validar.js`.
- Sin `try/catch` en controllers.
- Sin datos sensibles (email, contraseña, hash) en respuestas.
- IDs generados por contador en cada repositorio (`cat_1`, `evt_1`, `te_1`).
