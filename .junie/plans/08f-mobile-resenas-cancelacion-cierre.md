---
sessionId: session-261122-175410-fow1
---

# Requirements

### Overview & Goals
Completar el mobile con tres funcionalidades: **cancelar compra** (con reembolso automático), **dejar reseña** (puntaje 1–5 en pasos de 0.5 + comentario), y **cierre del front** (estados consistentes, accesibilidad, limpieza). Esto cierra las filas 12 y 13 de la prueba manual y permite validar las 16 filas completas.

### Scope

**In Scope:**
- API: `cancelarCompra(id, token)` en `compras.js` y `crearResenia(eventoId, datos, token)` en `eventos.js`.
- Cancelar compra: botón en `ComprasScreen` (solo PENDIENTE y CONFIRMADA), confirmación con texto según estado, llamada a `POST /compras/:id/cancelacion`, recarga de lista.
- Reseñar: botón "Dejar reseña" en compras UTILIZADA, nueva pantalla `ResenaScreen` con selector de puntaje (1–5, pasos 0.5), comentario multilínea (obligatorio, máx 1000, con contador), llamada a `POST /eventos/:id/resenias`.
- Cierre del front: verificar que `EstadoVacio`, `Cargando` y `ErrorMensaje` estén en todas las pantallas; `accessibilityLabel` en botones de ícono; actualizar `mobile/README.md`.

**Out of Scope:**
- Editar o borrar reseñas, notificaciones, modo oscuro, internacionalización.
- Tests automáticos del front.
- Cambios en el backend (los endpoints ya existen).

### Acceptance Criteria (from spec)
- `npx expo-doctor` sin errores nuevos.
- Fila 12: reseña con puntaje 1–5 (pasos 0.5) y comentario; segunda reseña rechazada con mensaje de API.
- Fila 13: cancelar CONFIRMADA → REEMBOLSADA, cupo vuelve.
- Cancelar PENDIENTE → CANCELADA sin reembolso.
- Botón cancelar no aparece en UTILIZADA, CANCELADA, REEMBOLSADA.
- `puntaje` viaja como número en el body.
- Las 16 filas de prueba manual verificadas y documentadas.
- No quedan pantallas "Próximamente".
- Ninguna pantalla llama a `fetch` directamente ni contiene reglas de negocio.
- Sin dependencias nuevas.

# Technical Design

### Current Implementation

**API layer:** `src/api/compras.js` tiene `crearCompra`, `pagarCompra`, `listarMisCompras`, `marcarUtilizada`. `src/api/eventos.js` tiene `listarEventos`, `obtenerEvento`, `listarCategorias`, `listarResenias`, `crearEvento`, `listarComprasDelEvento`. Ambas usan `request()` de `client.js`.

**ComprasScreen:** Muestra tarjetas con `CompraCard`. Cada tarjeta muestra nombre del evento, fecha, tipo, cantidad, total, `EstadoBadge`, botón "Pagar" (PENDIENTE), botón "Mensajes" (chat), y historial expandible. No tiene botón de cancelar ni de reseñar.

**Components disponibles:** `Boton` (con loading/disabled), `CampoTexto` (TextInput con label), `Cargando` (spinner), `ErrorMensaje` (con reintentar), `EstadoVacio`, `EstadoBadge` (PENDIENTE/CONFIRMADA/UTILIZADA/CANCELADA/REEMBOLSADA), `Pantalla` (SafeAreaView wrapper).

**Navigation:** `AppNavigator.js` usa Stack + Tabs. Las pantallas modales (Detalle, Compra, CrearEvento, ComprasDelEvento, Chat) están en el Stack. No hay `ResenaScreen` registrada.

**Patterns:**
- `KeyboardAvoidingView` en `ChatScreen` para formularios con teclado.
- `useFocusEffect` para recargar al volver a la pantalla.
- `Alert.alert()` para confirmaciones.
- Error handling: `setError(err.message)` y mostrar con `ErrorMensaje`.
- `theme` para colores, espaciados, tipografía y `botones.alturaMinima` (44px).

