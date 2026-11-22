import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { favoritoParamsSchema, sinQuerySchema } from '../schemas/favorito.schema.js';

function crearRutasFavorito({ favoritoController, authMiddleware }) {
  const router = Router();

  router.get(
    '/favoritos',
    authMiddleware,
    validar({ query: sinQuerySchema }),
    asyncHandler(favoritoController.listar)
  );

  router.put(
    '/favoritos/:eventoId',
    authMiddleware,
    validar({ params: favoritoParamsSchema, query: sinQuerySchema }),
    asyncHandler(favoritoController.marcar)
  );

  router.delete(
    '/favoritos/:eventoId',
    authMiddleware,
    validar({ params: favoritoParamsSchema, query: sinQuerySchema }),
    asyncHandler(favoritoController.quitar)
  );

  return router;
}

export { crearRutasFavorito };
