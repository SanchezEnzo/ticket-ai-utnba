# 08f: Mobile, reseñas, cancelación y reembolso, y cierre
 
## Casos de uso que cubre
- Como comprador, quiero poder puntuar el evento de forma numérica y dejar un
  comentario escrito una vez utilizada la entrada.
- Como comprador, quiero cancelar una compra para obtener el reembolso si no
  puedo asistir.
- Cierre del front: estados vacíos, de carga y de error, y revisión completa.
## Documentos de referencia
- Specs del backend `03b-compras-cancelar.md` y `05-resenias.md`
- `docs/architecture.md`: sección 4 (Mobile)
- `docs/testing.md`: sección 5 (las 16 filas)
- Las reglas de todo el mobile están en `08a-mobile-base.md`
## Requisito previo
Spec `08e-mobile-chat.md` cerrado.
 
## Alcance
 
### 1. API
`src/api/compras.js` (se amplía): `cancelarCompra(id, token)`.
`src/api/eventos.js` (se amplía): `crearResenia(eventoId, { puntaje, comentario }, token)`.
`puntaje` viaja como **número**.
 
### 2. Cancelar una compra
- En cada tarjeta de la pestaña Compras, el botón **"Cancelar compra"** se
  muestra solo en estado PENDIENTE y CONFIRMADA (se oculta en UTILIZADA,
  CANCELADA y REEMBOLSADA). Es una ayuda visual: el backend es quien decide, y
  si responde con un error (por ejemplo, evento ya realizado) se muestra su
  `message`.
- Pide confirmación con un texto informativo según el estado: en PENDIENTE,
  "No se realizó ningún pago, así que no hay reembolso."; en CONFIRMADA, "Se
  te reembolsará el importe."
- Llama a `POST /compras/:id/cancelacion` y vuelve a consultar la lista. Se
  muestra el estado final que devuelve la API: CANCELADA para una PENDIENTE y
  **REEMBOLSADA** para una CONFIRMADA, con el historial que incluye al
  "Sistema" como autor del reembolso.
- Sin doble envío; los errores se muestran con el `message` de la API.
### 3. Reseñar
- En la pestaña Compras, una compra **UTILIZADA** muestra **"Dejar reseña"**.
- Pantalla de reseña: selector de puntaje de 1 a 5 **en pasos de 0,5**
  (botones − y + que muestran `★ 4.5`, o una fila de opciones), comentario
  multilínea (obligatorio, hasta 1000 caracteres, con contador) y botón "Enviar".
- `POST /eventos/:id/resenias`. Con éxito (201) muestra "¡Gracias por tu
  reseña!" y vuelve atrás.
- **No se pre-verifica** si el usuario ya reseñó: el segundo intento es
  rechazado por la API (409) y se muestra su `message` (fila 12 de la prueba
  manual). Cualquier otro error (403, 400) también se muestra tal cual.
- Estados: sin doble envío, comentario vacío deshabilitado en el botón.
### 4. Cierre del front
- **Estados vacío, cargando y error** consistentes en todas las pantallas con
  lista o detalle: `EstadoVacio`, `Cargando` y `ErrorMensaje` con
  "Reintentar". Ninguna pantalla queda en blanco ante un error.
- **Sesión expirada:** cualquier llamada autenticada que reciba 401 lleva al
  login con el aviso (ya implementado en 08a; se verifica en todo el flujo).
- **Teclado:** ningún formulario (login, compra, crear evento, chat, reseña)
  queda tapado por el teclado.
- **Accesibilidad básica:** `accessibilityLabel` en botones de ícono (favorito,
  más, menos, agregar o quitar), estados que no dependen solo del color y
  áreas táctiles de al menos 44 px.
- **Limpieza:** sin `console.log` sueltos (solo los del polling bajo
  `__DEV__`), sin código muerto ni pantallas "Próximamente", sin URLs ni
  credenciales escritas en el código.
- Actualizar `mobile/README.md` con los pasos finales de ejecución y los
  usuarios del seed (credenciales de prueba).
### 5. Revisión final
Recorrer las **16 filas** de `docs/testing.md` sección 5 en el celular físico,
con dos usuarios del seed, y dejar el resultado por escrito (cada fila:
"pasa" o qué falla y por qué).
 
## Criterios de aceptación
- [ ] `npx expo-doctor` sin errores nuevos.
- [ ] **Fila 12:** el comprador reseña con puntaje de 1 a 5 (con pasos de 0,5)
  y comentario; una segunda reseña es rechazada con el mensaje de la API.
- [ ] **Fila 13:** cancelar una compra CONFIRMADA termina en REEMBOLSADA y el
  cupo vuelve (verificar en el detalle del evento).
- [ ] Cancelar una compra PENDIENTE termina en CANCELADA sin reembolso.
- [ ] El botón de cancelar no aparece en compras UTILIZADA, CANCELADA ni REEMBOLSADA.
- [ ] `puntaje` viaja como número en el body.
- [ ] Las 16 filas de la prueba manual verificadas y documentadas.
- [ ] No quedan pantallas "Próximamente".
- [ ] Ninguna pantalla llama a `fetch` directamente ni contiene reglas de negocio.
- [ ] Sin dependencias nuevas fuera de las aprobadas.
## Fuera de este spec
- Editar o borrar reseñas, notificaciones, modo oscuro, internacionalización.
- Tests automáticos del front (decisión de alcance del proyecto).
 