**README.md:** Tiene "Próximamente" en la estructura de carpetas para pantallas ya implementadas. Necesita actualización.

### Proposed Changes

#### 1. API: funciones para cancelar y reseñar
- `src/api/compras.js`: agregar `cancelarCompra(id, token)` → `POST /compras/:id/cancelacion`.
- `src/api/eventos.js`: agregar `crearResenia(eventoId, { puntaje, comentario }, token)` → `POST /eventos/:id/resenias`. `puntaje` como número.

#### 2. Cancelar compra en ComprasScreen
- En `CompraCard`, agregar botón "Cancelar compra" visible solo cuando `compra.estado` es `'PENDIENTE'` o `'CONFIRMADA'`.
- Al presionar, mostrar `Alert.alert()` con texto según estado:
  - PENDIENTE: "No se realizó ningún pago, así que no hay reembolso."
  - CONFIRMADA: "Se te reembolsará el importe."
- Llamar a `cancelarCompra()`, recargar la lista, mostrar error con `err.message` si falla.
- Estado `cancelandoId` para evitar doble envío (deshabilitar botón).

#### 3. Reseñar: nueva pantalla ResenaScreen
- Nueva pantalla `src/screens/ResenaScreen.js`:
  - Recibe `eventoId` y `titulo` (nombre del evento) por params.
  - Selector de puntaje: botones − y +, muestra `★ X.X`, rango 1–5 en pasos de 0.5.
  - `TextInput` multilínea para comentario, obligatorio, máx 1000 caracteres, con contador.
  - Botón "Enviar" deshabilitado si comentario vacío o enviando.
  - `KeyboardAvoidingView` para no tapar el formulario.
  - Al enviar: `POST /eventos/:id/resenias` con `{ puntaje (número), comentario }`.
  - Éxito (201): muestra "¡Gracias por tu reseña!" y vuelve atrás.
  - Error: muestra `err.message` de la API (409, 403, 400).
- En `CompraCard`, agregar botón "Dejar reseña" visible solo cuando `compra.estado === 'UTILIZADA'`.
- Registrar `ResenaScreen` en `AppNavigator.js`.

#### 4. Cierre del front
- **Estados consistentes:** las pantallas actuales ya usan `Cargando`, `EstadoVacio` y `ErrorMensaje` correctamente.
- **Accesibilidad:** agregar `accessibilityLabel` a botones de ícono: favorito, más/menos en `CompraScreen`, enviar en `ChatScreen`, cancelar y reseña en `ComprasScreen`.
- **Limpieza:** los únicos `console.log` están en `usePolling.js` bajo `__DEV__` — son válidos. No hay código muerto ni pantallas "Próximamente" en el código.
- **README.md:** actualizar la estructura de carpetas (quitar "Próximamente" de pantallas ya implementadas) y agregar `ResenaScreen`.

### File Structure

**Archivos a modificar:**
- `mobile/src/api/compras.js` — agregar `cancelarCompra`
- `mobile/src/api/eventos.js` — agregar `crearResenia`
- `mobile/src/screens/ComprasScreen.js` — botón cancelar, botón reseña, navegación
- `mobile/src/navigation/AppNavigator.js` — registrar `ResenaScreen`
- `mobile/src/screens/CompraScreen.js` — `accessibilityLabel` en botones +/−
- `mobile/src/screens/ChatScreen.js` — `accessibilityLabel` en botón enviar
- `mobile/src/screens/DetalleEventoScreen.js` — `accessibilityLabel` en botón favorito
- `mobile/README.md` — actualizar estructura y quitar "Próximamente"

**Archivos a crear:**
- `mobile/src/screens/ResenaScreen.js` — pantalla para dejar reseña

### Architecture Diagram

