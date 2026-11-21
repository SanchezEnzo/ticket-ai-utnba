# 01: Errores, validación y autenticación

## Objetivo
Tener el manejo de errores unificado, la validación de entrada con zod y el
login funcionando, para que todos los specs siguientes devuelvan errores con
el mismo formato, validen lo que llega por HTTP de la misma manera y sepan
quién es el usuario autenticado.

## Documentos de referencia
- `docs/architecture.md`: secciones "Manejo de errores", "Autenticación",
  "Persistencia en memoria" y "Endpoints"
- `docs/business-context.md`: sección 1 (usuarios y acceso)
- `docs/testing.md`: secciones 4.2 (Auth y Errores) y 6

## Requisito previo
Spec `00-base.md` cerrado.

## Alcance

### 1. Errores de dominio
En `src/domain/errors.js`:
- `DomainError` (clase base, con `code` y `message`).
- `ValidationError`, `ForbiddenError`, `NotFoundError`, `ConflictError`,
  y `UnauthorizedError` para token ausente o inválido y credenciales erróneas.
- Los errores de dominio **no conocen HTTP**: no tienen status ni usan `res`.

### 2. Middleware de errores
En `src/middleware/errorHandler.js`, registrado al final de `app.js`:
- Traduce: `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError`
  403, `NotFoundError` 404, `ConflictError` 409.
- Responde siempre `{ "error": { "code": "...", "message": "..." } }`.
- Cualquier otro error: 500 con un mensaje genérico, **sin stack ni detalles
  internos**. El detalle real se registra en consola.
- Un wrapper `asyncHandler` para que los handlers async pasen sus errores a
  `next(err)`. Los controllers no tienen `try/catch` propio.
- Una ruta inexistente responde 404 con el mismo formato.
- Un JSON mal formado en el body responde 400 con el mismo formato.
- El error handler **no conoce zod**: la traducción de errores de zod ocurre
  en el middleware `validar` (sección 3).

### 3. Validación de entrada con zod
**Dependencia nueva: `zod`** (fijada a una versión exacta, sin `^`). Justificación
para el plan: centraliza en un solo lugar la validación de forma y tipo de lo
que llega por HTTP (body, parámetros de ruta y query), incluido el rechazo de
parámetros no permitidos, y saca ese código de los controllers.

Reglas de uso:
- Los schemas viven en `src/schemas/`. Zod solo se importa en `src/schemas/`
  y en `src/middleware/validar.js`. **El dominio, los services, los
  repositorios y los controllers no importan zod.**
- Los schemas validan **forma y tipo** (string, número, entero, claves
  permitidas). Las reglas de negocio (cupo, estados, permisos, fechas) siguen
  en el dominio y siguen lanzando sus propios errores.
- Los schemas de query y params son `.strict()`: una clave no declarada es un
  error.

`src/middleware/validar.js` exporta `validar({ params, query, body })`
(cada uno opcional):
- Aplica `safeParse` a `req.params`, `req.query` y `req.body` con su schema,
  cuando se lo pasan.
- Si todo es válido, guarda los resultados parseados en
  `req.validado = { params, query, body }`. **No reasigna** `req.query` ni
  `req.params`, porque en Express 5 `req.query` es de solo lectura. Los
  controllers leen solo de `req.validado`.
- Si algo falla, lanza un `ValidationError` con `code` `VALIDATION_ERROR` y un
  `message` en español que resume los campos con error (por ejemplo
  `"email: es obligatorio"`). No expone la estructura interna de zod.
- Una clave repetida en la query (que Express entrega como arreglo) falla
  contra un schema de string, y esa falla queda como 400.

`src/schemas/comun.js` exporta `idSchema`: string que cumple
`^[A-Za-z0-9_-]{1,64}$`. Los specs siguientes lo reutilizan.

### 4. Usuario y repositorio
- `Usuario` en `src/domain/Usuario.js`: id, nombre, apellido, email,
  contraseña (guardada como hash), favoritos (lista de ids de evento, se usa
  en un spec posterior).
- Hash con `crypto` (`scrypt` con sal). La verificación usa comparación
  en tiempo constante (`timingSafeEqual`).
- `UsuarioRepository` como interfaz (`guardar`, `buscarPorId`,
  `buscarPorEmail`, `listar`) e implementación en memoria con `Map`.

### 5. Seed de usuarios
En `src/seed/`, un módulo que carga usuarios de ejemplo, **determinístico**
(siempre los mismos ids y credenciales):
- Al menos 3 usuarios: uno que va a organizar eventos, uno que va a comprar
  y uno que cumple los dos roles.
