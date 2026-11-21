# Contexto de negocio: AI Ticket It

Reglas de negocio de la plataforma. Es la fuente de verdad para el dominio:
si el código contradice este documento, el código está mal.

## 1. Usuarios y acceso

- El acceso es con login simple: email y contraseña, guardados en memoria.
- Existe una única clase `Usuario`, sin rol fijo. El mismo usuario puede ser
  organizador (de los eventos que crea) y comprador (de sus compras).
- Los permisos se deciden por relación con el recurso, no por rol:
  - "Organizador" significa organizador **de ese evento**.
  - "Comprador" significa comprador **de esa compra**.
- La contraseña nunca se devuelve en una respuesta de la API.
- Un organizador no puede comprar entradas de su propio evento.

## 2. Eventos y tipos de entrada

- Un evento tiene nombre, descripción, categoría, fecha, multimedia
  (lista de URLs) y organizador.
- Un evento tiene al menos un tipo de entrada.
- Un tipo de entrada tiene nombre, descripción, precio (>= 0) y cupo
  (entero > 0 al crearlo). Ejemplos: General, Platea, VIP.
- El cupo disponible de un tipo de entrada baja al crear una compra y
  vuelve a subir al cancelarla (ver sección 3).
- No se puede comprar para un evento cuya fecha ya pasó.
- El organizador crea eventos; editarlos o darlos de baja queda fuera de alcance.

## 3. Compras

- Una compra pertenece a un comprador y se hace sobre un evento, un tipo de
entrada, una cantidad y un total.
- Una compra tiene un estado de compra y un listado de mensajes entre el comprador y el organizador del evento.

### Reglas al crear

- La cantidad debe ser >= 1 y no superar el cupo disponible del tipo de
  entrada.
- El total es precio x cantidad, calculado al momento de la compra.
- La compra nace en estado **PENDIENTE** y **reserva el cupo desde ese
  momento**.

### Estados y transiciones

| Desde | Hacia | Quién | Condición / efecto |
|---|---|---|---|
| PENDIENTE | CONFIRMADA | Comprador | Pago simulado dentro de la app |
| CONFIRMADA | UTILIZADA | Organizador del evento | Simula escanear la entrada |
| PENDIENTE | CANCELADA | Comprador | Evento aún no realizado. Devuelve el cupo. No hay reembolso (nunca hubo pago) |
| CONFIRMADA | CANCELADA | Comprador | Evento aún no realizado. Devuelve el cupo |
| CANCELADA (venía de CONFIRMADA) | REEMBOLSADA | Sistema | Automático e inmediato. La devolución del dinero es simulada |

- Una compra UTILIZADA no se puede cancelar.
- Una compra no se puede cancelar si el evento ya se realizó.
- CANCELADA (desde PENDIENTE), REEMBOLSADA y UTILIZADA son estados finales.
- Cualquier otra transición es inválida y se rechaza con error.

### Historial

Cada cambio de estado, incluida la creación, se registra en
`CambioEstadoCompra` con: compra, estado, quién y fecha y hora. En el
reembolso automático, "quién" es el sistema.

### Visualización

- El comprador ve sus compras diferenciando el estado. Si está CONFIRMADA,
  ve cuántos días faltan para el evento.
- El organizador ve las compras de un evento, con su estado, y cuántas
  entradas quedan disponibles de cada tipo.

## 4. Mensajes de la compra

- Cada compra tiene un chat entre el comprador y el organizador del evento.
- Ambos pueden enviar mensajes **en cualquier momento y en cualquier estado**,
  incluso si la compra está cancelada o reembolsada.
- Nadie más puede leer ni escribir en ese chat.

## 5. Reseñas

- Una reseña tiene comprador, evento, puntaje y comentario.
- Solo puede reseñar quien tenga al menos una compra UTILIZADA de ese evento.
- Se permite **una reseña por evento y por usuario**, aunque tenga varias
  compras.
- El puntaje va de 1 a 5, en pasos de 0,5 (por ejemplo 4,5).
- El puntaje de un organizador es el promedio de las reseñas de todos sus
  eventos.
- Las reseñas se muestran en los eventos del organizador, para que futuros
  compradores las vean antes de comprar.

## 6. Búsqueda, filtros y orden

- El comprador puede buscar por texto y explorar por categoría.
- La búsqueda de texto compara contra nombre y descripción, sin
  distinguir mayúsculas.
- Puede ordenar por precio, por fecha del evento y por puntaje del
  organizador.
- El precio de un evento, para ordenar y filtrar, es el de su
  tipo de entrada más barato.
- El catálogo no muestra eventos cuya fecha ya pasó.

## 7. Favoritos

- Un usuario puede marcar y desmarcar eventos como favoritos y listar los
  suyos.

## 8. Fuera de alcance

- Pagos reales (el pago y el reembolso son simulados).
- Persistencia: todo vive en memoria y se pierde al reiniciar el servidor.
- Edición o baja de eventos.
- Notificaciones.

## 9. Casos borde que deben tener prueba

- Comprar más entradas que el cupo disponible.
- Dos compras que juntas superan el cupo: la segunda debe fallar.
- Cancelar una compra UTILIZADA.
- Cancelar una compra de un evento ya realizado.
- Cancelar una compra PENDIENTE devuelve el cupo y no genera reembolso.
- Cancelar una compra CONFIRMADA termina en REEMBOLSADA y devuelve el cupo.
- Un comprador intenta marcar su propia compra como UTILIZADA.
- Otro organizador intenta marcar como UTILIZADA una compra ajena.
- Un tercero intenta leer o escribir el chat de una compra.
- Reseñar sin tener una compra UTILIZADA del evento.
- Dejar una segunda reseña sobre el mismo evento.
- Puntaje fuera de rango o que no sea múltiplo de 0,5.
- Se utilizan parámetros en la URL distintos a los permitidos para filtrar y ordenar.