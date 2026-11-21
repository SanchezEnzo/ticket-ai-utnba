import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  eventoIdParamsSchema,
  listarEventosQuerySchema,
  crearEventoBodySchema,
} from '../schemas/eventos.js';

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

  return router;
}

export { crearRutasEvento };
