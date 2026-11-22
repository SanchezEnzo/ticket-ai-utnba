# 04: Mensajes de la compra (chat)
 
## Casos de uso que cubre
- Como comprador, quiero poder enviar un mensaje al organizador del evento
  sobre una compra.
- Como organizador, quiero poder responder los mensajes de un comprador sobre
  una compra de mi evento.
## Documentos de referencia
- `docs/business-context.md`: sección 4 (mensajes de la compra) y sección 9
  (caso borde del tercero)
- `docs/architecture.md`: "Mensajería (chat de la compra)", "Validación de
  requests", "Dominio rico"
- `docs/testing.md`: sección 4.2 (Mensajes)
## Requisito previo
Spec `03c-compras-organizador.md` cerrado.
 
## Alcance
 
### 1. Dominio
 
**`Mensaje`**: id, autor (un `Usuario`), texto y fechaHora. Vive embebido en
`Compra.mensajes` (lista, vacía al crear la compra); no tiene repositorio propio.
 
`compra.enviarMensaje(usuario, texto)`
- Solo pueden escribir el **comprador de la compra** y el **organizador de ese
  evento**. Cualquier otro usuario: `ForbiddenError`.
- El texto, después de `trim`, no puede estar vacío ni superar los **1000
  caracteres**: `ValidationError`.
- Se puede enviar **en cualquier estado** de la compra (PENDIENTE, CONFIRMADA,
  UTILIZADA, CANCELADA y REEMBOLSADA) y también si el evento ya se realizó. Un
  mensaje no cambia el estado, el cupo ni el historial de la compra.
- `fechaHora` es `ahora()`, con una garantía: **dentro de una misma compra las
  fechas de los mensajes son estrictamente crecientes**. Si `ahora()` es
  menor o igual a la del último mensaje, el nuevo usa la del último más 1 ms.
  Esto evita que el polling con `desde` pierda mensajes enviados en el mismo
  milisegundo.
- Se guarda el texto ya recortado y devuelve el `Mensaje` creado.
`compra.leerMensajes(usuario, desde)`
- Mismo control de acceso que `enviarMensaje`: solo el comprador y el
  organizador de ese evento. Cualquier otro: `ForbiddenError`.
- `desde` es una fecha opcional. Sin `desde` devuelve todos los mensajes; con
  `desde` devuelve solo los de `fechaHora` **estrictamente posterior**.
- Devuelve los mensajes ordenados del más antiguo al más reciente.
La regla "nadie más puede leer ni escribir" vive en `Compra` (es una regla de
negocio de esa entidad). El service no compara ids.
 
### 2. Servicio
`MensajeService`:
- `enviar(compraId, usuario, texto)`: busca la compra (`NotFoundError` si no
  existe), llama a `compra.enviarMensaje` y persiste con
  `CompraRepository.guardar`.
- `listar(compraId, usuario, desde)`: busca la compra (`NotFoundError` si no
  existe) y devuelve `compra.leerMensajes(usuario, desde)`.
### 3. Seed
Agregar mensajes de ejemplo a algunas compras del seed (por ejemplo, un
intercambio de 3 mensajes entre comprador y organizador en la compra
CONFIRMADA, y uno en la REEMBOLSADA), con fechas anteriores a `ahora()` y
construidos a través de `enviarMensaje` para respetar las reglas. Sirve para
la prueba manual y para el video.
 
### 4. Validación con zod
Schemas en `src/schemas/mensaje.schema.js`, aplicados con `validar`. Los
controllers leen de `req.datos`.
- Params de las dos rutas: `compraIdParamsSchema` (de `compra.schema.js`).
- `listarMensajesQuerySchema` (`GET`), `.strict()`: `desde` opcional, string
  en formato ISO 8601 con zona horaria (por ejemplo
  `2027-03-10T15:00:00.000Z`). Un `desde` con formato inválido (`"ayer"`,
  `"2027-03-10"` sin hora, vacío), un parámetro repetido o una clave no
  declarada responden 400. El schema entrega `desde` ya convertido a `Date`.
- `enviarMensajeBodySchema` (`POST`), `.strict()`: `texto` string con `trim`,
  longitud entre 1 y 1000. Un `texto` que no es string, vacío, solo con
  espacios o con más de 1000 caracteres responde 400. Claves de más: 400.
- `POST` no recibe query: `sinQuerySchema`.
- `Compra.enviarMensaje` **también** valida el texto (duplicación
  intencional, ver spec 01).
### 5. Endpoints
Ambos requieren autenticación.
 
**`GET /compras/:id/mensajes?desde=`**: 200 con un arreglo de mensajes,
ordenados del más antiguo al más reciente. Vacío si no hay.
- 400 por schema (id inválido, `desde` inválido o repetido, claves de más).
- 403 si el usuario no es el comprador ni el organizador del evento.
- 404 si la compra no existe.
**`POST /compras/:id/mensajes`**: body `{ "texto": "..." }`. 201 con el
mensaje creado.
- 400 por schema (texto vacío, de más de 1000 caracteres, no string, claves de
  más, id inválido).
