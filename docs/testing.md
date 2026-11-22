# Testing: AI Ticket It

Cómo validar cambios. Las reglas que se prueban están en
`docs/business-context.md` (fuente de verdad); la estructura del código, en
`docs/architecture.md`.

## 1. Principios

- **Sin dependencias nuevas.** Las dependencias aprobadas del backend son
  `express` y `zod`. El backend se prueba con el test runner nativo de Node
  (`node:test` + `node:assert/strict`) y el `fetch` global. No usar Jest,
  Mocha ni Supertest. Si una tarea necesita algo más, avisar y justificar
  antes (regla de `AGENTS.md`).
- **Dos niveles de prueba en el backend:**
  - *Dominio (unitarias):* instancian `Compra`, `TipoEntrada`, `Evento`
    directamente, sin Express ni repositorios. Acá se prueban las reglas de
    estados, cupo y reembolso.
  - *API (integración):* levantan la app real con repositorios en memoria y
    llaman a los endpoints con `fetch`. Acá se prueban permisos, formato de
    error, filtros y orden.
- **Si una regla de negocio solo se puede probar a través de HTTP, la regla
  está en el lugar equivocado.** Debe vivir en el dominio.
- **Cada test arranca con estado limpio:** una app y repositorios nuevos
  cargados con el seed. Ningún test depende del orden ni del resultado de otro.
- Mobile: no hay framework de tests (decisión de alcance). Se valida con
  chequeos estáticos y con la prueba manual de la sección 5.

## 2. Comandos

Todos se corren desde la carpeta indicada. Mostrar la salida completa en el
resultado de la tarea.

### Backend (`backend/`)

| Qué | Comando |
|---|---|
| Instalar | `npm install` |
| Todos los tests | `npm test` |
| Solo dominio | `npm run test:domain` |
| Solo API | `npm run test:api` |
| Levantar el servidor | `npm start` |

Scripts esperados en `backend/package.json`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test test/",
    "test:domain": "node --test test/domain/",
    "test:api": "node --test test/api/"
  }
}
```

Si no existen, crearlos es la primera tarea del backend.

### Mobile (`mobile/`)

| Qué | Comando |
|---|---|
| Instalar | `npm install` |
| Levantar Expo | `npx expo start` |
| Chequeo de salud del proyecto | `npx expo-doctor` |
| Lint (solo si el proyecto ya lo tiene configurado) | `npm run lint` |

## 3. Estructura de tests del backend

```
backend/test/
  helpers/
    crearApp.js        # app + repos nuevos con seed; arranca en puerto 0 y devuelve baseUrl y close()
    login.js           # devuelve el token de un usuario del seed
  domain/
    TipoEntrada.test.js
    Compra.test.js
    Evento.test.js
    Resenia.test.js
    Usuario.test.js
    reloj.test.js
  middleware/
    validar.test.js
  api/
    auth.test.js
    eventos.test.js
    compras.test.js
    mensajes.test.js
    resenias.test.js
    favoritos.test.js
    errores.test.js
