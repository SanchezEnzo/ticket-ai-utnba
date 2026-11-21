# 05: Reseñas y puntaje del organizador

## Casos de uso que cubre
- Como organizador, quiero que una vez utilizada una entrada el comprador
  pueda puntuar el Evento de forma numérica y dejar un comentario escrito.
- Como comprador, quiero que las reseñas de eventos anteriores se visualicen
  en los Eventos de cada organizador para conocer experiencias previas antes
  de comprar.
- Como comprador, al buscar Eventos, quiero poder ordenarlos por puntaje del
  organizador (completa el orden que quedó pendiente en el spec 02).

## Documentos de referencia
- `docs/business-context.md`: sección 5 (reseñas), sección 6 (orden) y
  sección 9 (casos borde de reseñas)
- `docs/architecture.md`: "Dominio rico", "Validación de requests", endpoints
- `docs/testing.md`: secciones 4.1 (Resenia) y 4.2 (Reseñas)

## Requisito previo
Spec `04-mensajes.md` cerrado.

## Alcance

### 1. Dominio

**`Resenia`**: id, comprador (un `Usuario`), evento, puntaje, comentario y
fecha (`ahora()` al crearla). Tiene su propio repositorio.

`Resenia.crear({ comprador, evento, puntaje, comentario, compras, reseniaPrevia })`
- `puntaje`: número entre 1 y 5, en pasos de 0,5 (1, 1.5, 2, ... 5). Cualquier
  otro valor (0, 0.5, 5.5, 4.3, texto, `null`, `NaN`) lanza `ValidationError`.
- `comentario`: string que, después de `trim`, no está vacío ni supera los
  1000 caracteres, si no `ValidationError`. Es **obligatorio**: el enunciado
  pide "un comentario escrito".
- `compras` es la lista de compras del comprador (el service la obtiene del
  repositorio). La reseña solo se permite si **al menos una compra de ese
  comprador sobre ese evento está UTILIZADA**. El dominio filtra por comprador
  y evento por su cuenta, sin confiar en lo que le pasan. Si no hay ninguna:
  `ForbiddenError`. Compras PENDIENTE, CONFIRMADA, CANCELADA o REEMBOLSADA no
  habilitan reseñar; tampoco una UTILIZADA de otro evento o de otro usuario.
- `reseniaPrevia`: si ya existe una reseña de ese comprador sobre ese evento
  (el service la busca en el repositorio), lanza `ConflictError`. Es **una
  reseña por evento y por usuario**, aunque tenga varias compras.
- Orden de validación: primero `puntaje` y `comentario` (400), después la
  compra UTILIZADA (403), después la reseña previa (409).
- Una compra UTILIZADA habilita reseñar **sin importar la fecha del evento**
  (marcar como utilizada es una simulación y no depende de la fecha).

`Resenia.promedio(resenias)`: promedio simple de los `puntaje` de la lista, sin
redondear; `null` si la lista está vacía.

**Puntaje del organizador** = `Resenia.promedio` de **todas las reseñas de
todos sus eventos** (cada reseña pesa lo mismo, no se promedian primero los
promedios por evento). `null` si el organizador no tiene reseñas.

### 2. Repositorio
`ReseniaRepository` (interfaz + memoria): `guardar`,
`buscarPorCompradorYEvento(compradorId, eventoId)` y
`listarPorOrganizador(organizadorId)` (reseñas de todos los eventos de ese
organizador).

### 3. Servicio
`ReseniaService`:
- `crear(eventoId, usuario, { puntaje, comentario })`: busca el evento
  (`NotFoundError` si no existe), obtiene las compras del usuario
  (`CompraRepository.listarPorComprador`) y la reseña previa, llama a
  `Resenia.crear` y guarda.
- `listarDelOrganizadorDe(eventoId)`: busca el evento (`NotFoundError`) y
  devuelve las reseñas de todos los eventos de **su organizador**, de la más
  reciente a la más antigua.
- `puntajeDelOrganizador(organizadorId)` y una forma de obtener los puntajes de
  varios organizadores de una vez (para no recalcular por cada evento al listar
  el catálogo).

