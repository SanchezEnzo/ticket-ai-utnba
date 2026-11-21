import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { auth } from './middleware/auth.js';
import { crearRutasAuth } from './routes/auth.js';

function crearApp({ repositorios, servicios, controllers }) {
  const app = express();

  app.use(express.json());

  app.use('/__test-internal-error', (_req, _res, next) => {
    next(new Error('Error de prueba intencional'));
  });

  const authMiddleware = auth({
    sesionService: servicios.sesionService,
    usuarioRepository: repositorios.usuarioRepository,
  });

  const authRoutes = crearRutasAuth({
    authController: controllers.authController,
    authMiddleware,
  });
  app.use('/auth', authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { crearApp };