- Las credenciales del seed quedan documentadas en un comentario del módulo
  de seed (para usarlas en tests y en la prueba manual).

### 6. Login y middleware de autenticación
- `src/schemas/auth.js` exporta `loginBodySchema`: objeto `.strict()` con
  `email` y `password`, ambos strings no vacíos. **El email no se valida por
  formato**, para que un email mal escrito dé el mismo 401 que uno inexistente.
- `POST /auth/login` usa `validar({ body: loginBodySchema })` con
  `{ email, password }`:
  - Credenciales correctas: `{ token, usuario }`. El `usuario` **no incluye la
    contraseña ni su hash**.
  - Credenciales incorrectas: 401. El mensaje es el mismo si el email no
    existe o si la contraseña es incorrecta.
  - Falta email o password, tipo incorrecto (por ejemplo número) o claves de
    más: 400.
- Tokens: string aleatorio (`crypto.randomBytes`) guardado en un `Map`
  token → id de usuario, dentro de un servicio de sesiones.
- `src/middleware/auth.js`: lee `Authorization: Bearer <token>`, pone el
  usuario en `req.usuario` o responde 401.
- Se aplica a todas las rutas salvo `POST /auth/login`. Como todavía no hay
  otras rutas, se verifica con una ruta de prueba protegida (por ejemplo
  `GET /auth/yo`, que devuelve el usuario autenticado y **se mantiene** como
  endpoint útil para el front).

### 7. Cableado
- `app.js` recibe los repositorios y servicios por parámetro (o los arma en
  un único lugar), de modo que `crearApp` de los tests pueda crear estado
  nuevo en cada test.
- Se completa `test/helpers/login.js`: devuelve el token de un usuario del seed.
- Se crea la carpeta `src/schemas/` (y `test/middleware/` si hace falta).

### 8. Limpieza
- Eliminar `GET /salud` y `test/api/salud.test.js` del spec 00.

## Tests

`test/api/errores.test.js`
- Ruta inexistente: 404 con el formato unificado.
- JSON mal formado: 400 con el formato unificado.
- Un error inesperado en un handler: 500, sin stack ni detalles. (Usar una
  ruta o un handler de prueba solo dentro del test.)

`test/middleware/validar.test.js`
- Con params, query y body válidos: llama a `next()` sin error y
  `req.validado` tiene los valores parseados.
- Con cada uno inválido por separado: `next` recibe un `ValidationError`
  con `message` legible y sin detalles internos de zod.
- Clave de más en un schema `.strict()`: error.
- Clave repetida en la query (arreglo en vez de string): error.
- No modifica `req.query` ni `req.params`.

`test/api/auth.test.js`
- Login correcto devuelve token y usuario.
- La respuesta del login no contiene la contraseña ni su hash.
- Email inexistente y contraseña errónea: 401 con el mismo mensaje.
- Falta de email o password: 400. Email o password que no son strings
  (número, `null`, objeto): 400. Clave de más en el body: 400. Strings vacíos: 400.
- Email con formato inválido pero string no vacío: 401 (no 400).
- `GET /auth/yo` con token válido devuelve el usuario; sin token, con token
  inventado o con un esquema distinto de `Bearer`: 401.
- Dos logins del mismo usuario devuelven tokens distintos y ambos funcionan.

`test/domain/Usuario.test.js`
- El hash no es igual a la contraseña, verificar acepta la correcta y
  rechaza la incorrecta, dos hashes de la misma contraseña son distintos.

## Criterios de aceptación
- [ ] `npm test` completo pasa.
- [ ] Toda respuesta de error sigue `{ error: { code, message } }`.
- [ ] Ningún controller tiene `try/catch` ni arma respuestas de error a mano.
- [ ] Los errores de dominio no importan nada de Express.
- [ ] Zod solo se importa en `src/schemas/` y `src/middleware/validar.js`
  (verificar con `grep`).
- [ ] Los controllers leen la entrada solo de `req.validado`.
- [ ] Ninguna respuesta contiene la contraseña ni su hash.
- [ ] `package.json` tiene solo `express` y `zod` en `dependencies`, `zod` con versión exacta.
- [ ] `docs/architecture.md` coincide con lo implementado: se agrega
  `GET /auth/yo` a la tabla de endpoints, la capa y carpeta `schemas`, el
  middleware `validar` y que zod es dependencia.

## Fuera de este spec
- Registro de usuarios (no existe: solo hay usuarios del seed).
- Cierre de sesión y expiración de tokens.
- Eventos, compras y el resto de los endpoints.