- 403 si el usuario no es el comprador ni el organizador del evento.
- 404 si la compra no existe.
**Forma de un mensaje**
```json
{
  "id": "...",
  "autor": { "id": "...", "nombre": "...", "apellido": "..." },
  "texto": "...",
  "fechaHora": "2027-03-10T15:00:00.000Z"
}
```
- El autor **nunca** incluye email, contraseña ni hash.
- La respuesta de una compra (`GET /compras`, `GET /eventos/:id/compras`) **no**
  incluye los mensajes: se piden por este endpoint.
- No hay conexiones persistentes: ni WebSockets, ni SSE, ni long polling. El
  front consulta cada 60 segundos con `desde` (esa parte es del spec del front).
### 6. Documentación
Actualizar `docs/architecture.md`: `Mensaje`, `Compra.enviarMensaje` y
`Compra.leerMensajes`, el schema `mensaje.schema.js`, y la garantía de fechas
crecientes de los mensajes.
 
## Tests
 
`test/domain/Mensaje.test.js` (o dentro de `Compra.test.js`)
- El comprador envía: el mensaje queda en `compra.mensajes` con autor, texto
  recortado y fecha.
- El organizador del evento envía.
- **Un tercero que envía: `ForbiddenError`.** El organizador de otro evento:
  `ForbiddenError`. Nada cambia en la compra.
- Texto vacío, solo espacios y de 1001 caracteres: `ValidationError`; de
  exactamente 1000 caracteres funciona.
- **Se puede enviar en los 5 estados** de la compra, por el comprador y por el
  organizador (tabla de casos estado x autor). Para llegar a cada estado se
  usa `actualizarEstado`.
- Enviar un mensaje no cambia estado, cupo ni historial.
- Fechas estrictamente crecientes: con el reloj fijado (`fijarAhora`), tres
  mensajes seguidos tienen fechas distintas y crecientes, y siempre se
  restaura el reloj.
- `leerMensajes`: sin `desde` trae todos, ordenados; con `desde` trae solo los
  posteriores; con `desde` igual a la fecha del último mensaje trae una lista
  vacía; con `desde` futura, lista vacía.
- Un tercero que lee: `ForbiddenError`.
`test/api/mensajes.test.js`
- Comprador y organizador envían y leen, en ambos sentidos (conversación de
  ida y vuelta), y el orden es cronológico.
- **Un tercero no puede leer (403) ni escribir (403).** Probar con un usuario
  sin relación y con el organizador de otro evento.
- Enviar mensajes en una compra PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA y
  REEMBOLSADA: 201 en todas.
- Compra inexistente: 404 en GET y POST. Sin token: 401.
- `desde`: devuelve solo los mensajes posteriores; sin `desde`, todos; con la
  fecha del último mensaje, vacío; flujo de polling (leer todo, guardar la
  fecha del último, enviar uno nuevo, leer con `desde` y recibir solo el nuevo).
- `desde` inválido (`"ayer"`, `"2027-03-10"`, vacío): 400. `desde` repetido: 400.
  Otro parámetro de query: 400.
- `POST` con texto vacío, solo espacios, no string, 1001 caracteres: 400;
  con 1000 caracteres: 201. Claves de más en el body: 400.
- `:id` de formato inválido: 400.
- Enviar un mensaje no cambia el estado de la compra ni el `cupoDisponible`
  (verificar con `GET /compras` y `GET /eventos/:id`).
- `GET /compras` y `GET /eventos/:id/compras` no incluyen `mensajes`.
- Los mensajes del seed se leen correctamente.
- Ninguna respuesta contiene email, contraseña ni hash.
## Criterios de aceptación
- [ ] `npm test` completo pasa y se muestra la salida.
- [ ] Los casos borde de `business-context.md` sección 9 sobre el chat tienen
  test (tercero lee o escribe).
- [ ] La regla de quién puede leer y escribir vive en `Compra`; el service y
  el controller no comparan ids.
- [ ] Se puede escribir en los 5 estados de la compra (verificado en tests).
- [ ] Las fechas de los mensajes de una compra son estrictamente crecientes.
- [ ] No hay WebSockets, SSE ni long polling.
- [ ] Params, query y body se validan con zod; los controllers leen de
  `req.datos`.
- [ ] Ningún `new Date(` ni `Date.now(` fuera de `reloj.js`.
- [ ] `package.json` sigue teniendo solo `express` y `zod`.
- [ ] `docs/architecture.md` actualizado.
## Fuera de este spec
- La pantalla del chat y el polling cada 60 segundos (front).
- Mensajes leídos o no leídos, notificaciones, edición o borrado de mensajes,
  adjuntos, paginación.
 