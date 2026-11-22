---
sessionId: session-261122-170003-9w96
---

# Requirements

### Overview
Implementar la vista del organizador en el mobile: crear eventos con tipos de entrada, ver las compras de sus eventos con estado y cupo disponible, y marcar entradas como utilizadas.

### User Stories
- Como organizador, quiero crear un evento ofreciendo distintos tipos de entrada, cada uno con su precio y cupo.
- Como organizador, quiero ver las compras de uno de mis eventos con su estado y cuántas entradas quedan disponibles de cada tipo.
- Como organizador, quiero marcar una entrada como utilizada.

### Scope

**In Scope:**
- API: `crearEvento()`, `listarComprasDelEvento()`, `marcarUtilizada()`.
- Pestaña Mis eventos: lista filtrada de eventos del organizador, botón "Ver compras", botón "Crear evento".
- Pantalla Crear evento: formulario con nombre, descripción, categoría, fecha/hora (sin librería), multimedia opcional, tipos de entrada dinámicos.
- Pantalla Compras del evento: entradas disponibles con cupo, lista de compras con estado, botón "Marcar como utilizada" con confirmación.
- DetalleEvento: botón "Ver compras" cuando el usuario es el organizador.
- Helper de fecha: `parsearFechaHora()` en `src/utils/fecha.js`.

**Out of Scope:**
- Editar o dar de baja eventos.
- Subir imágenes.
- Selector de fecha nativo.
- Chat de la compra (spec 08e).
- Cancelar compra desde el organizador.

# Technical Design

### Current Implementation
- **Backend**: Los endpoints ya existen: `POST /eventos` (crear evento), `GET /eventos/:id/compras` (compras del organizador), `POST /compras/:id/uso` (marcar utilizada). No se modifica el backend.
- **Mobile**: `MisEventosScreen.js` es un placeholder ("Próximamente"). `DetalleEventoScreen.js` muestra "Sos el organizador" como texto. `AppNavigator.js` tiene las rutas Stack `Detalle` y `Compra`.
- **Componentes disponibles**: `Boton`, `CampoTexto`, `EstadoBadge`, `ErrorMensaje`, `EstadoVacio`, `Cargando`, `Pantalla`, `EventoCard`.
- **API**: `src/api/eventos.js` tiene `listarEventos`, `obtenerEvento`, `listarCategorias`, `listarResenias`. `src/api/compras.js` tiene `crearCompra`, `pagarCompra`, `listarMisCompras`.
- **Patrones**: screens usan `useCallback`, `useFocusEffect`, `useSession`, `RefreshControl`, y `FlatList`. Los errores de API se muestran con `ErrorMensaje`.

### Proposed Changes

#### 1. API functions (ampliación de archivos existentes)
- `src/api/eventos.js`: agregar `crearEvento(datos, token)` y `listarComprasDelEvento(eventoId, token)`.
- `src/api/compras.js`: agregar `marcarUtilizada(compraId, token)`.

#### 2. Helper de fecha
- `src/utils/fecha.js` (nuevo): `parsearFechaHora(ddMmAaaa, hhmm)` → ISO 8601 en hora local. `validarFechaTexto(texto)` → boolean. `validarHoraTexto(texto)` → boolean.

#### 3. MisEventosScreen (reemplazo)
- Llama a `listarEventos({}, token)` y filtra `evento.organizador.id === usuario.id`.
- `FlatList` con `EventoCard` + botón "Ver compras" por evento.
- Header con botón "Crear evento" (o FAB).
- Estados: vacío, cargando, error con reintentar.

#### 4. CrearEventoScreen (nuevo)
- Formulario con `useState` para cada campo.
- Categorías: carga `listarCategorias()` al montar, muestra chips.
- Fecha/hora: dos `CampoTexto`, validación con helpers de `fecha.js`.
- Multimedia: array de URLs, botones +/−.
- Tipos de entrada: array dinámico, cada uno con nombre, descripción, precio, cupo. Botones +/−. Arranca con uno vacío.
- Submit: convierte numéricos a `Number()`, valida formato, llama a `crearEvento()`. Con éxito navega a `Detalle`.

#### 5. ComprasDelEventoScreen (nuevo)
- Params: `eventoId` desde navigation.
- Carga `listarComprasDelEvento(eventoId, token)`.
- Sección entradas disponibles: barra de progreso (`cupoDisponible / cupo * 100`).
- Lista de compras con `EstadoBadge`, datos del comprador, tipo, cantidad, total, fecha.
- Botón "Marcar como utilizada" para CONFIRMADA, con `Alert.alert()` de confirmación.
- RefreshControl, estados vacío/cargando/error.
- Si 403: muestra mensaje y `navigation.goBack()`.

#### 6. DetalleEventoScreen (modificación)
- Reemplazar el texto "Sos el organizador" por un `Boton` "Ver compras" que navega a `ComprasDelEvento`.

#### 7. AppNavigator (modificación)
- Agregar rutas Stack: `CrearEvento` y `ComprasDelEvento`.

