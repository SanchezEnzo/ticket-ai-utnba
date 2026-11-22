# 08d: Mobile, chat de la compra (polling cada 60 segundos)
 
## Casos de uso que cubre
- Como comprador, quiero enviar mensajes en cualquier momento relacionados a
  una compra mediante un chat dentro de la misma.
- Como organizador, quiero responder mensajes en cualquier momento
  relacionados a una compra mediante un chat dentro de la misma.
## Documentos de referencia
- Spec del backend `04-mensajes.md`
- `docs/architecture.md`: "Mensajería (chat de la compra)" y sección 4 (Mobile)
- `docs/testing.md`: sección 5, filas 14 y 15
- Las reglas de todo el mobile están en `08a-mobile-base.md`
## Requisito previo
Spec `08d-mobile-organizador.md` cerrado.
 
## Alcance
 
### 1. API
`src/api/mensajes.js`: `listarMensajes(compraId, { desde }, token)` (si hay
`desde`, se envía como ISO 8601 con zona horaria, tal como lo devolvió el
servidor) y `enviarMensaje(compraId, texto, token)`.
 
### 2. Hook de polling
`src/hooks/usePolling.js`: `usePolling(funcion, intervaloMs, { activo })`.
- Ejecuta `funcion` cada `intervaloMs` (60000 en el chat) **mientras `activo`
  sea verdadero**, y limpia el intervalo cuando deja de estarlo o cuando el
  componente se desmonta.
- Siempre llama a la versión más reciente de `funcion` (sin reiniciar el
  intervalo en cada render).
- No lanza una consulta nueva si la anterior sigue en curso.
- En desarrollo (`__DEV__`) escribe en consola cuándo arranca, cuándo se
  ejecuta y cuándo se detiene, para poder verificar la fila 15.
- **No hay WebSockets, SSE ni long polling.**
### 3. Pantalla de chat
- Recibe el id de la compra y un título (el nombre del evento; para el
  organizador, también el nombre del comprador).
- Puntos de entrada: botón **"Mensajes"** en cada tarjeta de la pestaña
  Compras (spec 08c) y en cada compra de la pantalla de compras del evento
  (spec 08d). Está disponible **en cualquier estado** de la compra, incluso
  cancelada o reembolsada.
- Al abrir: consulta todos los mensajes (`GET` sin `desde`) y los muestra del
  más antiguo al más reciente, con la lista desplazada al final.
- **Polling:** mientras la pantalla está enfocada, cada 60 segundos consulta
  con `desde` igual a la `fechaHora` del último mensaje conocido (sin `desde`
  si todavía no hay mensajes) y **agrega** los nuevos, sin duplicar (se
  descartan los ids que ya están). Al salir de la pantalla o perder el foco, el
  polling se detiene; al volver, se refresca de inmediato y se reanuda.
- **Envío:** campo de texto multilínea (máximo 1000 caracteres, con
  contador) y botón "Enviar", deshabilitado si el texto está vacío o solo
  tiene espacios, o mientras se envía. Con `POST` exitoso se limpia el campo y
  **se refresca de inmediato** (consulta con `desde`), sin esperar el próximo
  ciclo. Si el envío falla, el texto **se conserva** y se muestra el `message`.
- Presentación: los mensajes propios (`autor.id` igual al del usuario) a la
  derecha y los del otro a la izquierda, con nombre y hora. El front no
  decide quién puede escribir: esa regla la hace el backend (403).
- Si el polling falla, se muestra un aviso discreto ("No se pudo actualizar")
  **sin borrar los mensajes** ya cargados y se reintenta en el próximo ciclo.
  Un 403 o 404 muestra el mensaje y vuelve atrás.
- Estados: cargando (primera vez), error con "Reintentar" (si la primera
  carga falla) y vacío ("Todavía no hay mensajes. Escribí el primero.").
- El teclado no tapa el campo de envío.
## Criterios de aceptación
- [ ] `npx expo-doctor` sin errores nuevos.
- [ ] **Fila 14:** con dos usuarios (comprador y organizador, cada uno en su
  dispositivo o un dispositivo y un cliente HTTP), el mensaje enviado aparece
  de inmediato en el emisor y en el otro dentro de los 60 segundos.
- [ ] **Fila 15:** al salir del chat, el polling se detiene (se ve el log de
  desarrollo y el backend deja de recibir consultas de ese cliente).
- [ ] Se puede enviar un mensaje en una compra CANCELADA o REEMBOLSADA.
- [ ] Un mensaje enviado en el mismo milisegundo que otro no se pierde (el
  polling con `desde` los trae a todos).
- [ ] Un envío fallido conserva el texto escrito.
- [ ] Doble toque en "Enviar" no duplica el mensaje.
- [ ] El polling no se acumula: abrir y cerrar el chat varias veces no deja
  intervalos activos.
- [ ] No hay WebSockets, SSE ni long polling en el código.
- [ ] Sin dependencias nuevas fuera de las aprobadas.
## Fuera de este spec
- Notificaciones, indicador de mensajes no leídos, adjuntos, edición o borrado.
 