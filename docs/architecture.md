# Arquitectura: AI Ticket It

Decisiones técnicas del proyecto. Las reglas de negocio están en
`docs/business-context.md`; acá solo se define **cómo** se construye.

## 1. Stack

- **Backend** (`backend/`): Node.js + Express, JavaScript, API REST.
  Persistencia en memoria, sin base de datos.
- **Mobile** (`mobile/`): React Native con Expo, corriendo en un dispositivo
  físico que se conecta al backend por la red local.
- Dependencias del backend aprobadas: `express` y `zod`. Cualquier otra se
  consulta antes de agregarla.
  Gestor de paquetes: pnpm (no usar npm ni yarn). Las dependencias se agregan con versión exacta: pnpm add --save-exact.

## 2. Convenciones

- Las entidades de dominio se nombran en español, como en el diagrama del
  TP: `Evento`, `TipoEntrada`, `Compra`, `Usuario`, `Resenia`, etc.
- Las carpetas y capas técnicas se nombran en inglés: `controllers`,
  `services`, `repositories`.
- Backend en JavaScript con módulos ES (import/export), extensión .js explícita en los imports
- Los textos que ve el usuario en la app están en español.
- **Reloj:** nunca se usa `new Date()` ni `Date.now()` fuera de
  `src/domain/reloj.js`. Todo el código obtiene la hora actual con `ahora()`,
  lo que permite fijar el tiempo en los tests (`fijarAhora`, `restaurarReloj`).
  `diasCalendario(desde, hasta)` cuenta días de calendario en hora de Buenos
  Aires (`America/Argentina/Buenos_Aires`).

## 3. Backend

### Capas y dependencias

```
routes → controllers → services → domain
                          ↓
                    repositories (interfaz + implementación en memoria)
```

- Cada capa solo conoce a la de su derecha. El dominio no conoce a nadie.
- Las rutas aplican, antes del controller, el middleware de autenticación y
  el de validación (ver "Validación de requests").

| Capa | Responsabilidad | No debe hacer |
|---|---|---|
| routes | Asociar URL y método HTTP a un controller, aplicando autenticación y validación | Lógica |
| controllers | Leer la request ya validada, llamar a un service, armar la respuesta | Validar a mano, reglas de negocio, try/catch propio |
| services | Orquestar casos de uso, usar repositorios y verificar el **acceso a recursos** (por ejemplo, ¿es el organizador de este evento para ver sus compras?) | Reglas de estados o de cupo, y permisos que forman parte de una transición de estado |
| domain | Reglas de negocio dentro de las entidades, incluidos los permisos de cada transición de estado (quién puede cambiar el estado de una compra) | Conocer HTTP ni repositorios |
| repositories | Guardar y buscar entidades | Reglas de negocio |

### Dominio rico

La lógica vive en las entidades, no en los services:

- `TipoEntrada`: tiene `cupo` (total) y `cupoDisponible`. Métodos
  `hayCupoPara(cantidad)`, `reservar(cantidad)`, `liberar(cantidad)`. El cupo
  disponible nunca queda negativo ni supera el cupo total.
- `Compra`:
  - `Compra.crear({ comprador, evento, tipoEntrada, cantidad })` valida la
    cantidad y el cupo, reserva el cupo, calcula el total y nace PENDIENTE.
  - `actualizarEstado(nuevoEstado, usuario)` valida la transición permitida
    (tabla de la sección 3 de `business-context.md`), valida que `usuario`
    sea quien corresponde (comprador u organizador de ese evento) y registra
    un `CambioEstadoCompra` en su `historial` (embebido en la compra).
  - Al cancelar, libera el cupo en su `TipoEntrada`. Si la compra estaba
    CONFIRMADA, registra enseguida el reembolso automático (estado
    REEMBOLSADA, quién = `SISTEMA`).
  - `diasParaEvento()` devuelve los días que faltan solo si está CONFIRMADA.
  - Un cambio que falla no deja rastro (ni estado, ni cupo, ni historial).
- `Evento`: `tuPrecioEstaEntre(min, max)`, `precioDesde()`, `yaSeRealizo()`,
  `esOrganizadoPor(usuario)`.
- `SISTEMA`: constante que representa al sistema como actor de los cambios
  automáticos.
- Las transiciones de estado inválidas lanzan `ConflictError`; el usuario
  incorrecto, `ForbiddenError`. Nunca se ignoran.
- Los schemas de Zod no reemplazan estas validaciones: el dominio protege
  sus invariantes aunque no lo llamen desde la API.

### Entidades