### File Structure
```
mobile/src/
  api/
    eventos.js          # MODIFIED: +crearEvento, +listarComprasDelEvento
    compras.js          # MODIFIED: +marcarUtilizada
  screens/
    MisEventosScreen.js # MODIFIED: reemplazar placeholder
    CrearEventoScreen.js # NEW
    ComprasDelEventoScreen.js # NEW
    DetalleEventoScreen.js # MODIFIED: botón Ver compras
  navigation/
    AppNavigator.js     # MODIFIED: +2 rutas Stack
  utils/
    fecha.js            # NEW: parsearFechaHora, validarFechaTexto, validarHoraTexto
```

# Delivery Steps

### ✓ Step 1: API functions y helper de fecha
Agregar funciones API para crear evento, listar compras del evento, marcar utilizada, y crear el helper de fecha.
- `src/api/eventos.js`: agregar `crearEvento(datos, token)` (POST /eventos) y `listarComprasDelEvento(eventoId, token)` (GET /eventos/:id/compras).
- `src/api/compras.js`: agregar `marcarUtilizada(compraId, token)` (POST /compras/:id/uso).
- `src/utils/fecha.js`: crear helpers `parsearFechaHora(ddMmAaaa, hhmm)` que parsea `DD/MM/AAAA` y `HH:mm` en hora local y devuelve ISO 8601, y `validarFechaTexto(texto)` para validar formato.
- Los campos numéricos (precio, cupo, cantidad) se convierten a número con `Number()` antes de enviar; si no son válidos se marcan en el formulario.

### ✓ Step 2: Pantalla Mis Eventos
Implementar la pestaña Mis eventos completa: lista filtrada de eventos del organizador, estados vacío/cargando/error, y botón para crear evento.
- `src/screens/MisEventosScreen.js`: reemplazar el placeholder. Llama a `GET /eventos` sin parámetros y filtra localmente los eventos cuyo `organizador.id === usuario.id` (única excepción a "el front no filtra", documentada con comentario). Cada tarjeta muestra el evento y un botón "Ver compras" que navega a `ComprasDelEvento`. Botón "Crear evento" en el header (o FAB) que navega a `CrearEvento`. Estados: vacío ("Todavía no creaste eventos"), cargando con `Cargando`, y error con `ErrorMensaje` y "Reintentar".
- `src/navigation/AppNavigator.js`: agregar las rutas Stack `CrearEvento` y `ComprasDelEvento`.

### ✓ Step 3: Pantalla Crear Evento
Formulario completo para crear un evento con tipos de entrada dinámicos, fecha sin librería, y multimedia opcional.
- `src/screens/CrearEventoScreen.js`: formulario con:
  - Nombre y descripción (CampoTexto obligatorios).
  - Categoría: chips horizontales con las categorías de `listarCategorias(token)` (una seleccionada).
  - Fecha y hora: dos campos de texto (`DD/MM/AAAA` y `HH:mm`), interpretados en hora local con el helper `parsearFechaHora()` de `src/utils/fecha.js`. Si el formato no es válido, se marca el campo antes de enviar.
  - Multimedia (opcional): lista de URLs con botones para agregar y quitar.
  - Tipos de entrada: lista dinámica con al menos uno; cada tipo con nombre, descripción, precio y cupo, y botones para agregar/quitar. Arranca con un tipo vacío.
  - Al enviar: campos numéricos se convierten a número. Si un campo numérico no es válido, se marca. El resto de validaciones (precio >= 0, cupo entero > 0, nombres únicos, categoría existente) las hace el servidor y se muestra su `message`.
  - Estado de carga y sin doble envío. Con éxito (201) se navega al detalle del evento creado (`navigation.navigate('Detalle', { eventoId: resultado.id })`).
- `src/navigation/AppNavigator.js`: ya se agregó en la etapa anterior.

### ✓ Step 4: Pantalla Compras del Evento y DetalleEvento actualizado
Pantalla de compras del evento con entradas disponibles, lista de compras, marcar como utilizada, y actualizar el DetalleEvento para que el organizador vea el botón "Ver compras".
- `src/screens/ComprasDelEventoScreen.js`: pantalla que consulta `listarComprasDelEvento(eventoId, token)`.
  - Encabezado con nombre y fecha del evento.
  - Sección Entradas disponibles: cada tipo con "N de M disponibles" (`cupoDisponible` de `cupo`) y una barra de progreso simple (View con ancho porcentual).
  - Lista de compras: comprador (nombre y apellido), tipo y cantidad, total, `EstadoBadge`, y fecha. Estado vacío: "Todavía no hay compras en este evento."
  - Para compras CONFIRMADA: botón "Marcar como utilizada" con confirmación previa (Alert: "Simula escanear la entrada. Esta acción no se puede deshacer."). Llama a `marcarUtilizada(compraId, token)`; con éxito recarga la pantalla. Un error de la API (403, 409) se muestra con su `message`.
  - "Arrastrar para actualizar" (RefreshControl) y estados cargando/error con "Reintentar".
  - Si la API responde 403, se muestra el mensaje y se vuelve atrás.
- `src/screens/DetalleEventoScreen.js`: si el usuario es el organizador del evento, reemplazar el texto "Sos el organizador de este evento" por un botón "Ver compras" que navega a `ComprasDelEvento`.