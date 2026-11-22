---
sessionId: session-261122-161426-1bpi
---

# Requirements

### Overview
Crear el proyecto `mobile/` desde cero con Expo (React Native, JavaScript), incluyendo el cliente HTTP único, gestión de sesión, login, navegación base y componentes reutilizables. Sin pantallas de negocio todavía.

### Scope

**In Scope:**
- Proyecto Expo con template blank (JavaScript)
- Cliente HTTP (`src/api/client.js`) con manejo de errores, timeout, y detección de sesión expirada (401)
- API de auth (`src/api/auth.js`): `login()` y `yo()`
- Sesión en memoria (`src/context/SessionContext.js`)
- Utilidades de formato (`src/utils/formato.js`)
- Theme (`src/theme.js`)
- Componentes base: `Pantalla`, `Boton`, `CampoTexto`, `Cargando`, `ErrorMensaje`, `EstadoVacio`
- Navegación con 5 tabs (Explorar, Favoritos, Compras, Mis eventos, Cuenta) — las 4 primeras con "Próximamente"
- `LoginScreen` con carga, errores y manejo de teclado
- `CuentaScreen` con datos del usuario y cierre de sesión
- Configuración de URL del backend vía `EXPO_PUBLIC_API_URL` (variable de entorno)
- `mobile/README.md` con instrucciones de ejecución
- `.env.example` y `.gitignore`

**Out of Scope:**
- Pantallas de negocio (eventos, compras, chat, reseñas) — specs 08a a 08e
- Persistir sesión entre reinicios (sin AsyncStorage)
- Tests automáticos del front

### User Stories
- Como usuario, quiero iniciar sesión con email y contraseña para acceder a la app.
- Como usuario, quiero ver mis datos en la pantalla de Cuenta y cerrar sesión.
- Como desarrollador, quiero que la URL del backend se configure con una variable de entorno para no hardcodearla.
- Como desarrollador, quiero que los errores de la API se muestren con mensajes claros al usuario.

### Acceptance Criteria
- `npx expo-doctor` sin errores nuevos
- La app abre en el celular físico y conecta con el backend
- Login con credenciales del seed funciona; credenciales erróneas muestran el mensaje del error
- Con el backend apagado, el login muestra mensaje de falta de conexión
- Reiniciar el backend con sesión abierta lleva al login con aviso de sesión expirada
- Cerrar sesión vuelve al login
- La URL del backend no aparece escrita en ningún archivo de `src/`
- Ninguna pantalla llama a `fetch` directamente
- `mobile/README.md` explica cómo correr el proyecto

### Dependencies Justification
| Paquete | Justificación |
|---|---|
| `@react-navigation/native` | Navegación entre pantallas (stack, tabs) |
| `@react-navigation/native-stack` | Stack navigator para login → app |
| `@react-navigation/bottom-tabs` | Tab navigator para las 5 secciones principales |
| `react-native-screens` | Dependencia nativa requerida por React Navigation |
| `react-native-safe-area-context` | Manejo del safe area (notch, barras del sistema) |
| `@expo/vector-icons` | Íconos para los tabs (ya incluido con Expo) |

# Technical Design

### Current Implementation
El backend está completo (specs 00-06). Los contratos de la API relevantes son:
- `POST /auth/login` → `{ token, usuario: { id, nombre, apellido, email, favoritos } }`
- `GET /auth/yo` → `{ id, nombre, apellido, email, favoritos }`
- Errores: `{ error: { code, message } }` con status HTTP según tipo (401 UnauthorizedError, etc.)
- `Usuario.sinPassword()` no incluye `_hash` ni contraseña

No existe la carpeta `mobile/` aún.

### Key Decisions
- **JavaScript sin TypeScript**: el spec lo exige explícitamente. Template `blank` de Expo con JS.
- **Sin librerías de estado, HTTP o fechas**: solo React Native + React Navigation + las dependencias aprobadas. El cliente HTTP se implementa con `fetch` nativo.
- **Sesión en memoria**: sin AsyncStorage. Al cerrar la app se pierde la sesión. Simplifica el spec 07 y cumple con el alcance.
- **401 global**: el cliente HTTP detecta 401 (excepto en el propio login) y dispara un callback para cerrar sesión y mostrar aviso. Esto maneja el caso de reiniciar el backend (tokens en memoria se pierden).
- **Config.js centralizado**: `src/config.js` lee `process.env.EXPO_PUBLIC_API_URL`. Si no está definida, la app muestra una pantalla de error en vez de fallar silenciosamente.