Las del diagrama del TP: `Usuario`, `Evento`, `Categoria`, `TipoEntrada`,
`Compra`, `EstadoCompra` (enum), `CambioEstadoCompra`, `Mensaje`, `Resenia`.

- Los ids son strings generados en el backend.
- Las fechas viajan como string ISO 8601.
- Los montos son números (`Number`).
- `Resenia` tiene su propio repositorio, `Mensaje` esta embebido en `Compra`.

### Persistencia en memoria

- Cada repositorio tiene una interfaz (métodos como `guardar`, `buscarPorId`,
  `listarPorComprador`, `listarPorEvento`) y una implementación sobre `Map` o arrays.
- Al arrancar, un módulo de seed carga datos de ejemplo: usuarios,
  categorías, eventos con varios tipos de entrada y compras en distintos
  estados. El seed es un script determinístico, siempre igual, con fechas
  relativas a `ahora()`.
- No hay registro de usuarios: existen solo los del seed.

### Autenticación

- `POST /auth/login` recibe email y contraseña y devuelve un token.
- `GET /auth/yo` devuelve el usuario autenticado.
- Los tokens son strings aleatorios guardados en un `Map` en
  memoria; el front los manda en `Authorization: Bearer <token>`.
- Un middleware de autenticación pone al usuario en `req.usuario`.
- Las contraseñas se guardan con hash usando el módulo `crypto`
  de Node, y nunca se devuelven en una respuesta.

### Validación de requests

- Todo lo que llega en la request (`params`, `query` y `body`) se valida con
  schemas de Zod antes de llegar al controller.
- Cada endpoint tiene su schema, definido en `src/schemas/` (un archivo por
  recurso: `compra.schema.js`, `evento.schema.js`, etc.). Un schema tiene la
  forma `{ params, query, body }`, y cada parte es opcional.
- Un middleware `validar(schema)` se aplica en la ruta, después de la
  autenticación. Si la request es válida, deja los datos ya convertidos en
  `req.datos` (`req.datos.params`, `req.datos.query`, `req.datos.body`) y el
  controller lee de ahí, no de `req.body` ni de `req.query`. No reasigna
  `req.query` ni `req.params` (en Express 5 `req.query` es de solo lectura).
- Zod solo se importa en `src/schemas/` y en `src/middleware/validar.js`. El
  dominio, los services, los repositorios y los controllers no lo conocen.
- Los valores de `params` y `query` llegan siempre como string: los schemas
  los convierten al tipo correcto (por ejemplo, `z.coerce.number()`). El body
  JSON **no se coerciona**: un texto donde va un número (`"2"`) es un error.
- Los schemas de `params` y `query` son `.strict()`: una clave no declarada
  es un error, igual que un parámetro repetido (que Express entrega como
  arreglo). Los schemas de body también son `.strict()`.
- Zod valida la **forma** del dato: campos obligatorios, tipos, formatos y
  rangos (por ejemplo, `cantidad` entero >= 1, `puntaje` entre 1 y 5 en
  pasos de 0,5, `orden` solo `precio`, `fecha` o `puntaje`).
- Las **reglas de negocio** (cupo disponible, estados, permisos) NO se
  validan con Zod: viven en el dominio y en los services.
- Si la validación falla, el propio middleware `validar` lanza un
  `ValidationError` (ver "Manejo de errores"). El middleware de errores no
  conoce a Zod.

### Manejo de errores

- Las reglas de negocio lanzan errores de dominio (clases que extienden
  `DomainError`: `NotFoundError`, `ValidationError`, `ForbiddenError`,
  `ConflictError`, `UnauthorizedError`). Nunca devuelven códigos HTTP ni usan `res`.
- Los controllers NO tienen try/catch propio: pasan los errores con
  `next(err)` (o usan un wrapper para handlers async).
- Un único middleware de errores, registrado al final de `app.js`, traduce
  cada tipo de error a su status HTTP y responde siempre con el mismo
  formato: `{ "error": { "code": "...", "message": "..." } }`.

| Error | Status | Cuándo |
|---|---|---|
| `ValidationError` | 400 | Datos mal formados o fuera de rango (incluye los fallos de Zod, con `code` `VALIDATION_ERROR`, y el `message` resume los campos inválidos) |
| `UnauthorizedError` | 401 | Token ausente o inválido, credenciales erróneas |
| `ForbiddenError` | 403 | El usuario no tiene relación con el recurso |
| `NotFoundError` | 404 | El recurso no existe (también rutas inexistentes) |
| `ConflictError` | 409 | Transición de estado inválida, sin cupo, evento ya realizado |
| desconocido | 500 | Sin exponer detalles internos |

- Un JSON mal formado en el body responde 400 con el mismo formato.

