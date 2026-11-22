# 08c: Mobile, comprar entradas, pago simulado y Mis compras
 
## Casos de uso que cubre
- Como comprador, quiero realizar una compra eligiendo un tipo de entrada y
  una cantidad, sin superar el cupo disponible.
- Como comprador, quiero ver mis compras, diferenciando con claridad el estado
  y cuántos días faltan cuando está confirmada.
## Documentos de referencia
- Specs del backend `03a-compras-crear.md` (formas de respuesta, errores) y
  `03b-compras-cancelar.md`
- `docs/architecture.md`: sección 4 (Mobile)
- `docs/testing.md`: sección 5, filas 6, 7, 8 y 9
- Las reglas de todo el mobile están en `08a-mobile-base.md`
## Requisito previo
Spec `08b-mobile-catalogo.md` cerrado.
 
## Alcance
 
### 1. API
`src/api/compras.js`: `crearCompra({ eventoId, tipoEntradaId, cantidad }, token)`,
`pagarCompra(id, token)` y `listarMisCompras(token)`. En el body, `cantidad`
es un **número** (no un string): el backend rechaza `"2"`.
 
### 2. Comprar (desde el detalle del evento)
- El detalle del evento (spec 08b) agrega el botón **"Comprar entradas"**, que
  abre la pantalla de compra. Se oculta, con un texto explicativo, cuando el
  usuario es el organizador del evento ("Sos el organizador de este evento")
  y cuando el evento ya se realizó. Es solo una ayuda visual: si el usuario
  igual llegara a comprar, la API responde con el error correspondiente.
- **Pantalla de compra**: lista de tipos de entrada seleccionables (nombre,
  precio, "Quedan N"; un tipo agotado se ve deshabilitado) y la cantidad con
  botones − y + **y** teclado numérico. La cantidad mínima en pantalla es 1,
  **pero no se limita al cupo disponible**: el cupo lo valida el servidor, y
  su mensaje de error es lo que ve el usuario (fila 7 de la prueba manual).
- Muestra un "Total estimado" (precio por cantidad) aclarando que el total
  definitivo lo calcula el servidor.
- Al confirmar: `POST /compras`. Mientras se envía, el botón está en estado de
  carga y no permite doble envío. Si la API devuelve error (cupo insuficiente,
  evento ya realizado, etc.), se muestra su `message` en la pantalla sin
  perder lo cargado.
- Si sale bien (201), se muestra el **resumen con los datos que devolvió la
  API** (evento, tipo, cantidad, total, estado PENDIENTE) y dos botones:
  **"Pagar ahora (simulado)"** y **"Pagar más tarde"**.
- "Pagar ahora" llama a `POST /compras/:id/pago`. Con éxito muestra "¡Compra
  confirmada!" y lleva a la pestaña Compras. Un error se muestra en pantalla.
  "Pagar más tarde" vuelve al detalle y la compra queda PENDIENTE.
- Al volver al detalle del evento, el cupo se **refresca** (se vuelve a
  consultar `GET /eventos/:id`), y el cupo mostrado es el que informa la API.
### 3. Pestaña Compras
- Consulta `GET /compras` al abrir y cada vez que la pestaña recupera el foco,
  y permite "arrastrar para actualizar".
- Una tarjeta por compra con: nombre y fecha del evento, tipo de entrada y
  cantidad, total y el **estado**. Estados de compra (`EstadoBadge`):
  - PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA y REEMBOLSADA se distinguen
    por **texto, ícono y color** (nunca solo por color).
  - Si el estado es CONFIRMADA, se muestra `textoDias(diasParaEvento)` con el
    valor que devuelve la API ("Faltan 10 días", "Mañana", "El evento es hoy").
    El front no calcula días.
- Una compra PENDIENTE tiene el botón **"Pagar"** (misma llamada que en la
  pantalla de compra).
- **Historial**: un control "Ver historial" despliega los cambios de estado
  con estado, quién (nombre y apellido, o "Sistema" para el reembolso
  automático) y fecha y hora.
- El orden es el de la API. Estados vacío ("Todavía no hiciste compras"),
  cargando y error con "Reintentar".
- Los botones de mensajes, reseña y cancelación se agregan en los specs 08e y 08f.
## Criterios de aceptación
- [ ] `npx expo-doctor` sin errores nuevos.
- [ ] **Fila 6:** comprar eligiendo tipo y cantidad deja la compra PENDIENTE y el
  cupo baja (verificado al volver al detalle).
- [ ] **Fila 7:** comprar más que el cupo muestra el error de la API y el cupo no cambia.
- [ ] **Fila 8:** pagar pasa la compra a CONFIRMADA.
- [ ] **Fila 9:** Mis compras muestra los 5 estados del seed bien diferenciados
  (texto, ícono y color) y la CONFIRMADA muestra los días que faltan.
- [ ] El historial muestra al "Sistema" como autor del reembolso en una
  compra REEMBOLSADA del seed.
- [ ] Doble toque en "Confirmar" o "Pagar" no genera dos compras ni dos pagos.
- [ ] `cantidad` viaja como número en el body.
- [ ] El front no calcula días, totales definitivos ni cupos.
- [ ] Sin dependencias nuevas fuera de las aprobadas.
## Fuera de este spec
- Cancelar una compra y reseñar (spec 08f), chat de la compra (spec 08e).
- Un pago real, selección de medio de pago, comprobantes.
 