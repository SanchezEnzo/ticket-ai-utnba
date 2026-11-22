# 06: Favoritos

## Casos de uso que cubre
- Como comprador, quiero poder marcar y desmarcar eventos como favoritos y
  listar los míos (sección 7 de `business-context.md`).

Nota de alcance: el enunciado del TP menciona los favoritos en la descripción
general, pero no están entre los 12 casos de uso listados. Es el spec más
prescindible: si el tiempo aprieta, se puede omitir sin afectar ningún caso de
uso evaluado.

## Documentos de referencia
- `docs/business-context.md`: sección 7 (favoritos)
- `docs/architecture.md`: "Validación de requests", endpoints
- `docs/testing.md`: sección 4.2 (Favoritos)

## Requisito previo
Spec `05-resenias.md` cerrado.

## Alcance

### 1. Dominio
`Usuario` ya tiene la lista `favoritos` (ids de evento, spec 01). Se agregan:
- `usuario.marcarFavorito(eventoId)`: lo agrega si no estaba. Marcar dos veces
  no duplica.
- `usuario.desmarcarFavorito(eventoId)`: lo quita si estaba. Quitar un evento
  que no era favorito no falla.
- `usuario.esFavorito(eventoId)`.
- El orden interno es el de inserción, sin duplicados.

### 2. Servicio
`FavoritoService`:
- `marcar(eventoId, usuario)`: busca el evento (`NotFoundError` si no existe),
  llama a `usuario.marcarFavorito` y persiste con `UsuarioRepository.guardar`.
- `quitar(eventoId, usuario)`: busca el evento (`NotFoundError` si no existe),
  llama a `usuario.desmarcarFavorito` y persiste.
- `listar(usuario)`: devuelve los eventos favoritos del usuario, ordenados por
  fecha ascendente y después por nombre. **Incluye los eventos ya
  realizados**, para que un favorito no desaparezca sin que el usuario lo note.
  No trae eventos que ya no existan.

### 3. Seed
Agregar favoritos de ejemplo al usuario comprador del seed (2 o 3 eventos,
entre ellos uno con fecha futura y uno ya realizado), usando
`marcarFavorito`.

### 4. Validación con zod
Schemas en `src/schemas/favorito.schema.js`, aplicados con `validar`. Los
controllers leen de `req.datos`.
- `favoritoParamsSchema = z.object({ eventoId: idSchema }).strict()` para
  `PUT` y `DELETE`.
- `GET` no recibe query, `PUT` y `DELETE` tampoco: `sinQuerySchema`. Un
  parámetro de query en cualquiera de las tres rutas responde 400.
- Ninguna ruta recibe body: se ignora.

### 5. Endpoints
Todos requieren autenticación.

**`GET /favoritos`**: 200 con un arreglo de eventos, con la misma forma que en
`GET /eventos` (spec 02, incluido `puntajeOrganizador`). Solo los del usuario
autenticado.

**`PUT /favoritos/:eventoId`**: marca el evento como favorito. 204 sin cuerpo.
Es idempotente: marcar un evento que ya era favorito también responde 204 y no
duplica.
- 400 por schema. 404 si el evento no existe.

**`DELETE /favoritos/:eventoId`**: quita el favorito. 204 sin cuerpo. Es
idempotente: quitar un evento que no era favorito también responde 204.
- 400 por schema. 404 si el evento no existe.

- Un organizador puede marcar como favorito su propio evento.
- La respuesta de eventos (`GET /eventos`, `GET /eventos/:id`) **no** incluye
  un campo `esFavorito`; el front cruza con `GET /favoritos`.

### 6. Documentación
Actualizar `docs/architecture.md`: `Usuario.marcarFavorito`,
`desmarcarFavorito`, `esFavorito`, el schema `favorito.schema.js` y los
códigos 204 de `PUT` y `DELETE`.

## Tests

`test/domain/Usuario.test.js` (se amplía)
- `marcarFavorito` agrega; marcar dos veces no duplica; mantiene el orden.
- `desmarcarFavorito` quita; quitar uno que no estaba no falla.
- `esFavorito` verdadero y falso.

`test/api/favoritos.test.js`
- Marcar, listar y quitar: el evento aparece y luego desaparece del listado.
- **Marcar dos veces no duplica** (el listado tiene una sola entrada) y
  responde 204 las dos veces.
- Quitar un evento que no era favorito: 204.
- El listado trae la forma de evento del spec 02 (con `puntajeOrganizador`) y
  está ordenado por fecha y nombre.
- Incluye eventos ya realizados (el del seed).
- Cada usuario ve solo los suyos (dos usuarios con favoritos distintos).
- Los favoritos del seed se listan correctamente.
- Evento inexistente: 404 en `PUT` y `DELETE`. `:eventoId` inválido: 400.
  Parámetro de query en las tres rutas: 400. Sin token: 401.
- Un organizador marca su propio evento: 204.
- Ninguna respuesta contiene email, contraseña ni hash.

## Criterios de aceptación
- [ ] `npm test` completo pasa y se muestra la salida.
- [ ] Marcar dos veces no duplica (verificado en dominio y en API).
- [ ] La lógica de la lista de favoritos vive en `Usuario`; el service solo
  orquesta.
- [ ] Params y query se validan con zod; los controllers leen de `req.datos`.
- [ ] `package.json` sigue teniendo solo `express` y `zod`.
- [ ] `docs/architecture.md` actualizado.

## Fuera de este spec
- Campo `esFavorito` en la respuesta de eventos, contador de favoritos,
  notificaciones, paginación.
- La pantalla de favoritos (front).