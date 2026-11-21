# 02: Eventos y catálogo
 
## Casos de uso que cubre
- Como organizador, quiero poder crear un Evento ofreciendo distintos tipos de
  entrada, cada uno con su precio y cupo.
- Como comprador, quiero poder buscar Eventos mediante una búsqueda textual o
  explorarlos por categorías.
- Como comprador, al buscar Eventos, quiero poder ordenarlos por precio, fecha
  del evento y puntaje del organizador (el orden por puntaje se completa en el
  spec 05).
## Documentos de referencia
- `docs/business-context.md`: secciones 2 (eventos y tipos de entrada) y 6
  (búsqueda, filtros y orden)
- `docs/architecture.md`: capas, dominio rico, entidades, endpoints
- `docs/testing.md`: secciones 4.1 (TipoEntrada, Evento) y 4.2 (Eventos y búsqueda)
## Requisito previo
Spec `01-errores-y-auth.md` cerrado, con la validación con zod disponible
(middleware `validar`, `req.validado` e `idSchema`).
 
## Alcance
 
### 1. Dominio
 
**`Categoria`**: id, nombre, descripción.
 
**`TipoEntrada`**: id, nombre, descripción, precio, `cupo` (total) y
`cupoDisponible`.
- Validaciones al crear: nombre no vacío, precio número >= 0, cupo entero > 0.
  Nace con `cupoDisponible` igual a `cupo`.
- `hayCupoPara(cantidad)`: verdadero si `cantidad` <= `cupoDisponible`.
- `reservar(cantidad)`: baja `cupoDisponible`. Falla si no hay cupo o si la
  cantidad no es un entero >= 1. `cupoDisponible` nunca queda negativo.
- `liberar(cantidad)`: sube `cupoDisponible`. Falla si la cantidad es
  inválida o si el resultado superaría el `cupo` total.
- Las compras usan `reservar` y `liberar` más adelante (spec 03).
**`Evento`**: id, nombre, descripción, categoría, fecha, tipos de entrada,
multimedia (lista de URLs) y organizador.
- Validaciones al crear: nombre y descripción no vacíos, fecha válida, al
  menos un tipo de entrada, nombres de tipos de entrada únicos dentro del
  evento, multimedia es una lista de strings (vacía si no se envía).
- `precioDesde()`: el precio del tipo de entrada más barato.
- `tuPrecioEstaEntre(min, max)`: verdadero si `precioDesde()` está entre
  `min` y `max`, ambos inclusive. No se expone por API en este spec.
- `yaSeRealizo()`: verdadero si la fecha es anterior a `ahora()` (usar el
  módulo `reloj`, nunca `new Date()`).
Los errores de validación del dominio son `ValidationError`.
 
### 2. Repositorios (interfaz + memoria)
- `CategoriaRepository`: `guardar`, `buscarPorId`, `listar`.
- `EventoRepository`: `guardar`, `buscarPorId`, `listar`.
- Los ids se generan en el backend (strings).
### 3. Seed
Ampliar el seed del spec 01, determinístico y con fechas **relativas a
`ahora()`**:
- 5 categorías: Recitales, Teatro, Festivales, Conferencias, Deportes.
- Al menos 8 eventos futuros repartidos entre categorías, con fechas y
  precios variados (para poder verificar el orden).
- Al menos 2 eventos del mismo organizador (se usa en el spec 05).
- Al menos un evento con 3 tipos de entrada (General, Platea, VIP).
- Al menos un evento **ya realizado** (fecha pasada).
- El módulo de seed exporta los ids y nombres que usan los tests, para que
  no estén escritos a mano en cada test.
### 4. Endpoints
Todos requieren autenticación.
 
**`GET /categorias`**: lista de categorías.
 
**`GET /eventos/:id`**: detalle de un evento, **incluso si ya se realizó**
(el catálogo los oculta, pero un evento pasado debe poder consultarse).
404 si no existe.
 