### Endpoints

Todos requieren autenticación salvo el login.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/yo` | Usuario autenticado |
| GET | `/categorias` | Listar categorías |
| GET | `/eventos?q=&categoria=&orden=` | Buscar, filtrar y ordenar eventos |
| GET | `/eventos/:id` | Detalle de un evento |
| POST | `/eventos` | Crear evento con sus tipos de entrada |
| GET | `/eventos/:id/compras` | Compras del evento (solo su organizador) |
| GET | `/eventos/:id/resenias` | Reseñas de un evento |
| POST | `/eventos/:id/resenias` | Dejar una reseña |
| GET | `/compras` | Mis compras |
| POST | `/compras` | Crear compra (queda PENDIENTE y reserva cupo) |
| POST | `/compras/:id/pago` | Pago simulado (PENDIENTE → CONFIRMADA) |
| POST | `/compras/:id/uso` | Marcar como UTILIZADA (solo el organizador) |
| POST | `/compras/:id/cancelacion` | Cancelar (y reembolsar si corresponde) |
| GET | `/compras/:id/mensajes?desde=` | Mensajes de la compra |
| POST | `/compras/:id/mensajes` | Enviar mensaje |
| GET | `/favoritos` | Mis favoritos |
| PUT | `/favoritos/:eventoId` | Marcar favorito |
| DELETE | `/favoritos/:eventoId` | Quitar favorito |

- `orden` acepta `precio`, `fecha` y `puntaje`.
- Los cambios de estado son acciones (`/pago`, `/uso`, `/cancelacion`) y no
  un `PUT` genérico de estado, para que cada regla tenga su propio endpoint.

### Mensajería (chat de la compra)

- Se implementa con API REST. No hay conexiones persistentes (sin WebSockets
  ni SSE).
- El front actualiza la conversación con polling cada 60 segundos.
- `GET /compras/:id/mensajes?desde=<fecha ISO>` devuelve solo los mensajes
  posteriores a `desde` (o todos si se omite).
- Solo el comprador y el organizador del evento pueden usar estos endpoints.
- Front: el polling se inicia al abrir la pantalla del chat y se cancela al
  salir (limpieza del intervalo). Además se refresca de inmediato al abrir
  la pantalla y después de enviar un mensaje.

### Estructura de carpetas

```
backend/
  src/
    app.js              # configura Express, rutas y middleware de errores
    server.js           # levanta el servidor
    routes/
    controllers/
    services/
    domain/             # entidades, enums, errores de dominio y reloj.js
    repositories/       # interfaces e implementaciones en memoria
    schemas/            # schemas de Zod, uno por recurso
    middleware/         # autenticación, validación y manejo de errores
    seed/               # datos de ejemplo
  test/
```

### Clases e inyección de dependencias

- Controllers y services son **clases**. Los repositorios ya lo son.
- Las dependencias se inyectan por constructor, recibiendo un único objeto:
  `new AuthService({ usuarioRepository, sesionService })`.
- Los handlers de un controller son **arrow functions como class fields**
  (`login = async (req, res) => {}`), para no perder `this` cuando Express
  los invoca. Las rutas pasan `controller.login` sin `bind`.
- El composition root (`server.js`) instancia repositorios, luego services
  y luego controllers, en ese orden. Ninguna clase importa a otra para
  instanciarla.
- Los middlewares (`auth`, `validar`, `asyncHandler`) siguen siendo
  funciones factory.
- Los services lanzan errores de dominio; los controllers no tienen
  try/catch propio.

## 4. Mobile

- Expo con React Native.
- Navegación con React Navigation.
- El front no contiene reglas de negocio: muestra lo que devuelve la API y
  maneja el estado de las pantallas. Si una acción no corresponde (por
  ejemplo, cancelar una compra UTILIZADA), el front puede ocultar el botón,
  pero la validación real vive en el backend.

### Estructura de carpetas

```
mobile/
  src/
    api/            # cliente HTTP: un solo lugar que sabe la URL base y el token
    screens/        # una carpeta o archivo por pantalla
    components/     # componentes reutilizables
    navigation/
    context/        # sesión del usuario (token y datos)
    hooks/          # por ejemplo usePolling
```

### Conexión con el backend

- El celular se conecta al backend por la IP de la PC en la red local, no
  por `localhost`.
- La URL base se configura con una variable de entorno de Expo
  (`EXPO_PUBLIC_API_URL`), nunca escrita a mano en el código.
- Los errores de la API se muestran al usuario con el `message` que viene en
  el formato de error unificado.

## 5. Validación

Cómo correr y probar el proyecto está en `docs/testing.md`.