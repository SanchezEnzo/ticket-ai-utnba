# 00: Base del proyecto

## Objetivo
Dejar la estructura del backend lista para que todos los specs siguientes se
apoyen en ella. Esta fase no implementa ningún caso de uso.

## Documentos de referencia
- `docs/architecture.md`: secciones 1, 2 y 3 (capas, convenciones, estructura de carpetas)
- `docs/testing.md`: secciones 1, 2 y 3 (comandos, helpers, estructura de tests)

## Alcance

### 1. Documentación
- Los documentos del proyecto están en `docs/`: `architecture.md`,
  `business-context.md` y `testing.md`.
- Existe la carpeta `specs/active/`.

### 2. Proyecto backend
- `backend/package.json` con **solo dos dependencias: `express` y `zod`**
  (esta última fijada a una versión exacta, sin `^`). Se usa a partir del
  spec 01 para validar la entrada HTTP; no se usa en este spec, pero se
  instala acá para dejar el `package.json` completo.
- Scripts exactamente como figuran en `docs/testing.md` sección 2:
  `start`, `test`, `test:domain`, `test:api`.
- Estructura de carpetas de `docs/architecture.md` sección 3 (con un
  `.gitkeep` en las carpetas que quedan vacías):
  `src/routes`, `src/controllers`, `src/services`, `src/domain`,
  `src/repositories`, `src/middleware`, `src/schemas`, `src/seed`,
  `test/helpers`, `test/domain`, `test/middleware`, `test/api`.

### 3. Arranque del servidor
- `src/app.js` crea la app Express (con `express.json()`) y la **exporta**.
  No llama a `listen`.
- `src/server.js` importa la app y la levanta en `process.env.PORT` (3000 por defecto).
- Todo el backend usa **módulos ES (ESM)**: `"type": "module"` en
  `package.json`, `import`/`export` y extensión `.js` explícita en los
  imports relativos (`import { app } from './app.js'`). No se mezcla con
  `require` ni `module.exports`.

### 4. Reloj
- Un único módulo `src/domain/reloj.js` que exporta `ahora()` (devuelve un
  `Date`) y una forma de reemplazarlo en los tests (por ejemplo
  `fijarAhora(fecha)` y `restaurarReloj()`).
- El resto del código nunca llama a `new Date()` ni a `Date.now()` directamente:
  siempre usa este módulo.

### 5. Helpers de test
- `test/helpers/crearApp.js`: crea una app nueva con repositorios nuevos,
  la levanta en el puerto 0 y devuelve `{ baseUrl, close }`.
  Por ahora la app no tiene repositorios, el helper queda preparado para
  recibirlos en los specs siguientes.
- `test/helpers/login.js`: se deja como esqueleto documentado; se completa en
  el spec 01, cuando exista el login.

### 6. Ruta y test de humo (temporales)
- `GET /salud` responde `{ "estado": "ok" }`.
- `test/api/salud.test.js` levanta la app con `crearApp` y verifica la
  respuesta y que el servidor se cierra.
- La ruta y su test **se eliminan al cerrar el spec 01**, cuando haya
  tests reales.

## Criterios de aceptación
- [ ] `npm install` termina sin errores.
- [ ] `npm test` pasa y muestra al menos el test de humo.
- [ ] `npm start` levanta el servidor y `GET /salud` responde 200.
- [ ] `package.json` tiene solo `express` y `zod` (versión exacta) en `dependencies` y no tiene `devDependencies`.
- [ ] `app.js` exporta la app y no llama a `listen`.
- [ ] `package.json` tiene `"type": "module"` y no hay `require(` ni `module.exports` en `src/` ni en `test/`.
- [ ] `grep` de `new Date(` y `Date.now(` fuera de `reloj.js` no devuelve resultados.
- [ ] Las carpetas coinciden con `docs/architecture.md`.

## Fuera de este spec
- Errores de dominio, middleware de errores y autenticación (spec 01).
- Entidades, repositorios, seed y cualquier endpoint de negocio.
- Todo lo de `mobile/`.