### Proposed Changes

#### 1. Proyecto Expo
- Crear `mobile/` con `npx create-expo-app@latest mobile --template blank` (JavaScript)
- Instalar dependencias de navegación con `npx expo install`
- Configurar app.json con nombre "AI Ticket It"

#### 2. Estructura de carpetas
```
mobile/
  App.js
  app.json
  .env.example
  .gitignore
  README.md
  src/
    config.js
    theme.js
    api/
      client.js
      auth.js
    context/
      SessionContext.js
    hooks/
      useNavigationWithAuth.js
    utils/
      formato.js
    components/
        Pantalla.js
        Boton.js
        CampoTexto.js
        Cargando.js
        ErrorMensaje.js
        EstadoVacio.js
    screens/
      LoginScreen.js
      CuentaScreen.js
      ExplorarScreen.js
      FavoritosScreen.js
      ComprasScreen.js
      MisEventosScreen.js
    navigation/
      AppNavigator.js
```

#### 3. `src/config.js`
- Exporta `API_URL` desde `process.env.EXPO_PUBLIC_API_URL`
- Exporta `isConfigured()` para validar que la URL esté definida

#### 4. `src/api/client.js`
- Clase/funciones: `request(method, path, { query, body, token })`
- Construye URL: `${API_URL}${path}` + query params (omitiendo undefined, null, strings vacíos)
- Headers: `Content-Type: application/json`, `Authorization: Bearer <token>` si hay token
- Timeout 15s con `AbortController`
- Parseo JSON; 204 devuelve `null`
- Error handling:
  - Respuesta con `{ error: { code, message } }` → `ApiError` con status, code, message
  - Network error / timeout → `ApiError` con `code: 'NETWORK_ERROR'`
  - No JSON → mensaje genérico
- `registrarSesionExpirada(fn)`: callback global para 401
- `ApiError` class que extiende `Error`

#### 5. `src/api/auth.js`
- `login(email, password)`: POST `/auth/login`, body `{ email, password }`
- `yo(token)`: GET `/auth/yo` con token

#### 6. `src/context/SessionContext.js`
- `SessionProvider` con estado: `{ usuario, token, avisoSesion }`
- `login(email, password)`: llama a `api.login()`, guarda usuario y token, limpia `avisoSesion`
- `logout()`: limpia todo
- `setAvisoSesion(msg)`: para mensajes como "Tu sesión expiró"
- `useSession()`: hook para acceder al contexto

#### 7. `src/utils/formato.js`
- `formatearPrecio(n)`: `$ 15.000` (Intl.NumberFormat es-AR)
- `formatearFecha(iso)`: `DD/MM/AAAA` en hora local
- `formatearFechaHora(iso)`: `DD/MM/AAAA HH:mm` en hora local
- `textoDias(n)`: "El evento es hoy", "Mañana", "Faltan N días"

#### 8. `src/theme.js`
- Colores: primario, secundario, error, fondo, texto, texto secundario
- Espaciados: xs, sm, md, lg, xl
- Tamaños de texto: small, medium, large, xlarge
- Botones con mínimo 44px de altura táctil

#### 9. `src/components/`
- `Pantalla`: View con `SafeAreaView` y padding del theme
- `Boton`: Text con onPress, loading (ActivityIndicator), disabled, estilo del theme
- `CampoTexto`: TextInput con label, secureTextEntry, placeholder
- `Cargando`: ActivityIndicator centrado con texto
- `ErrorMensaje`: texto de error + botón "Reintentar" con onPress callback
- `EstadoVacio`: ícono + texto para listas vacías

#### 10. `src/screens/LoginScreen.js`
- Campos: email (text), contraseña (secure)
- Botón "Ingresar" con estado de carga (disabled durante carga)
- Muestra `message` del error de la API
- Muestra `avisoSesion` si existe (con estilo diferente)
- `KeyboardAvoidingView` para no tapar campos
- Llama a `useSession().login()`

