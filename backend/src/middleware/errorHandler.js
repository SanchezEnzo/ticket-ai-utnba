import { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '../domain/errors.js';

const statusMap = {
  ValidationError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
};

function errorHandler(err, _req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && err.body) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'El cuerpo de la request no es JSON válido.' } });
  }

  const DomainClasses = [ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError];
  for (const Cls of DomainClasses) {
    if (err instanceof Cls) {
      return res.status(statusMap[Cls.name]).json({ error: { code: err.code, message: err.message } });
    }
  }

  console.error(err.stack || err.message);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ha ocurrido un error inesperado.' } });
}

function notFoundHandler(_req, res, next) {
  next(new NotFoundError('La ruta solicitada no existe.'));
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export { errorHandler, notFoundHandler, asyncHandler };
