import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  crearCompraBodySchema,
  compraIdParamsSchema,
  emptyQuerySchema,
} from '../schemas/compras.js';
import {
  listarMensajesQuerySchema,
  enviarMensajeBodySchema,
  sinQuerySchema,
} from '../schemas/mensaje.schema.js';

function crearRutasCompra({ compraController, mensajeController, authMiddleware }) {
  const router = Router();

  router.post(
    '/',
    authMiddleware,
    validar({ body: crearCompraBodySchema }),
    asyncHandler(compraController.crear),
  );

  router.post(
    '/:id/pago',
    authMiddleware,
    validar({ params: compraIdParamsSchema }),
    asyncHandler(compraController.pagar),
  );

  router.get(
    '/',
    authMiddleware,
    validar({ query: emptyQuerySchema }),
    asyncHandler(compraController.misCompras),
  );

  router.post(
    '/:id/uso',
    authMiddleware,
    validar({ params: compraIdParamsSchema, query: emptyQuerySchema }),
    asyncHandler(compraController.usar),
  );

  router.post(
    '/:id/cancelacion',
    authMiddleware,
    validar({ params: compraIdParamsSchema, query: emptyQuerySchema }),
    asyncHandler(compraController.cancelar),
  );

  router.get(
    '/:id/mensajes',
    authMiddleware,
    validar({ params: compraIdParamsSchema, query: listarMensajesQuerySchema }),
    asyncHandler(mensajeController.listar),
  );

  router.post(
    '/:id/mensajes',
    authMiddleware,
    validar({ params: compraIdParamsSchema, body: enviarMensajeBodySchema, query: sinQuerySchema }),
    asyncHandler(mensajeController.enviar),
  );

  return router;
}

export { crearRutasCompra };