#### 11. `src/screens/CuentaScreen.js`
- Muestra nombre, apellido y email del usuario (de `useSession()`)
- Botón "Cerrar sesión" que llama a `logout()`

#### 12. `src/screens/` (próximamente)
- `ExplorarScreen`, `FavoritosScreen`, `ComprasScreen`, `MisEventosScreen`: título + "Próximamente"

#### 13. `src/navigation/AppNavigator.js`
- Si no hay sesión → solo `LoginScreen` (Stack)
- Con sesión → `BottomTabNavigator` con 5 tabs dentro de un `Stack.Navigator`
- Tabs: Explorar, Favoritos, Compras, Mis eventos, Cuenta
- Íconos de `@expo/vector-icons` (Ionicons o MaterialCommunityIcons)

#### 14. `App.js`
- Verifica `isConfigured()` → pantalla de error si falta `EXPO_PUBLIC_API_URL`
- `SessionProvider` → `AppNavigator`

#### 15. Configuración
- `.env.example`: `EXPO_PUBLIC_API_URL=http://192.168.0.10:3000`
- `.gitignore`: `.env`
- `README.md`: instrucciones de IP, .env, backend, expo start, reinicio tras cambiar .env

### Architecture Diagram

``` mermaid
graph LR
    A[App.js] --> B[SessionProvider]
    B --> C[AppNavigator]
    C -->|sin sesión| D[LoginScreen]
    C -->|con sesión| E[BottomTabNavigator]
    E --> F[Explorar]
    E --> G[Favoritos]
    E --> H[Compras]
    E --> I[Mis eventos]
    E --> J[Cuenta]
    D --> K[api/auth.js]
    J --> K
    K --> L[api/client.js]
    L --> M[Backend API]
    L -->|401| B[SessionProvider]
    B -->|logout| D[LoginScreen]
```

### Risks
- **IP del backend**: el usuario debe averiguar su IP local y configurar `.env`. Se documenta en el README.
- **Reinicio de Expo tras cambiar `.env`**: las variables de entorno se leen al inicio del proceso. Se documenta y se maneja con la pantalla de error de config.
- **401 del login vs 401 de otras llamadas**: el cliente HTTP debe distinguir para no cerrar sesión al fallar el login. Se maneja con un flag o verificando la ruta.

# Testing

### Validation Approach
Validación manual en dispositivo físico según `docs/testing.md` sección 5, fila 1 (login) + fila 16 (cerrar sesión). Chequeo estático con `npx expo-doctor`.

### Key Scenarios
1. **Login exitoso**: credenciales del seed → app muestra pantalla principal con tabs
2. **Login fallido**: credenciales erróneas → mensaje "Email o contraseña incorrectos."
3. **Backend apagado**: mensaje de falta de conexión
4. **Sesión expirada**: reiniciar backend → llamar a `GET /auth/yo` → 401 → cierre de sesión → login con aviso
5. **Cerrar sesión**: botón en Cuenta → vuelve al login
6. **Sin EXPO_PUBLIC_API_URL**: pantalla de error clara
7. **Navegación**: tabs funcionan, las 4 primeras muestran "Próximamente"

### Edge Cases
- Login con campos vacíos
- Doble toque en "Ingresar" (botón disabled durante carga)
- Teclado tapando campos (KeyboardAvoidingView)
- Respuesta no JSON del backend
- Timeout de 15 segundos (simular con backend muy lento)

### Commands to Run
- `npx expo-doctor` (desde `mobile/`)
- Verificar que no haya `fetch` en `src/screens/` ni `src/navigation/`
- Verificar que `EXPO_PUBLIC_API_URL` no aparezca como string literal en `src/`

# Delivery Steps

