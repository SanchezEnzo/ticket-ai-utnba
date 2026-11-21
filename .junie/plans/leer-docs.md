---
sessionId: session-261121-045435-1vye
---

# Requirements

### Overview & Goals

Dejar la estructura del backend lista para que todos los specs siguientes se apoyen en ella. Esta fase no implementa ningún caso de uso de negocio.

### Scope

**In Scope:**
- Crear `backend/package.json` con `express` y `zod` (versión exacta) como únicas dependencias.
- Scripts de `package.json`: `start`, `test`, `test:domain`, `test:api`.
- Estructura de carpetas según `docs/architecture.md` sección 3, con `.gitkeep` en carpetas vacías.
- `src/app.js`: crea la app Express con `express.json()`, la exporta, no llama a `listen`.
- `src/server.js`: importa la app y la levanta en `process.env.PORT` (3000 por defecto).
- Módulos ES (ESM): `"type": "module"` en `package.json`, `import`/`export`, extensión `.js` explícita.
- `src/domain/reloj.js`: exporta `ahora()`, `fijarAhora(fecha)` y `restaurarReloj()`.
- `test/helpers/crearApp.js`: crea app nueva, la levanta en puerto 0, devuelve `{ baseUrl, close }`.
- `test/helpers/login.js`: esqueleto documentado, se completa en spec 01.
- `GET /salud` responde `{ "estado": "ok" }` (ruta temporal, se elimina en spec 01).
- `test/api/salud.test.js`: test de humo que verifica la respuesta y el cierre del servidor.

**Out of Scope:**
- Errores de dominio, middleware de errores y autenticación (spec 01).
- Entidades, repositorios, seed y cualquier endpoint de negocio.
- Todo lo de `mobile/`.

### Acceptance Criteria

- `npm install` termina sin errores.
- `npm test` pasa y muestra al menos el test de humo.
- `npm start` levanta el servidor y `GET /salud` responde 200.
- `package.json` tiene solo `express` y `zod` (versión exacta) en `dependencies` y no tiene `devDependencies`.
- `app.js` exporta la app y no llama a `listen`.
- `package.json` tiene `"type": "module"` y no hay `require(` ni `module.exports` en `src/` ni en `test/`.
- `grep` de `new Date(` y `Date.now(` fuera de `reloj.js` no devuelve resultados.
- Las carpetas coinciden con `docs/architecture.md`.

# Technical Design

### Current Implementation

El proyecto solo contiene documentación (`docs/`), specs (`specs/active/`) y un `.gitignore`. No existe la carpeta `backend/` ni ningún código fuente.

### Key Decisions

- **Módulos ES (ESM):** `"type": "module"` en `package.json`. Todos los imports relativos usan extensión `.js` explícita.
- **Zod con versión exacta:** Sin `^` ni `~`, para cumplir con la regla de `AGENTS.md` de usar `pnpm add --save-exact`.
- **Reloj centralizado:** `src/domain/reloj.js` con `ahora()`, `fijarAhora()` y `restaurarReloj()`. Ningún otro archivo usa `new Date()` ni `Date.now()` directamente.
- **Helper de test con puerto efímero:** `crearApp.js` usa `listen(0)` para no depender del puerto 3000.
- **Ruta `/salud` temporal:** Solo para validar que el servidor arranca y responde. Se elimina en el spec 01.

### Proposed Changes

**1. `backend/package.json`**
- `"type": "module"`.
- Dependencias: `express` y `zod` (versión exacta).
- Scripts: `start`, `test`, `test:domain`, `test:api` (según `docs/testing.md` sección 2).

**2. Estructura de carpetas (con `.gitkeep`)**
```
backend/
  src/
    app.js
    server.js
    routes/          (.gitkeep)
    controllers/     (.gitkeep)
    services/        (.gitkeep)
    domain/
      reloj.js
    repositories/    (.gitkeep)
    middleware/      (.gitkeep)
    schemas/         (.gitkeep)
    seed/            (.gitkeep)
  test/
    helpers/
      crearApp.js
      login.js
    domain/          (.gitkeep)
    middleware/      (.gitkeep)
    api/
      salud.test.js
```

**3. `src/app.js`**
- Importa `express`, crea la app, configura `express.json()`.
- Agrega la ruta `GET /salud` que responde `{ "estado": "ok" }`.
- Exporta la app (`module.exports` → no, usa `export { app }` o `export default app`).