`EventoService` usa estos puntajes para completar `puntajeOrganizador` en las
respuestas de evento y para el orden por puntaje.

### 4. Cambios en eventos (completa el spec 02)
- `puntajeOrganizador` deja de ser siempre `null`: es el puntaje del
  organizador **redondeado a 1 decimal**, o `null` si no tiene reseñas. Aplica a
  `GET /eventos` y `GET /eventos/:id`.
- `GET /eventos?orden=puntaje`: mejor puntaje primero. El orden usa el
  promedio **sin redondear**. Los organizadores sin reseñas (`null`) quedan
  **al final**. El desempate sigue siendo fecha ascendente y después nombre.

### 5. Seed
Ampliar el seed (determinístico) con reseñas creadas a través del dominio
(`Resenia.crear`), apoyadas en compras UTILIZADAS construidas con
`Compra.crear` y `actualizarEstado`. Si hace falta, agregar usuarios al seed
(se documentan sus credenciales en el módulo de seed):
- Un organizador A con **al menos dos eventos** y **al menos 3 reseñas** entre
  ellos, de **al menos 2 usuarios distintos**, con puntajes variados que
  incluyan medios puntos. El promedio esperado se calcula en el test desde los
  datos del seed.
- Un organizador B con reseñas y un promedio distinto al de A.
- Un organizador sin reseñas (puntaje `null`).
- La compra UTILIZADA del comprador sobre el evento ya realizado (spec 03a)
  queda **sin reseñar**, para poder reseñar por API en los tests.
- Al menos un usuario que no tenga ninguna compra UTILIZADA de un evento
  dado, para probar el 403.
- El módulo de seed exporta los ids que usan los tests.

### 6. Validación con zod
Schemas en `src/schemas/resenia.schema.js`, aplicados con `validar`. Los
controllers leen de `req.datos`.
- Params: `eventoIdParamsSchema` (del spec 02).
- `crearReseniaBodySchema` (`POST`), `.strict()`:
  - `puntaje`: número (sin coerción) entre 1 y 5 en pasos de 0,5.
  - `comentario`: string con `trim`, longitud entre 1 y 1000.
  - Un `puntaje` como texto (`"4"`), fuera de rango, que no sea múltiplo de
    0,5, un `comentario` vacío o de más de 1000 caracteres, o claves de más,
    responden 400.
- `GET` no recibe query: `sinQuerySchema`.
- `Resenia.crear` **también** valida puntaje y comentario (duplicación
  intencional, ver spec 01).

### 7. Endpoints
Ambos requieren autenticación.

**`POST /eventos/:id/resenias`**: body `{ "puntaje": 4.5, "comentario": "..." }`.
201 con la reseña.
- 400 por schema (puntaje o comentario inválidos, claves de más, id inválido).
- 403 si el usuario no tiene una compra UTILIZADA de ese evento (incluye al
  organizador del evento, que no puede comprarlo).
- 404 si el evento no existe.
- 409 si el usuario ya dejó una reseña sobre ese evento.

**`GET /eventos/:id/resenias`**: reseñas **del organizador del evento**, es
decir, de todos sus eventos (incluido el consultado), para que los
compradores conozcan sus experiencias previas antes de comprar. Ordenadas de
la más reciente a la más antigua. Lista vacía si no hay.
- 400 por schema (id inválido o parámetros de query). 404 si el evento no existe.

**Forma de una reseña**
```json
{
  "id": "...",
  "puntaje": 4.5,
  "comentario": "...",
  "fecha": "2027-03-22T10:00:00.000Z",
  "autor": { "id": "...", "nombre": "...", "apellido": "..." },
  "evento": { "id": "...", "nombre": "...", "fecha": "2027-03-20T21:00:00.000Z" }
}
```
- El autor **nunca** incluye email, contraseña ni hash.
- Cada reseña indica a qué evento corresponde, porque la lista mezcla eventos
  del mismo organizador.