```

- Los tests API usan puerto efímero (`listen(0)`) y cierran el servidor en
  `after`. Nunca asumen que el puerto 3000 está libre.
- Los tests usan los usuarios del seed (es determinístico). No se inventan
  credenciales.

### Fechas

Algunos casos necesitan un evento ya realizado (por ejemplo cancelar una
compra de un evento pasado), pero la API no permite comprar eventos pasados y
el catálogo los oculta. Opciones, a proponer en el plan antes de implementar:

1. Construir la situación directamente en el dominio o en el repositorio
   (compra confirmada + evento con fecha pasada) y probar la regla ahí.
2. Que el seed incluya un evento pasado con una compra CONFIRMADA y otra
   UTILIZADA, para poder probarlo también por API.

Preferir 1 para las reglas y 2 solo si hace falta un caso por HTTP. No usar
`setTimeout` ni esperas reales para "hacer pasar" el tiempo.

## 4. Qué se prueba

### 4.1 Dominio

**TipoEntrada**
- `hayCupoPara(n)` verdadero hasta el cupo disponible, falso al superarlo.
- `reservar(n)` baja el cupo; `liberar(n)` lo sube.
- Reservar más que el disponible falla; el cupo nunca queda negativo.

**Compra**
- Nace en PENDIENTE, reserva el cupo y registra el primer `CambioEstadoCompra`.
- El total es precio x cantidad.
- Cada transición válida de la tabla de `business-context.md` sección 3
  funciona y registra un `CambioEstadoCompra` con estado, quién y fecha/hora:
  - PENDIENTE → CONFIRMADA
  - CONFIRMADA → UTILIZADA
  - PENDIENTE → CANCELADA (devuelve cupo, sin reembolso)
  - CONFIRMADA → CANCELADA → REEMBOLSADA (devuelve cupo, el reembolso queda
    registrado con "quién" = sistema)
- **Toda transición no listada falla** con error de dominio. Probarlas todas
  con una tabla de casos (estado origen x estado destino), no una por una a mano.
- Cancelar una compra UTILIZADA falla.
- Cancelar una compra de un evento ya realizado falla.
- Los estados finales (UTILIZADA, REEMBOLSADA, CANCELADA desde PENDIENTE) no
  aceptan ninguna transición.

**Evento**
- `tuPrecioEstaEntre(min, max)` usa el tipo de entrada más barato.
- `yaSeRealizo()` según la fecha.
- No se crea sin tipos de entrada; precio >= 0; cupo entero > 0.

**Resenia**
- Puntaje válido: 1 a 5 en pasos de 0,5. Rechaza 0, 5,5, 4,3 y valores no numéricos.

### 4.2 API

**Auth**
- Login correcto devuelve token; credenciales erróneas devuelven 401.
- Sin token o con token inválido, cualquier otra ruta devuelve 401.
- **Ninguna respuesta contiene la contraseña ni su hash** (revisar login,
  eventos con organizador, compras con comprador, mensajes, reseñas).

**Eventos y búsqueda**
- `q` busca en nombre y descripción, sin distinguir mayúsculas.
- `categoria` filtra por categoría; `q` y `categoria` se pueden combinar.
- `orden=precio|fecha|puntaje` ordena correctamente (verificar el orden
  completo de la lista, no solo el primer elemento).
- El catálogo no incluye eventos con fecha pasada.
- Un valor de `orden` desconocido, o un parámetro de URL no permitido,
  devuelve 400 con el formato de error unificado.
- Crear evento con varios tipos de entrada devuelve el evento con todos.

**Compras**
- Crear compra: queda PENDIENTE, el cupo del tipo baja.
- Cantidad 0, negativa o no entera: 400.
- Cantidad mayor al cupo: error y el cupo no cambia.
- Dos compras que juntas superan el cupo: la primera funciona, la segunda falla.
- Un organizador no puede comprar entradas de su propio evento.
- No se puede comprar un evento ya realizado.
- `GET /compras` devuelve solo las del usuario autenticado.
- Una compra CONFIRMADA incluye los días que faltan para el evento.
- `GET /eventos/:id/compras` lo ve solo el organizador de ese evento (otro
  usuario: 403) e incluye el cupo disponible de cada tipo.
- Flujo completo: crear → pago → uso, y crear → pago → cancelación →
  REEMBOLSADA, verificando estado y cupo en cada paso.
- Cancelar PENDIENTE: CANCELADA, cupo devuelto, sin reembolso.
- Cancelar CONFIRMADA: termina en REEMBOLSADA, cupo devuelto.
- Cancelar UTILIZADA: error.
- Cancelar una compra de un evento ya realizado: error.
- El comprador no puede marcar su propia compra como UTILIZADA (403).
- Otro organizador no puede marcar como UTILIZADA una compra ajena (403).
- Pagar una compra ajena o no PENDIENTE: error.

**Mensajes**
- Comprador y organizador del evento pueden enviar y leer.
- Pueden enviar en **cualquier estado**, incluso CANCELADA y REEMBOLSADA.
- Un tercero no puede leer ni escribir (403).
- `desde=<fecha ISO>` devuelve solo los mensajes posteriores; sin `desde`,
  todos. Un `desde` inválido devuelve 400.
- Mensaje vacío: 400.

**Reseñas**
- Sin compra UTILIZADA del evento: error.
- Con compra UTILIZADA: se crea; con varias compras, igual una sola reseña.
- Segunda reseña del mismo usuario al mismo evento: error.
- Puntaje fuera de rango o no múltiplo de 0,5: 400.
- `GET /eventos/:id/resenias` devuelve las reseñas del organizador del evento
  (todos sus eventos, ordenadas de más reciente a más antigua).
- El puntaje del organizador es el promedio de las reseñas de todos sus
  eventos (probar con al menos dos eventos del mismo organizador).

**Favoritos**
- Marcar, listar y quitar. Marcar dos veces no duplica.

**Errores (transversal)**
- Todo error responde `{ "error": { "code": "...", "message": "..." } }`.
- Mapeo: `ValidationError` 400 (incluye los fallos de zod), `UnauthorizedError`
  401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409,
  desconocido 500.
- Un error inesperado responde 500 **sin stack ni detalles internos**.
- Recurso inexistente (`/compras/xyz`) devuelve 404 con ese formato.

### 4.3 Chequeos de arquitectura (revisión, no automatizados)

Antes de dar una tarea por terminada, revisar el diff:
- Los controllers no tienen reglas de negocio ni `try/catch` propio.
- Ningún controller arma una respuesta de error a mano (solo `next(err)`).
- Las reglas de estado y cupo están en `Compra`/`TipoEntrada`/`Evento`.
- Los repositorios se usan a través de la interfaz.
- No hay WebSockets ni SSE; el chat es REST con polling de 60 s.
- Si cambió el modelo de dominio, `docs/architecture.md` está actualizado.

## 5. Prueba manual en el dispositivo

Requiere backend corriendo y la app Expo en el celular físico, ambos en la
misma red. Pasos de preparación:

1. `cd backend && npm start`.
2. En `mobile/`, definir `EXPO_PUBLIC_API_URL=http://<IP-de-la-PC>:<puerto>`
   (no `localhost`).