```
mermaid
graph LR
  A[ComprasScreen] -->|cancelarCompra| B[POST /compras/:id/cancelacion]
  A -->|navegar| C[ResenaScreen]
  C -->|crearResenia| D[POST /eventos/:id/resenias]
  B -->|200 compra actualizada| A
  D -->|201 reseña| C
  A -->|listarMisCompras| E[GET /compras]
```

### Risks
- **KeyboardAvoidingView en ResenaScreen:** debe configurarse correctamente para que el comentario no quede tapado. Se seguirá el patrón de `ChatScreen`.
- **Alert.alert() para confirmación de cancelación:** es el patrón nativo de React Native, no requiere dependencias.
- **puntaje como número:** el backend valida que sea múltiplo de 0.5. El selector del front solo permite valores válidos (1, 1.5, 2, ..., 5), pero el backend es la autoridad.

# Delivery Steps

### ✓ Step 1: API: cancelarCompra y crearResenia
Agregar las funciones de API para cancelar compra y crear reseña.
- `src/api/compras.js`: agregar `cancelarCompra(id, token)` que llama a `POST /compras/:id/cancelacion`.
- `src/api/eventos.js`: agregar `crearResenia(eventoId, { puntaje, comentario }, token)` que llama a `POST /eventos/:id/resenias` con `puntaje` como número.
- Seguir el patrón existente: importar `request` de `client.js`, JSDoc con tipos.

### ✓ Step 2: Cancelar compra en ComprasScreen
Agregar botón de cancelar compra en las tarjetas de la pestaña Compras.
- En `CompraCard`: botón "Cancelar compra" visible solo en estado PENDIENTE y CONFIRMADA, con `accessibilityLabel`.
- En `ComprasScreen`: estado `cancelandoId` para evitar doble envío, `handleCancelar` con `Alert.alert()` (texto según estado: PENDIENTE sin reembolso, CONFIRMADA con reembolso).
- Llamar a `cancelarCompra()`, recargar lista con `cargarCompras()`, mostrar error con `err.message`.
- Importar `Alert` de `react-native` y `cancelarCompra` de `api/compras.js`.

### ✓ Step 3: Pantalla ResenaScreen y botón reseña
Crear la pantalla de reseña y conectarla desde ComprasScreen.
- `src/screens/ResenaScreen.js`: selector de puntaje (1–5, pasos 0.5, botones −/+ con `accessibilityLabel`), comentario multilínea obligatorio (máx 1000, con contador), botón "Enviar" deshabilitado si vacío, `KeyboardAvoidingView` siguiendo el patrón de `ChatScreen`.
- Llamar a `crearResenia(eventoId, { puntaje, comentario }, token)`. Éxito: Alert "¡Gracias!" y `navigation.goBack()`. Error: mostrar `err.message`.
- En `CompraCard`: botón "Dejar reseña" visible solo en estado UTILIZADA, con `accessibilityLabel`.
- En `ComprasScreen`: `handleResenar` que navega a `ResenaScreen` con `eventoId` y `titulo`.
- Registrar `ResenaScreen` en `AppNavigator.js` con header estilo consistente.

### ✓ Step 4: Cierre del front: accesibilidad, limpieza y README
Aplicar accesibilidad básica, limpieza y actualizar documentación.
- Agregar `accessibilityLabel` a botones de ícono: favorito en `DetalleEventoScreen`/`EventoCard`, más/menos en `CompraScreen`, enviar en `ChatScreen`.
- Verificar que no queden `console.log` sueltos (los existentes en `usePolling.js` bajo `__DEV__` son válidos).
- Verificar que no haya pantallas "Próximamente" en el código (no hay).
- Actualizar `mobile/README.md`: quitar "Próximamente" de pantallas ya implementadas (ExplorarScreen, FavoritosScreen, ComprasScreen, MisEventosScreen), agregar ResenaScreen y ChatScreen a la estructura.