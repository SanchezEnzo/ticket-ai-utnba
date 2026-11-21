# Spec 01 — Auth y login

### ✓ Step 1: Errores de dominio y middleware de errores

**Descripción:** Se crean las clases de error y el middleware que traduce errores a respuestas HTTP unificadas.

- `src/domain/errors.js`: `DomainError` base y subclases (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`) con `code` y `message`. Sin imports de Express.
- `src/middleware/errorHandler.js`: `errorHandler` que traduce tipos de error a status HTTP y responde `{ error: { code, message } }`, `asyncHandler` wrapper, manejo de JSON mal formado (400), ruta 404 para rutas inexistentes, y 500 genérico para errores desconocidos con `console.error`.
- `test/api/errores.test.js`: 404 ruta inexistente, 400 JSON mal formado, 500 error inesperado sin stack.

### ✓ Step 2: Validación con zod y schemas

**Descripción:** Se implementa el middleware de validación y los schemas reutilizables.

- `src/schemas/comun.js`: `idSchema` (string, regex `^[A-Za-z0-9_-]{1,64}$`).
- `src/schemas/auth.js`: `loginBodySchema` — `.strict()`, `email` y `password` strings no vacíos, sin validación de formato de email.
- `src/middleware/validar.js`: `validar({ params, query, body })` middleware con `safeParse`, guarda en `req.validado`, lanza `ValidationError` con mensaje en español.
- `test/middleware/validar.test.js`: válido, inválido por separado, strict rechaza claves extra, clave repetida en query, no modifica `req.query`/`req.params`.

### ✓ Step 3: Usuario, repositorio y seed

**Descripción:** Se crea la entidad Usuario con hash de contraseña, el repositorio en memoria y los datos de ejemplo.

- `src/domain/Usuario.js`: propiedades (id, nombre, apellido, email, hash de contraseña, favoritos), `crear()` factory con hash, `verificarPassword()` con `timingSafeEqual`, `sinPassword()` para respuestas API.
- `src/repositories/UsuarioRepository.js`: interfaz (`guardar`, `buscarPorId`, `buscarPorEmail`, `listar`) e implementación en memoria con `Map`.
- `src/seed/usuarios.js`: al menos 3 usuarios determinísticos (organizador1, comprador1, ambos1) con credenciales documentadas.
- `test/domain/Usuario.test.js`: hash distinto de contraseña, verificar acepta/rechaza, dos hashes distintos de la misma contraseña, `sinPassword()` sin datos sensibles.

### ✓ Step 4: Login, autenticación y cableado

**Descripción:** Se implementa el login, el middleware de auth, se cablea `app.js` como factory y se completa el helper de login.

- `src/services/SesionService.js`: `crearToken(userId)`, `obtenerUsuarioPorToken(token)`, `Map` token → userId en memoria.
- `src/controllers/authController.js`: `login` (busca usuario, verifica password, crea token, responde sin contraseña) y `yo` (devuelve `req.usuario`).
- `src/middleware/auth.js`: lee `Authorization: Bearer <token>`, pone usuario en `req.usuario` o lanza `UnauthorizedError`.
- `src/routes/auth.js`: `POST /auth/login` con `validar({ body: loginBodySchema })`, `GET /auth/yo` con auth middleware.
- `src/app.js`: cambia a función factory `crearApp({ repositorios, servicios })` que crea app nueva, registra middleware, rutas y error handler. Elimina `GET /salud`.
- `test/helpers/crearApp.js`: crea repositorios nuevos, llama a seed, pasa todo a `app.js` factory.
- `test/helpers/login.js`: completa con llamada a `POST /auth/login`.
- `test/api/auth.test.js`: login correcto/incorrecto, /auth/yo, tokens, formato de respuesta, sin contraseña en respuesta.
- Eliminar `test/api/salud.test.js`.

# Resultados

- `npm test`: 33 tests pasados, 0 fallados.
- `npm start` + `curl POST /auth/login`: responde 200 con token y usuario sin contraseña.
- Zod solo se importa en `schemas/` y `middleware/validar.js`.
- `new Date()` solo en `reloj.js`.
- Sin `require`/`module.exports`, sin `try/catch` en controllers.
