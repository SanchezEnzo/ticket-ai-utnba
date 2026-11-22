import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  eventoIdParamsSchema,
  crearReseniaBodySchema,
  sinQuerySchema,
} from '../schemas/resenia.schema.js';

function crearRutasResenia({ reseniaController, authMiddleware }) {
  const router = Router();

  router.post(
    '/:id/resenias',
    authMiddleware,
    validar({ params: eventoIdParamsSchema, body: crearReseniaBodySchema, query: sinQuerySchema }),
    asyncHandler(reseniaController.crear)
  );

  router.get(
    '/:id/resenias',
    authMiddleware,
    validar({ params: eventoIdParamsSchema, query: sinQuerySchema }),
    asyncHandler(reseniaController.listar)
  );

  return router;
}

export { crearRutasResenia };
