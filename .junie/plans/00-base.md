# Spec 00 — Base del proyecto

### ✓ Step 1: Crear package.json y estructura de carpetas

**Descripción:** Se crea `backend/package.json` con dependencias, scripts y estructura de carpetas completa.

- Crear `backend/package.json` con `"type": "module"`, dependencias `express` y `zod` (versión exacta), y scripts `start`, `test`, `test:domain`, `test:api`.
- Ejecutar `npm install` en `backend/` para instalar las dependencias.
- Crear la estructura de carpetas: `src/routes`, `src/controllers`, `src/services`, `src/domain`, `src/repositories`, `src/middleware`, `src/schemas`, `src/seed`, `test/helpers`, `test/domain`, `test/middleware`, `test/api`.
- Agregar `.gitkeep` en las carpetas vacías (todas excepto `src/domain`, `test/helpers`, `test/api`).

### ✓ Step 2: Implementar app.js, server.js y reloj.js

**Descripción:** Se crean los módulos de arranque del servidor y el reloj centralizado.

- `src/app.js`: crea la app Express con `express.json()`, agrega `GET /salud` que responde `{ "estado": "ok" }`, y exporta la app.
- `src/server.js`: importa la app, lee `process.env.PORT` (3000 por defecto), llama a `app.listen()` y logs el puerto.
- `src/domain/reloj.js`: exporta `ahora()`, `fijarAhora(fecha)` y `restaurarReloj()`. Usa `new Date()` solo aquí.
- Verificar que no haya `require(` ni `module.exports` en ningún archivo de `src/`.

### ✓ Step 3: Implementar helpers de test y test de humo

**Descripción:** Se crean los helpers de test y el test de humo para validar el arranque del servidor.

- `test/helpers/crearApp.js`: importa la app, la levanta en puerto 0 con `listen(0)`, devuelve `{ baseUrl, close }`.
- `test/helpers/login.js`: esqueleto documentado que lanza error indicando que se completa en spec 01.
- `test/api/salud.test.js`: usa `node:test` y `node:assert/strict`, levanta la app con `crearApp`, hace `GET /salud` con `fetch`, verifica la respuesta y cierra el servidor.
- Ejecutar `npm test` y verificar que pasa el test de humo.
- Ejecutar `npm start` y verificar que `GET /salud` responde 200.

# Resultados

- `npm test`: 3 tests pasados, 0 fallados.
- `npm start` + `curl GET /salud`: responde 200 con `{"estado":"ok"}`.
- Sin `require(` ni `module.exports` en `src/` ni `test/`.
- `new Date()` solo en `reloj.js`.