**`POST /eventos`**: crea un evento. El organizador es el usuario autenticado.
Body:
```json
{
  "nombre": "...",
  "descripcion": "...",
  "categoriaId": "...",
  "fecha": "2027-03-20T21:00:00.000Z",
  "multimedia": ["https://..."],
  "tiposEntrada": [
    { "nombre": "General", "descripcion": "...", "precio": 15000, "cupo": 200 }
  ]
}
```
- Responde 201 con el evento completo.
- Falla con 400 si: falta un campo obligatorio o tiene un tipo incorrecto,
  `categoriaId` no existe, la fecha no es válida o **ya pasó**, no hay tipos de
  entrada, o algún tipo de entrada es inválido.
**`GET /eventos?q=&categoria=&orden=`**: catálogo.
- `q`: texto buscado en nombre y descripción, sin distinguir mayúsculas. Se
  recorta con `trim`; vacío equivale a no enviarlo.
- `categoria`: id de categoría. Un id que no existe devuelve lista vacía.
- `q` y `categoria` se pueden combinar (se aplican ambos).
- `orden`: `precio` (ascendente por `precioDesde`), `fecha` (más próximo
  primero) o `puntaje` (mejor primero). Sin `orden`, se ordena por fecha.
- Desempate en todos los órdenes: fecha ascendente y, si empata, nombre.
- Para `puntaje`: todavía no existen reseñas, el puntaje del organizador es
  `null` para todos y los eventos quedan ordenados por el desempate. El spec
  05 completa esto (organizadores sin reseñas quedan al final).
- **No incluye eventos que ya se realizaron.**
- **Validación estricta de parámetros (con zod, ver sección 5):** un
  parámetro de URL fuera de `q`, `categoria` y `orden`, un valor de `orden`
  desconocido, o un parámetro repetido responde 400 con el formato de error
  unificado.
**Forma de la respuesta de un evento** (en lista y en detalle):
```json
{
  "id": "...",
  "nombre": "...",
  "descripcion": "...",
  "categoria": { "id": "...", "nombre": "..." },
  "fecha": "2027-03-20T21:00:00.000Z",
  "multimedia": ["..."],
  "organizador": { "id": "...", "nombre": "...", "apellido": "..." },
  "tiposEntrada": [
    { "id": "...", "nombre": "...", "descripcion": "...", "precio": 15000,
      "cupo": 200, "cupoDisponible": 200 }
  ],
  "precioDesde": 15000,
  "puntajeOrganizador": null
}
```
- El organizador **nunca** incluye email, contraseña ni hash.
- Las fechas viajan en ISO 8601 y los montos son números.
### 5. Validación con zod
La entrada HTTP se valida con schemas de zod en `src/schemas/eventos.js`,
aplicados con el middleware `validar` del spec 01. Los controllers leen de
`req.validado`. Los schemas validan **forma y tipo**; las reglas de negocio
siguen en el dominio (por ejemplo, que el precio sea >= 0, que el cupo sea
entero > 0 o que la fecha no haya pasado).
 
- `eventoIdParamsSchema`: `z.object({ id: idSchema }).strict()`. Se usa en
  `GET /eventos/:id`. Un id con formato inválido responde 400; uno válido pero
  inexistente, 404.
- `listarEventosQuerySchema` (`GET /eventos`), `.strict()`:
  - `q`: string opcional, con `trim`; si queda vacío se trata como no enviado.
  - `categoria`: string opcional (no se valida contra la lista: un id que no
    existe devuelve lista vacía, no error).
  - `orden`: enum `precio | fecha | puntaje`, opcional.
  - Una clave no declarada, un valor de `orden` fuera del enum y un parámetro
    repetido (que llega como arreglo) fallan con 400.
- `crearEventoBodySchema` (`POST /eventos`), `.strict()`:
  - `nombre`, `descripcion`: strings.
  - `categoriaId`: string.
  - `fecha`: string con formato ISO 8601 con zona horaria (que exista y no
    sea pasada lo decide el dominio).
  - `multimedia`: arreglo de strings, opcional (por defecto vacío).
  - `tiposEntrada`: arreglo de objetos `.strict()` con `nombre` (string),
    `descripcion` (string), `precio` (número) y `cupo` (número). Que el
    arreglo no esté vacío y los rangos de precio y cupo los valida el dominio.
  - Un texto donde va un número (`"15000"`) falla con 400: no se usa
    coerción de tipos.