**4. `src/server.js`**
- Importa la app de `./app.js`.
- Lee `process.env.PORT` (3000 por defecto).
- Llama a `app.listen()` y logs el puerto.

**5. `src/domain/reloj.js`**
- Variable privada `_relojFijado` (null por defecto).
- `ahora()`: devuelve `_relojFijado` si está fijado, sino `new Date()`.
- `fijarAhora(fecha)`: fija `_relojFijado` a `fecha`.
- `restaurarReloj()`: resetea `_relojFijado` a null.

**6. `test/helpers/crearApp.js`**
- Importa la app de `../../src/app.js`.
- La levanta con `listen(0)`.
- Devuelve `{ baseUrl, close }` donde `baseUrl` es `http://localhost:<puerto_efimero>` y `close()` cierra el servidor.

**7. `test/helpers/login.js`**
- Esqueleto con comentarios documentando que se completa en el spec 01.
- Exporta una función `login(fetch, baseUrl, email, password)` que por ahora lanza `Error('No implementado. Se completa en spec 01.')`.

**8. `test/api/salud.test.js`**
- Usa `node:test` y `node:assert/strict`.
- Levanta la app con `crearApp`.
- Hace `GET /salud` con `fetch`.
- Verifica que la respuesta sea `{ "estado": "ok" }`.
- Cierra el servidor con `close()`.

### Architecture Diagram

``` mermaid
graph LR
  A[server.js] -->|importa| B[app.js]
  B -->|usa| C[express]
  B -->|ruta| D[GET /salud]
  E[reloj.js] -->|exporta| F[ahora / fijarAhora / restaurarReloj]
  G[crearApp.js] -->|importa| B
  H[salud.test.js] -->|usa| G
  H -->|usa| I[fetch]
```

### Risks

- **Zod sin usar en este spec:** Se instala pero no se importa ni usa. Esto es intencional: el spec 01 lo usará para validación. Verificar que no haya imports de zod en el código actual.
- **Puerto efímero:** `crearApp.js` usa `listen(0)`. El puerto real se obtiene del servidor con `server.address().port`.

# Delivery Steps

### ✓ Step 1: Crear package.json y estructura de carpetas
Se crea `backend/package.json` con dependencias, scripts y estructura de carpetas completa.
- Crear `backend/package.json` con `"type": "module"`, dependencias `express` y `zod` (versión exacta), y scripts `start`, `test`, `test:domain`, `test:api`.
- Ejecutar `npm install` en `backend/` para instalar las dependencias.
- Crear la estructura de carpetas: `src/routes`, `src/controllers`, `src/services`, `src/domain`, `src/repositories`, `src/middleware`, `src/schemas`, `src/seed`, `test/helpers`, `test/domain`, `test/middleware`, `test/api`.
- Agregar `.gitkeep` en las carpetas vacías (todas excepto `src/domain`, `test/helpers`, `test/api`).

### ✓ Step 2: Implementar app.js, server.js y reloj.js
Se crean los módulos de arranque del servidor y el reloj centralizado.
- `src/app.js`: crea la app Express con `express.json()`, agrega `GET /salud` que responde `{ "estado": "ok" }`, y exporta la app.
- `src/server.js`: importa la app, lee `process.env.PORT` (3000 por defecto), llama a `app.listen()` y logs el puerto.
- `src/domain/reloj.js`: exporta `ahora()`, `fijarAhora(fecha)` y `restaurarReloj()`. Usa `new Date()` solo aquí.
- Verificar que no haya `require(` ni `module.exports` en ningún archivo de `src/`.

### ✓ Step 3: Implementar helpers de test y test de humo
Se crean los helpers de test y el test de humo para validar el arranque del servidor.
- `test/helpers/crearApp.js`: importa la app, la levanta en puerto 0 con `listen(0)`, devuelve `{ baseUrl, close }`.
- `test/helpers/login.js`: esqueleto documentado que lanza error indicando que se completa en spec 01.
- `test/api/salud.test.js`: usa `node:test` y `node:assert/strict`, levanta la app con `crearApp`, hace `GET /salud` con `fetch`, verifica la respuesta y cierra el servidor.
- Ejecutar `npm test` y verificar que pasa el test de humo.
- Ejecutar `npm start` y verificar que `GET /salud` responde 200.