# 07: Mobile, base del proyecto (Expo, API, sesión y navegación)
 
## Objetivo
Dejar el proyecto `mobile/` creado y funcionando en el celular físico, con el
cliente HTTP único, la sesión, el login y la navegación. Sin pantallas de
negocio todavía.
 
## Documentos de referencia
- `docs/architecture.md`: sección 4 (Mobile) y "Manejo de errores"
- `docs/testing.md`: sección 5 (prueba manual en el dispositivo)
- Los specs del backend (`02` a `06`, en `specs/`) describen la forma de cada
  respuesta. La fuente de verdad del contrato es el backend en ejecución: si
  una respuesta real difiere de lo que dice un spec, **se informa la
  diferencia y no se cambia el backend en este spec**.
## Requisito previo
Backend completo y funcionando (`npm start` en `backend/`, specs 00 a 06 cerrados).
 
## Reglas de todo el mobile (valen para 08a a 08f)
- El front **no contiene reglas de negocio**: muestra lo que devuelve la API.
  Puede ocultar un botón que no corresponde (por ejemplo "Cancelar" en una
  compra UTILIZADA), pero la validación real es del backend y los errores de
  la API se muestran con su `message`.
- Todas las llamadas HTTP salen de `src/api/`. Ninguna pantalla usa `fetch`
  directamente.
- JavaScript (sin TypeScript). Textos de la interfaz en español.
- La UI se arma solo con React Native: **sin librerías de componentes, de
  estado, de fechas ni de HTTP** (nada de axios, redux, moment, etc.).
- Gestor de paquetes: npm. Las dependencias nuevas se agregan con
  `npx expo install <paquete>` para que la versión sea compatible con el SDK.
- Cada archivo editado se entrega completo.
## Alcance
 
### 1. Proyecto
- Crear `mobile/` con `npx create-expo-app@latest mobile --template blank`
  (JavaScript). El nombre visible de la app es "AI Ticket It".
- Dependencias aprobadas, además de las de la plantilla:
  `@react-navigation/native`, `@react-navigation/native-stack`,
  `@react-navigation/bottom-tabs`, `react-native-screens` y
  `react-native-safe-area-context`. Los íconos salen de `@expo/vector-icons`
  (viene con Expo). Cualquier otra se consulta antes. Justificar cada una en el plan.
- Estructura (de `docs/architecture.md`): `src/api/`, `src/screens/`,
  `src/components/`, `src/navigation/`, `src/context/`, `src/hooks/`, y se
  suman `src/utils/` y `src/theme.js`.
### 2. Configuración
- `src/config.js` lee `process.env.EXPO_PUBLIC_API_URL`. La URL **nunca** está
  escrita en el código.
- Se crean `mobile/.env.example` con
  `EXPO_PUBLIC_API_URL=http://192.168.0.10:3000` (como ejemplo) y se agrega
  `.env` al `.gitignore`.
- Si la variable no está definida, la app muestra una pantalla de error clara
  ("Falta configurar EXPO_PUBLIC_API_URL") en vez de romperse.
- Documentar en `mobile/README.md`: cómo averiguar la IP de la PC, crear el
  `.env`, levantar el backend, correr `npx expo start`, abrir la app en el
  celular (misma red Wi-Fi) y que hay que reiniciar Expo después de cambiar el `.env`.
### 3. Cliente HTTP
`src/api/client.js` exporta `request(metodo, ruta, { query, body, token })`:
- Arma la URL con `config` y los parámetros de `query` (omitiendo los
  `undefined`, `null` y strings vacíos).
- Envía y recibe JSON. Agrega `Authorization: Bearer <token>` si hay token.
  Respuestas 204 devuelven `null` sin intentar parsear.
- Timeout de 15 segundos (con `AbortController`).
- Todo error se convierte en `ApiError` con `status`, `code` y `message`:
  - Respuesta de error del backend (`{ error: { code, message } }`): usa su
    `code` y `message`.
  - Sin conexión o timeout: `code` `NETWORK_ERROR` y el mensaje "No se pudo
    conectar con el servidor. Revisá que el celular y la PC estén en la misma
    red."
  - Respuesta que no es JSON: mensaje genérico "Respuesta inesperada del servidor."
