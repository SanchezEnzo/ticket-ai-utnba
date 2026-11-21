# AI Ticket It

Plataforma de venta de entradas. TP individual UTN (Desarrollo con IA, 2C 2026).
Compradores buscan y compran entradas; organizadores publican eventos y gestionan ventas.

## Stack
- backend/: Node.js + Express, persistencia EN MEMORIA (sin base de datos)
- mobile/: React Native con Expo, corre en dispositivo físico
- No agregar dependencias sin avisar y justificar.

## Mapa de documentación (leer solo lo que la tarea necesite)
- Arquitectura y modelo de dominio: docs/architecture.md
- Reglas de negocio y estados de compra: docs/business-context.md
- Cómo validar cambios: docs/testing.md
- Specs de casos de uso: specs/active/

## Reglas no negociables
- La lógica de negocio vive en las clases de dominio (Compra, TipoEntrada, Evento), NO en controllers ni en el front.
- Controllers solo traducen HTTP a llamadas de servicio y devuelven errores con formato uniforme.
- Repositorios en memoria detrás de una interfaz, para poder reemplazarlos.
- Cambios mínimos y acotados: tocar solo lo que pide la tarea.
- Al editar un archivo, entregarlo completo, no fragmentos.
- Los errores se manejan con el middleware central (ver docs/architecture.md,
  sección "Manejo de errores"). Prohibido armar respuestas de error a mano en
  controllers.
- El chat de la compra es REST con polling cada 60 s. No usar WebSockets ni SSE.

## Flujo de trabajo
1. Leer la spec de specs/active/ correspondiente.
2. Proponer un plan y esperar aprobación antes de escribir código.
3. Implementar en tareas chicas.
4. Correr los comandos de docs/testing.md y mostrar el resultado.
5. No dar la tarea por terminada si la validación falla.

## Nunca
- Mover lógica de negocio a controllers.
- Cambiar el modelo de dominio sin actualizar docs/architecture.md.