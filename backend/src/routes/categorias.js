import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

function crearRutasCategoria({ eventoController, authMiddleware }) {
  const router = Router();

  router.get(
    '/',
    authMiddleware,
    asyncHandler(eventoController.listarCategorias)
  );

  return router;
}

export { crearRutasCategoria };
