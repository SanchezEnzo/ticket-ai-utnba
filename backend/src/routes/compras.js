import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  crearCompraBodySchema,
  compraIdParamsSchema,
  emptyQuerySchema,
} from '../schemas/compras.js';

function crearRutasCompra({ compraController, authMiddleware }) {
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

  return router;
}

export { crearRutasCompra };