- Se aplica a los controllers de este spec: ninguno valida formato a mano.
### 6. Estructura
- Rutas, controllers delgados y un `EventoService` (crear, buscar, detalle,
  categorías). Las reglas viven en las entidades; el service orquesta.
- Actualizar `docs/architecture.md`: `TipoEntrada` tiene `cupo` (total) y
  `cupoDisponible`, y `Evento` tiene `precioDesde()`.
## Tests
 
`test/domain/TipoEntrada.test.js`
- Creación válida y cada validación inválida (precio negativo, cupo 0,
  cupo no entero, nombre vacío).
- `hayCupoPara` en el límite exacto, uno antes y uno después.
- `reservar` baja el cupo; reservar más que el disponible falla y no cambia nada.
- `liberar` sube el cupo; liberar de más (supera el total) falla.
- Cantidades 0, negativas y no enteras fallan en `reservar` y `liberar`.
`test/domain/Evento.test.js`
- `precioDesde` con varios tipos de entrada.
- `tuPrecioEstaEntre` incluye los extremos y excluye lo de afuera.
- `yaSeRealizo` antes y después de la fecha (con el reloj fijado).
- Validaciones de creación: sin tipos de entrada, nombres de tipo
  repetidos, nombre vacío.
`test/api/eventos.test.js`
- `GET /categorias` devuelve las 5 del seed.
- Detalle: existente, inexistente (404) y evento pasado (200).
- Crear evento con 3 tipos: 201, aparece en `GET /eventos/:id` y en el
  catálogo, el organizador es el usuario autenticado.
- Crear evento inválido: cada causa de 400 listada arriba.
- Búsqueda `q`: por nombre, por descripción, mayúsculas y minúsculas, sin
  resultados, `q` vacío.
- Filtro por categoría, y combinado con `q`.
- Orden por `precio` y por `fecha`: **verificar la lista completa**, no
  solo el primer elemento.
- Orden por `puntaje` responde 200 y es estable.
- El catálogo no incluye el evento pasado del seed.
- 400 por: parámetro desconocido, `orden` inválido, parámetro repetido.
- `GET /eventos/:id` con un id de formato inválido: 400. Con un id válido
  inexistente: 404.
- Body de `POST /eventos` con tipos incorrectos (número como texto, `nombre`
  numérico, `tiposEntrada` que no es un arreglo, claves de más, fecha que no
  es un ISO válido): 400 por el schema.
- Body con valores del tipo correcto pero que violan una regla de negocio
  (precio negativo, cupo 0, fecha pasada, sin tipos de entrada): 400 por el
  dominio.
- Ninguna respuesta contiene email, contraseña ni hash del organizador.
- Sin token: 401.
## Criterios de aceptación
- [ ] `npm test` completo pasa y se muestra la salida.
- [ ] Ninguna regla de cupo, precio o fecha está en controllers ni en services.
- [ ] Ningún `new Date(` ni `Date.now(` fuera de `reloj.js`.
- [ ] Query, params y body de estos endpoints se validan con schemas de zod;
  los controllers leen solo de `req.validado` y no validan formato a mano.
- [ ] Zod no se importa fuera de `src/schemas/` y `src/middleware/validar.js`.
- [ ] `package.json` sigue teniendo solo `express` y `zod`.
- [ ] `docs/architecture.md` actualizado con `cupo` / `cupoDisponible` y `precioDesde()`.
## Fuera de este spec
- Comprar entradas y toda la lógica de estados (spec 03).
- Puntaje real del organizador y reseñas (spec 05).
- Filtro por rango de precio por API (el método de dominio existe, pero no se expone).
- Edición y baja de eventos, paginación, subida de imágenes.