### ✓ Step 1: Crear proyecto Expo y configurar estructura
Proyecto Expo creado, dependencias instaladas, estructura de carpetas y archivos de configuración listos.
- Ejecutar `npx create-expo-app@latest mobile --template blank` (JavaScript)
- Instalar con `npx expo install`: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`
- Configurar `app.json` con nombre "AI Ticket It"
- Crear `.env.example` con `EXPO_PUBLIC_API_URL=http://192.168.0.10:3000`
- Crear `.gitignore` con `.env`
- Crear estructura de carpetas: `src/api/`, `src/screens/`, `src/components/`, `src/navigation/`, `src/context/`, `src/hooks/`, `src/utils/`
- Crear `src/config.js` que lee `process.env.EXPO_PUBLIC_API_URL` y exporta `isConfigured()`
- Crear `src/theme.js` con colores, espaciados, tamaños de texto y mínimo 44px táctil para botones

### ✓ Step 2: Implementar cliente HTTP y API de auth
Cliente HTTP centralizado con manejo de errores, timeout, detección de 401 y funciones de auth.
- `src/api/client.js`: clase `ApiError`, función `request(method, path, { query, body, token })` con URL base desde config, query params (omitiendo undefined/null/vacío), headers JSON + Bearer token, timeout 15s con AbortController, parseo JSON (204 → null), manejo de errores (error del backend → ApiError con code/message, network/timeout → NETWORK_ERROR, no JSON → mensaje genérico), `registrarSesionExpirada(fn)` para 401 global (excluyendo el login)
- `src/api/auth.js`: `login(email, password)` → POST `/auth/login`, `yo(token)` → GET `/auth/yo`
- El 401 del login NO dispara el handler de sesión expirada (verificar ruta o pasar flag)

### ✓ Step 3: Implementar sesión, utilidades y componentes base
Contexto de sesión en memoria, utilidades de formato y componentes UI reutilizables.
- `src/context/SessionContext.js`: `SessionProvider` con estado `{ usuario, token, avisoSesion }`, funciones `login(email, password)`, `logout()`, `setAvisoSesion(msg)`, hook `useSession()`. Al recibir 401 del cliente HTTP, llamar al handler que limpia sesión y setea aviso
- `src/utils/formato.js`: `formatearPrecio(n)` ($ 15.000), `formatearFecha(iso)` (DD/MM/AAAA), `formatearFechaHora(iso)` (DD/MM/AAAA HH:mm), `textoDias(n)` (hoy/mañana/faltan N días)
- `src/components/Pantalla.js`: contenedor con SafeAreaView y padding del theme
- `src/components/Boton.js`: texto con onPress, loading (ActivityIndicator), disabled, estilo del theme, mínimo 44px
- `src/components/CampoTexto.js`: TextInput con label, secureTextEntry, placeholder
- `src/components/Cargando.js`: ActivityIndicator centrado con texto
- `src/components/ErrorMensaje.js`: texto de error + botón "Reintentar" con onPress
- `src/components/EstadoVacio.js`: ícono + texto para listas vacías

### ✓ Step 4: Implementar LoginScreen, CuentaScreen y navegación
Pantallas de login y cuenta funcionales, navegación con tabs y flujo completo de sesión.
- `src/screens/LoginScreen.js`: campos email y contraseña (secure), botón "Ingresar" con loading (disabled durante carga), muestra `message` del error de la API, muestra `avisoSesion` si existe, `KeyboardAvoidingView` para no tapar campos, llama a `useSession().login()`
- `src/screens/CuentaScreen.js`: muestra nombre, apellido y email del usuario (de `useSession()`), botón "Cerrar sesión" que llama a `logout()`
- `src/screens/ExplorarScreen.js`, `FavoritosScreen.js`, `ComprasScreen.js`, `MisEventosScreen.js`: título + "Próximamente"
- `src/navigation/AppNavigator.js`: sin sesión → solo LoginScreen (Stack), con sesión → BottomTabNavigator con 5 tabs (Explorar, Favoritos, Compras, Mis eventos, Cuenta) dentro de un Stack, íconos de `@expo/vector-icons`
- `App.js`: verificar `isConfigured()` → pantalla de error si falta config, `SessionProvider` → `AppNavigator`
- Registrar el handler de sesión expirada en `App.js` o en el navigator
- Crear `mobile/README.md` con instrucciones: cómo averiguar IP, crear .env, levantar backend, correr `npx expo start`, abrir en celular, reiniciar Expo tras cambiar .env
- Ejecutar `npx expo-doctor` y verificar sin errores nuevos