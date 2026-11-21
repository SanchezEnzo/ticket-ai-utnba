import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  eventoIdParamsSchema,
  listarEventosQuerySchema,
  crearEventoBodySchema,
} from '../schemas/eventos.js';
import { emptyQuerySchema } from '../schemas/compras.js';

function crearRutasEvento({ eventoController, authMiddleware }) {
  const router = Router();

  router.get(
    '/categorias',
    authMiddleware,
    eventoController.listarCategorias
  );

  router.get(
    '/:id',
    authMiddleware,
    validar({ params: eventoIdParamsSchema }),
    asyncHandler(eventoController.detalleEvento)
  );

  router.post(
    '/',
    authMiddleware,
    validar({ body: crearEventoBodySchema }),
    asyncHandler(eventoController.crearEvento)
  );

  router.get(
    '/',
    authMiddleware,
    validar({ query: listarEventosQuerySchema }),
    asyncHandler(eventoController.listarEventos)
  );

  router.get(
    '/:id/compras',
    authMiddleware,
    validar({ params: eventoIdParamsSchema, query: emptyQuerySchema }),
    asyncHandler(eventoController.comprasDelEvento)
  );

  return router;
}

export { crearRutasEvento };
