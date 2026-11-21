import { Router } from 'express';
import { validar } from '../middleware/validar.js';
import { loginBodySchema } from '../schemas/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

function crearRutasAuth({ authController, authMiddleware }) {
  const router = Router();

  router.post(
    '/login',
    validar({ body: loginBodySchema }),
    asyncHandler(authController.login)
  );

  router.get(
    '/yo',
    authMiddleware,
    authController.yo
  );

  return router;
}

export { crearRutasAuth };