- Si una llamada con token recibe **401**, invoca un handler registrado
  (`registrarSesionExpirada(fn)`), para que la sesión se cierre y se vuelva
  al login con el mensaje "Tu sesión expiró. Iniciá sesión de nuevo." (pasa,
  por ejemplo, al reiniciar el backend, porque los tokens viven en memoria).
  El 401 del propio login **no** dispara ese handler.
- `src/api/auth.js`: `login(email, password)` y `yo(token)`.
### 4. Sesión
`src/context/SessionContext.js`: `SessionProvider` y `useSession()` con
`{ usuario, token, login(email, password), logout(), avisoSesion }`.
- El token y el usuario viven **solo en memoria** (sin AsyncStorage): al
  cerrar la app se vuelve a iniciar sesión.
- `logout` limpia la sesión. `avisoSesion` guarda el mensaje a mostrar en el
  login (por ejemplo, sesión expirada).
### 5. Utilidades y componentes base
- `src/utils/formato.js`, sin librerías: `formatearPrecio(n)` (por ejemplo
  `$ 15.000`), `formatearFecha(iso)` (`DD/MM/AAAA`), `formatearFechaHora(iso)`
  (`DD/MM/AAAA HH:mm`, en hora local del dispositivo) y
  `textoDias(n)` ("El evento es hoy", "Mañana", "Faltan N días").
- `src/theme.js`: colores, espaciados y tamaños de texto. Un contraste
  legible y botones con área táctil de al menos 44 px.
- `src/components/`: `Pantalla` (contenedor con área segura), `Boton`
  (con estado de carga y deshabilitado), `CampoTexto`, `Cargando`,
  `ErrorMensaje` (mensaje y botón "Reintentar") y `EstadoVacio`.
### 6. Pantallas y navegación
- `src/navigation/`: si no hay sesión, se muestra solo el login; con sesión,
  la navegación principal (navegador de pestañas inferior dentro de un stack):
  **Explorar**, **Favoritos**, **Compras**, **Mis eventos**, **Cuenta**.
  Las cuatro primeras son por ahora pantallas con el título y un
  "Próximamente"; se completan en los specs siguientes.
- `LoginScreen`: campos email y contraseña (oculta), botón "Ingresar" con
  estado de carga (no permite doble envío), muestra el `message` del error de
  la API (credenciales inválidas, falta de conexión) y el `avisoSesion` si
  existe. Maneja el teclado para que los campos no queden tapados.
- `CuentaScreen`: muestra nombre y apellido del usuario y el botón "Cerrar sesión".
- Al iniciar sesión no hace falta llamar a `GET /auth/yo`: el login ya
  devuelve el usuario. `yo` solo se usa para revalidar la sesión si hace falta.
## Criterios de aceptación
- [ ] `npx expo-doctor` sin errores nuevos.
- [ ] La app abre en el celular físico y conecta con el backend por la IP de la PC.
- [ ] **Prueba manual, fila 1 de `docs/testing.md`:** el login con credenciales
  del seed entra; con credenciales erróneas muestra el mensaje del error.
- [ ] Con el backend apagado, el login muestra el mensaje de falta de conexión.
- [ ] Reiniciar el backend con la sesión abierta y navegar o refrescar lleva
  al login con el aviso de sesión expirada (se prueba cuando existan llamadas
  autenticadas; en este spec, con `GET /auth/yo` desde un botón o efecto de prueba
  que se elimina después).
- [ ] Cerrar sesión vuelve al login.
- [ ] La URL del backend no aparece escrita en ningún archivo de `src/`.
- [ ] Ninguna pantalla llama a `fetch` directamente.
- [ ] `mobile/README.md` explica cómo correr el proyecto.
## Fuera de este spec
- Pantallas de eventos, compras, chat y reseñas (specs 08b a 08f).
- Persistir la sesión entre reinicios de la app.
- Tests automáticos del front (decisión de alcance: no hay framework de tests).
 