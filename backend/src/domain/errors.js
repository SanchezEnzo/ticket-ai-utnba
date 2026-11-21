class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends DomainError {
  constructor(message) {
    super(message);
    this.code = 'VALIDATION_ERROR';
  }
}

class UnauthorizedError extends DomainError {
  constructor(message) {
    super(message);
    this.code = 'UNAUTHORIZED';
  }
}

class ForbiddenError extends DomainError {
  constructor(message) {
    super(message);
    this.code = 'FORBIDDEN';
  }
}

class NotFoundError extends DomainError {
  constructor(message) {
    super(message);
    this.code = 'NOT_FOUND';
  }
}

class ConflictError extends DomainError {
  constructor(message) {
    super(message);
    this.code = 'CONFLICT';
  }
}

export { DomainError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError };
