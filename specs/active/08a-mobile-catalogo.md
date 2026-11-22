# 08b: Mobile, catálogo, detalle de evento y favoritos
 
## Casos de uso que cubre
- Como comprador, quiero buscar eventos por texto o explorarlos por categorías.
- Como comprador, quiero ordenarlos por precio, fecha y puntaje del organizador.
- Como comprador, quiero ver las reseñas del organizador antes de comprar.
- Como usuario, quiero marcar y desmarcar favoritos y listar los míos.
## Documentos de referencia
- Specs del backend `02-eventos.md`, `05-resenias.md` y `06-favoritos.md`
  (forma de las respuestas)
- `docs/architecture.md`: sección 4 (Mobile)
- `docs/testing.md`: sección 5, filas 2, 3, 4 y 16
- Las reglas de todo el mobile están en `08a-mobile-base.md`
## Requisito previo
Spec `08a-mobile-base.md` cerrado.
 
## Alcance
 
### 1. API
`src/api/eventos.js`: `listarEventos({ q, categoria, orden }, token)`,
`obtenerEvento(id, token)`, `listarCategorias(token)`,
`listarResenias(eventoId, token)`.
`src/api/favoritos.js`: `listarFavoritos(token)`, `marcarFavorito(eventoId, token)`,
`quitarFavorito(eventoId, token)`. Los dos últimos responden 204 sin cuerpo.
 
### 2. Pantalla Explorar
- Campo de búsqueda de texto. La búsqueda se dispara 400 ms después de que el
  usuario deja de escribir (hook propio `useDebounce`, sin librerías).
- Categorías como chips horizontales: "Todas" más las de `GET /categorias`.
  Elegir una filtra el listado; se puede combinar con el texto.
- Selector de orden con tres opciones: **Fecha** (por defecto), **Precio** y
  **Puntaje**. Se envía como `orden`.
- Lista (`FlatList`) de tarjetas de evento (`EventoCard`), con: nombre,
  categoría, fecha y hora, "Desde $ X" (`precioDesde`), el puntaje del
  organizador (`★ 4.3`, o "Sin reseñas" si es `null`) y el nombre del
  organizador, más el botón de favorito.
- Cada cambio de búsqueda, categoría u orden vuelve a consultar
  `GET /eventos`. **Se ignoran las respuestas viejas**: si el usuario cambia el
  filtro mientras hay una consulta en curso, el resultado de la consulta
  anterior no debe pisar al de la nueva (cancelarla o comparar un identificador
  de pedido).
- Estados: cargando, error con "Reintentar", vacío ("No encontramos eventos
  con esa búsqueda") y "arrastrar para actualizar".
- El listado muestra exactamente lo que devuelve la API, en el orden en que
  llega: **el front no reordena ni filtra**.
### 3. Pantalla Detalle de evento
- Se abre desde una tarjeta (stack sobre las pestañas) y consulta
  `GET /eventos/:id`.
- Muestra: imágenes de `multimedia` (carrusel horizontal con `Image`; si la
  lista está vacía o una imagen falla, un recuadro neutro), nombre, categoría,
  descripción, fecha y hora, organizador con su puntaje, y la lista de tipos
  de entrada: nombre, descripción, precio y disponibilidad ("Quedan N" o
  "Agotado" cuando `cupoDisponible` es 0).
- Sección **Reseñas del organizador** con `GET /eventos/:id/resenias`: cada
  una muestra puntaje (`★ 4.5`), comentario, autor (nombre y apellido), a qué
  evento corresponde y la fecha. Sin reseñas: "Este organizador todavía no
  tiene reseñas." Un error al cargar las reseñas no impide ver el resto del
  detalle (se muestra con su propio "Reintentar").
- Un evento ya realizado se muestra con un aviso "Este evento ya se realizó".
- El botón de comprar se agrega en el spec 08c; el de ver compras (organizador),
  en el 08d.
### 4. Favoritos
- `src/context/FavoritosContext.js`: al iniciar sesión carga `GET /favoritos`
  y guarda el conjunto de ids. Expone `esFavorito(id)`, `alternar(evento)` y la
  lista. Se vacía al cerrar sesión.
- El botón de corazón aparece en la tarjeta y en el detalle. Al tocarlo, el
  cambio se refleja de inmediato (optimista) y se envía `PUT` o `DELETE`; si
  la API falla, se **revierte** y se muestra el `message` del error.
- Pestaña **Favoritos**: lista los eventos de `GET /favoritos` (misma tarjeta).
  Los que ya se realizaron muestran la etiqueta "Ya se realizó". Estado vacío:
  "Todavía no marcaste favoritos." Quitar un favorito desde esta pestaña lo
  saca de la lista.
## Criterios de aceptación
- [ ] `npx expo-doctor` sin errores nuevos.
- [ ] **Fila 2 de la prueba manual:** la búsqueda por texto y por categoría
  filtra el listado; sin resultados muestra el estado vacío.
- [ ] **Fila 3:** ordenar por precio, fecha y puntaje cambia el orden y es el
  que devuelve la API.
- [ ] **Fila 4:** el detalle de un evento muestra las reseñas del organizador
  (usar el organizador del seed con reseñas).
- [ ] **Fila 16:** marcar, ver en la pestaña Favoritos y quitar un favorito.
- [ ] Cambiar rápido de filtro no deja un resultado viejo en pantalla.
- [ ] Una falla de la API al marcar un favorito revierte el corazón y muestra el error.
- [ ] El front no reordena ni filtra la lista que devuelve la API.
- [ ] Ninguna pantalla llama a `fetch`; todo pasa por `src/api/`.
- [ ] Sin dependencias nuevas fuera de las aprobadas en el spec 08a.
## Fuera de este spec
- Comprar entradas (spec 08c) y ver las compras de un evento (spec 08d).
- Paginación del listado, mapa y compartir evento.
 