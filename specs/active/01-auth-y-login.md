# 01: Errores y autenticación

## Objetivo
Tener el manejo de errores unificado y el login funcionando, para que todos
los specs siguientes devuelvan errores con el mismo formato y sepan quién es
el usuario autenticado.

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

### 3. Usuario y repositorio
- `Usuario` en `src/domain/Usuario.js`: id, nombre, apellido, email,
  contraseña (guardada como hash), favoritos (lista de ids de evento, se usa
  en un spec posterior).
- Hash con `crypto` (`scrypt` con sal). La verificación usa comparación
  en tiempo constante (`timingSafeEqual`).
- `UsuarioRepository` como interfaz (`guardar`, `buscarPorId`,
  `buscarPorEmail`, `listar`) e implementación en memoria con `Map`.

### 4. Seed de usuarios
En `src/seed/`, un módulo que carga usuarios de ejemplo, **determinístico**
(siempre los mismos ids y credenciales):
- Al menos 3 usuarios: uno que va a organizar eventos, uno que va a comprar
  y uno que cumple los dos roles.
- Las credenciales del seed quedan documentadas en un comentario del módulo
  de seed (para usarlas en tests y en la prueba manual).

### 5. Login y middleware de autenticación
- `POST /auth/login` con `{ email, password }`:
  - Credenciales correctas: `{ token, usuario }`. El `usuario` **no incluye la
    contraseña ni su hash**.
  - Credenciales incorrectas: 401. El mensaje es el mismo si el email no
    existe o si la contraseña es incorrecta.
  - Falta email o password: 400.
- Tokens: string aleatorio (`crypto.randomBytes`) guardado en un `Map`
  token → id de usuario, dentro de un servicio de sesiones.
- `src/middleware/auth.js`: lee `Authorization: Bearer <token>`, pone el
  usuario en `req.usuario` o responde 401.
- Se aplica a todas las rutas salvo `POST /auth/login`. Como todavía no hay
  otras rutas, se verifica con una ruta de prueba protegida (por ejemplo
  `GET /auth/yo`, que devuelve el usuario autenticado y **se mantiene** como
  endpoint útil para el front).

### 6. Cableado
- `app.js` recibe los repositorios y servicios por parámetro (o los arma en
  un único lugar), de modo que `crearApp` de los tests pueda crear estado
  nuevo en cada test.
- Se completa `test/helpers/login.js`: devuelve el token de un usuario del seed.

### 7. Limpieza
- Eliminar `GET /salud` y `test/api/salud.test.js` del spec 00.

## Tests

`test/api/errores.test.js`
- Ruta inexistente: 404 con el formato unificado.
- JSON mal formado: 400 con el formato unificado.
- Un error inesperado en un handler: 500, sin stack ni detalles. (Usar una
  ruta o un handler de prueba solo dentro del test.)

`test/api/auth.test.js`
- Login correcto devuelve token y usuario.
- La respuesta del login no contiene la contraseña ni su hash.
- Email inexistente y contraseña errónea: 401 con el mismo mensaje.
- Falta de email o password: 400.
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
- [ ] Ninguna respuesta contiene la contraseña ni su hash.
- [ ] `package.json` sigue teniendo solo `express`.
- [ ] `docs/architecture.md` coincide con lo implementado (se agrega
  `GET /auth/yo` a la tabla de endpoints).

## Fuera de este spec
- Registro de usuarios (no existe: solo hay usuarios del seed).
- Cierre de sesión y expiración de tokens.
- Eventos, compras y el resto de los endpoints.