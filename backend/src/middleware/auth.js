import { UnauthorizedError } from '../domain/errors.js';
import { asyncHandler } from './errorHandler.js';

function auth({ sesionService, usuarioRepository }) {
  return asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Token de autenticación requerido.'));
    }

    const token = header.slice(7);
    const userId = sesionService.obtenerUserIdPorToken(token);
    if (!userId) {
      return next(new UnauthorizedError('Token inválido.'));
    }

    const usuario = usuarioRepository.buscarPorId(userId);
    if (!usuario) {
      return next(new UnauthorizedError('Token inválido.'));
    }

    req.usuario = usuario;
    next();
  });
}

export { auth };
