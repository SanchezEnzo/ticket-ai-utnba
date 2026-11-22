# 08d: Mobile, vista del organizador (crear evento y compras del evento)
 
## Casos de uso que cubre
- Como organizador, quiero crear un evento ofreciendo distintos tipos de
  entrada, cada uno con su precio y cupo.
- Como organizador, quiero ver las compras de uno de mis eventos con su
  estado y cuántas entradas quedan disponibles de cada tipo.
- Como organizador, quiero marcar una entrada como utilizada.
## Documentos de referencia
- Specs del backend `02-eventos.md` (crear evento), `03b-compras-cancelar.md`
  (uso) y `03c-compras-organizador.md` (compras del evento)
- `docs/architecture.md`: sección 4 (Mobile)
- `docs/testing.md`: sección 5, filas 5, 10 y 11
- Las reglas de todo el mobile están en `08a-mobile-base.md`
## Requisito previo
Spec `08c-mobile-compras.md` cerrado.
 
## Alcance
 
### 1. API
`src/api/eventos.js` (se amplía): `crearEvento(datos, token)`,
`listarComprasDelEvento(eventoId, token)`. `src/api/compras.js` (se amplía):
`marcarUtilizada(compraId, token)`.
 
### 2. Pestaña Mis eventos
- La API no tiene un endpoint de "mis eventos". La pestaña llama a
  `GET /eventos` **sin parámetros** y muestra solo los eventos cuyo
  `organizador.id` es el del usuario autenticado. Es la única excepción a
  "el front no filtra"; se documenta en el código con un comentario.
- Limitación conocida y aceptada: el catálogo no incluye eventos ya
  realizados, por lo que no aparecen en esta lista. Los eventos recién
  creados se abren directamente tras crearlos (ver más abajo).
- Cada tarjeta lleva al detalle del evento y tiene el botón **"Ver compras"**.
  Estados vacío ("Todavía no creaste eventos"), cargando y error con "Reintentar".
- Botón **"Crear evento"** (en el encabezado o flotante).
- En el detalle del evento (spec 08b), si el usuario es el organizador, aparece
  también el botón "Ver compras".
### 3. Crear evento
Formulario con:
- Nombre y descripción (obligatorios).
- Categoría: chips con las de `GET /categorias` (una seleccionada).
- Fecha y hora, **sin librerías de calendario**: dos campos de texto,
  `DD/MM/AAAA` y `HH:mm`, interpretados en hora local del dispositivo y
  convertidos a ISO 8601 con `toISOString()` (helper en `src/utils/fecha.js`).
  Si el formato no es válido, se marca el campo antes de enviar. Si la fecha ya
  pasó, lo rechaza la API y se muestra su mensaje.
- Multimedia (opcional): lista de URLs, con botones para agregar y quitar.
- **Tipos de entrada**: lista dinámica con al menos uno; cada uno con nombre,
  descripción, precio y cupo, y botones para agregar y quitar tipos. El
  formulario arranca con un tipo vacío.
- Al enviar, los campos numéricos se convierten a **número** (el backend
  rechaza `"15000"` como texto). Si un campo numérico no es un número válido,
  se marca antes de enviar. El resto de las validaciones (precio >= 0, cupo
  entero > 0, nombres de tipo únicos, categoría existente) las hace el
  servidor y se muestra su `message`.
- Estado de carga y sin doble envío. Con éxito (201) se navega al detalle del
  evento creado.
### 4. Compras del evento
- Pantalla `ComprasDelEvento` (`GET /eventos/:id/compras`): encabezado con el
  nombre y la fecha del evento.
- Sección **Entradas disponibles**: cada tipo con "N de M disponibles" (`cupoDisponible`
  de `cupo`) y una barra de progreso simple. Se muestran **todos** los tipos,
  incluso sin compras.
- Lista de compras: comprador (nombre y apellido), tipo y cantidad, total,
  `EstadoBadge` (el mismo componente del spec 08c) y fecha de la compra.
  Estado vacío: "Todavía no hay compras en este evento."
- Para las compras **CONFIRMADA**, el botón **"Marcar como utilizada"**, con
  una confirmación previa ("Simula escanear la entrada. Esta acción no se
  puede deshacer."). Llama a `POST /compras/:id/uso`; con éxito se vuelve a
  consultar la pantalla (cambia el estado y se actualiza el cupo mostrado).
  Un error de la API (por ejemplo 403 o 409) se muestra con su `message`.
- "Arrastrar para actualizar" y estados cargando y error con "Reintentar".
- Si la API responde 403 (el usuario no es el organizador), se muestra el
  mensaje y se vuelve atrás.
- El botón de mensajes de cada compra se agrega en el spec 08e.
## Criterios de aceptación
- [ ] `npx expo-doctor` sin errores nuevos.
- [ ] **Fila 5:** crear un evento con 3 tipos de entrada; aparece en el
  catálogo con sus tipos, precios y cupos.
- [ ] **Fila 10:** el organizador ve las compras de su evento con estado y el
  cupo disponible por tipo.
- [ ] **Fila 11:** marcar una compra como UTILIZADA; la compra cambia de
  estado en la pantalla del organizador y el comprador ya no tiene el botón
  de cancelar (al verificar el spec 08f).
- [ ] Un valor no numérico en precio o cupo se marca antes de enviar; los
  valores numéricos viajan como números.
- [ ] Crear un evento con la fecha en el pasado muestra el error de la API.
- [ ] Un usuario que no es organizador del evento no ve el botón "Ver compras"
  y, si consulta igual, la API responde 403 y se muestra el mensaje.
- [ ] El front no calcula el cupo disponible: muestra el de la API.
- [ ] Sin dependencias nuevas fuera de las aprobadas.
## Fuera de este spec
- Editar o dar de baja eventos (fuera de alcance del TP), subir imágenes,
  selector de fecha nativo.
 