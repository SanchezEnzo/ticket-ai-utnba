# AI Ticket It — App Móvil

Aplicación móvil para comprar y gestionar entradas a eventos, construida con React Native y Expo.

## Requisitos

- Node.js 18+
- Cuenta de Expo con la app **Expo Go** instalada en tu celular (iOS o Android)
- Celular y computadora en la **misma red WiFi**

## Instalación

```bash
cd mobile
npm install
```

## Configuración

1. **Averiguá la IP de tu computadora** en la red local:
   - Linux: `ip addr show` (buscá la interfaz WiFi/ethernet)
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig` (buscá la dirección IPv4)

2. **Creá el archivo `.env`** copiando el ejemplo:

   ```bash
   cp .env.example .env
   ```

3. **Editá `.env`** y reemplazá la IP con la tuya:

   ```
   EXPO_PUBLIC_API_URL=http://<tu-ip>:3000
   ```

   > **Importante:** No uses `localhost`. El celular no puede acceder a `localhost` de tu computadora. Usá la IP de la red local.

4. **Levantá el backend** en otra terminal:

   ```bash
   cd ../backend
   npm start
   ```

5. **Iniciá Expo:**

   ```bash
   cd ../mobile
   npx expo start
   ```

6. **Abrí la app en tu celular:**
   - Escaneá el código QR con **Expo Go** (iOS o Android)
   - O presioná `a` para abrir en Android emulador, `i` para iOS simulator

> **Si cambiás `.env`, reiniciá Expo** presionando `r` en la terminal o cerrando y volviendo a correr `npx expo start`. Las variables de entorno se leen al inicio del proceso.

## Credenciales de prueba

El backend carga datos de ejemplo al arrancar. Usá estas credenciales:

| Rol | Email | Contraseña |
|---|---|---|
| Comprador | comprador@ticketit.com | 123456 |
| Organizador | organizador@ticketit.com | 123456 |

## Estructura

```
mobile/
  App.js                  # Entrada: config, sesión y navegación
  app.json                # Configuración de Expo
  .env.example            # Plantilla de variables de entorno
  src/
    config.js             # URL del backend desde variables de entorno
    theme.js              # Colores, espaciados, tipografía
    api/
      client.js           # Cliente HTTP único (fetch, timeout, errores)
      auth.js             # login() y yo()
    context/
      SessionContext.js   # Sesión en memoria (token + usuario)
    hooks/
      useNavigationWithAuth.js  # Vincula 401 con cierre de sesión
    utils/
      formato.js          # formatearPrecio, formatearFecha, etc.
    components/
      Pantalla.js         # Contenedor con SafeAreaView
      Boton.js            # Botón con loading y disabled
      CampoTexto.js       # TextInput con label
      Cargando.js         # Spinner centrado
      ErrorMensaje.js     # Mensaje de error con reintentar
      EstadoVacio.js      # Ícono + texto para listas vacías
      EstadoBadge.js      # Etiqueta de estado de compra
      EventoCard.js       # Tarjeta de evento con favorito
    screens/
      LoginScreen.js      # Inicio de sesión
      CuentaScreen.js     # Datos del usuario y cerrar sesión
      ExplorarScreen.js   # Catálogo de eventos con búsqueda
      FavoritosScreen.js  # Eventos guardados como favoritos
      ComprasScreen.js    # Mis compras con cancelar y reseña
      MisEventosScreen.js # Eventos publicados por el usuario
      DetalleEventoScreen.js  # Detalle del evento con reseñas
      CompraScreen.js     # Formulario para comprar entradas
      CrearEventoScreen.js  # Formulario para crear evento
      ComprasDelEventoScreen.js  # Compras de un evento (organizador)
      ChatScreen.js       # Chat de mensajes de una compra
      ResenaScreen.js     # Formulario para dejar reseña
    navigation/
      AppNavigator.js     # Stack + Tabs con React Navigation
```

## Validación

```bash
npx expo-doctor
```

## Notas

- **Sesión en memoria:** al cerrar la app se pierde la sesión. No se usa AsyncStorage.
- **Sin fetch en pantallas:** todas las llamadas a la API pasan por `src/api/client.js`.
- **401 automático:** si el backend reinicia (tokens en memoria se pierden), la app detecta el 401, cierra sesión y muestra un aviso en el login.