### 8. Documentación
Actualizar `docs/architecture.md`: `Resenia.crear`, `Resenia.promedio`, el
schema `resenia.schema.js`, `puntajeOrganizador` calculado, y la descripción
del endpoint `GET /eventos/:id/resenias` ("Reseñas del organizador del
evento"). Actualizar la línea de `docs/testing.md` sección 4.2 que dice que
devuelve "las reseñas del evento".

## Tests

`test/domain/Resenia.test.js`
- Puntajes válidos: 1, 1.5, 2, ... 5 (todos los pasos).
- Puntajes inválidos: 0, 0.5, 5.5, 6, -1, 4.3, 4.25, `NaN`, `"4"`, `null`,
  `undefined`: `ValidationError`.
- Comentario vacío, solo espacios, no string, de 1001 caracteres:
  `ValidationError`; de exactamente 1000, válido.
- **Sin compra UTILIZADA: `ForbiddenError`.** Probar con compras en cada
  estado (PENDIENTE, CONFIRMADA, CANCELADA, REEMBOLSADA), con una UTILIZADA de
  otro evento y con una UTILIZADA de otro usuario, y con lista vacía.
- Con una compra UTILIZADA entre varias: se crea.
- **Segunda reseña del mismo usuario sobre el mismo evento: `ConflictError`**,
  aunque tenga dos compras UTILIZADAS.
- Un mismo usuario puede reseñar dos eventos distintos.
- `promedio`: lista vacía da `null`; un elemento; varios con medios puntos;
  no redondea.

`test/api/resenias.test.js`
- Flujo completo: comprar, pagar, el organizador marca UTILIZADA, el
  comprador reseña: 201 con la forma indicada.
- **Reseñar sin compra UTILIZADA: 403** (con compra PENDIENTE, con CONFIRMADA y
  sin ninguna compra). El organizador del evento: 403.
- **Segunda reseña sobre el mismo evento: 409**, también con dos compras
  UTILIZADAS.
- Puntaje fuera de rango o que no es múltiplo de 0,5, y `"4"` como texto: 400.
  Comentario vacío o de 1001 caracteres: 400. Claves de más: 400.
- Evento inexistente: 404 en GET y POST. Sin token: 401. `:id` inválido: 400.
  Parámetro de query en el GET: 400.
- `GET /eventos/:id/resenias` devuelve las reseñas de **todos los eventos del
  organizador** del evento consultado (probar con dos eventos del organizador A
  y verificar que aparecen reseñas de ambos), **sin** las de otros organizadores.
- Cada reseña trae `evento` y `autor`; orden de la más reciente a la más
  antigua; lista vacía para un organizador sin reseñas.
- **El puntaje del organizador es el promedio de todas sus reseñas:** verificar
  `puntajeOrganizador` contra el promedio calculado desde el seed (redondeado a
  1 decimal), en `GET /eventos/:id` y en `GET /eventos`, para los eventos de A.
- Tras crear una reseña nueva, `puntajeOrganizador` cambia al valor esperado.
- Organizador sin reseñas: `puntajeOrganizador` es `null`.
- `GET /eventos?orden=puntaje`: verificar la **lista completa**: mejor
  puntaje primero, organizadores sin reseñas al final, desempate por fecha y
  nombre.
- Ninguna respuesta contiene email, contraseña ni hash.

## Criterios de aceptación
- [ ] `npm test` completo pasa y se muestra la salida.
- [ ] Los 3 casos borde de reseñas de `business-context.md` sección 9 tienen
  test (sin compra utilizada, segunda reseña, puntaje inválido).
- [ ] Las reglas de reseña y el promedio viven en `Resenia`; el service y el
  controller no calculan promedios ni evalúan estados de compra.
- [ ] El puntaje del organizador es el promedio de las reseñas de todos sus
  eventos (no el promedio de promedios).
- [ ] `GET /eventos?orden=puntaje` funciona y deja los `null` al final.
- [ ] Params, query y body se validan con zod; los controllers leen de
  `req.datos`.
- [ ] Ningún `new Date(` ni `Date.now(` fuera de `reloj.js`.
- [ ] `package.json` sigue teniendo solo `express` y `zod`.
- [ ] `docs/architecture.md` y `docs/testing.md` actualizados.

## Fuera de este spec
- Editar o borrar reseñas, responder reseñas, reportes.
- Mostrar las reseñas en el front (fases de mobile).
- Paginación de reseñas.