3. `npx expo start` y abrir la app desde el celular.
4. Reiniciar el backend vuelve todo al seed.

Recorrido mínimo, con dos usuarios del seed (uno actúa como comprador, otro
como organizador del evento):

| # | Caso de uso | Resultado esperado |
|---|---|---|
| 1 | Login | Entra con credenciales del seed; con credenciales erróneas muestra el mensaje del error |
| 2 | Buscar por texto y por categoría | La lista se filtra; sin resultados muestra estado vacío |
| 3 | Ordenar por precio, fecha y puntaje | El orden cambia y es el correcto |
| 4 | Ver reseñas en el evento de un organizador | Se ven puntajes y comentarios previos |
| 5 | Crear evento con 3 tipos de entrada | Aparece en el catálogo con sus tipos, precios y cupos |
| 6 | Comprar eligiendo tipo y cantidad | Compra PENDIENTE; el cupo baja |
| 7 | Comprar más que el cupo | Se muestra el error de la API, el cupo no cambia |
| 8 | Pagar | Pasa a CONFIRMADA |
| 9 | Ver mis compras | Estados bien diferenciados; la CONFIRMADA muestra días faltantes |
| 10 | Organizador ve compras del evento | Estados y cupo disponible por tipo |
| 11 | Organizador marca UTILIZADA | La compra pasa a UTILIZADA; el comprador ya no ve el botón de cancelar |
| 12 | Comprador reseña | Puntaje 1 a 5 (pasos de 0,5) y comentario; una segunda reseña es rechazada |
| 13 | Cancelar una compra CONFIRMADA | Termina en REEMBOLSADA; el cupo vuelve |
| 14 | Chat en ambos sentidos | El mensaje enviado aparece de inmediato en el emisor y en el otro lado dentro de 60 s |
| 15 | Salir del chat | El polling se detiene (no sigue llamando al backend) |
| 16 | Favoritos | Marcar, ver en la lista y quitar |

## 6. Definición de "terminado"

Una tarea está terminada solo si:

1. `npm test` en `backend/` pasa **completo** (no solo los tests nuevos) y se
   muestra la salida.
2. Hay tests para cada regla nueva o modificada, incluidos los casos de
   error. Un fix de bug incluye primero un test que falla por el bug.
3. Si la tarea toca el front: `npx expo-doctor` sin errores nuevos y el
   tramo correspondiente de la sección 5 verificado en el dispositivo
   (indicar cuáles filas se probaron).
4. Se revisaron los chequeos de la sección 4.3.
5. No se agregaron dependencias sin avisar.

Si la validación falla, la tarea **no está terminada**: se informa qué falló
y se corrige; no se debilitan ni se borran tests para que pase.

## 7. Cómo reportar el resultado

Al cerrar una tarea, incluir:

- Comandos corridos y su salida (cantidad de tests pasados/fallados).
- Qué casos de `business-context.md` sección 9 quedaron cubiertos.
- Qué no se pudo validar y por qué (por ejemplo, prueba manual pendiente).