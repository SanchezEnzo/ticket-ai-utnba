import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validar } from '../../src/middleware/validar.js';
import { idSchema } from '../../src/schemas/comun.js';
import { loginBodySchema } from '../../src/schemas/auth.js';
import { ValidationError } from '../../src/domain/errors.js';

function crearReqResNext() {
  let err;
  const req = { params: {}, query: {}, body: {} };
  const res = {};
  const next = (e) => { err = e; };
  return { req, res, next, getError: () => err };
}

describe('Middleware validar', () => {
  it('datos válidos: req.validado tiene los valores parseados', () => {
    const { req, res, next, getError } = crearReqResNext();
    req.body = { email: 'test@example.com', password: '123' };

    const middleware = validar({ body: loginBodySchema });
    middleware(req, res, next);

    assert.equal(getError(), undefined);
    assert.deepEqual(req.validado.body, { email: 'test@example.com', password: '123' });
  });

  it('body inválido: ValidationError con mensaje legible', () => {
    const { req, res, next, getError } = crearReqResNext();
    req.body = { email: '', password: '' };

    const middleware = validar({ body: loginBodySchema });
    middleware(req, res, next);

    const error = getError();
    assert.ok(error instanceof ValidationError);
    assert.ok(error.message.includes('email'));
    assert.ok(error.message.includes('password'));
  });

  it('params inválido: ValidationError', () => {
    const { req, res, next, getError } = crearReqResNext();
    req.params = { id: 'a b c!' };

    const middleware = validar({ params: z => idSchema });
    const middlewareReal = validar({ params: idSchema });
    middlewareReal(req, res, next);

    const error = getError();
    assert.ok(error instanceof ValidationError);
  });

  it('query inválida: ValidationError', () => {
    const { req, res, next, getError } = crearReqResNext();
    req.query = { q: '' };

    const qs = z.strictObject({ q: z.string().min(1) });
    const middleware = validar({ query: qs });
    middleware(req, res, next);

    const error = getError();
    assert.ok(error instanceof ValidationError);
  });

  it('strict rechaza claves extra en body', () => {
    const { req, res, next, getError } = crearReqResNext();
    req.body = { email: 'a@b.com', password: '123', token: 'extra' };

    const middleware = validar({ body: loginBodySchema });
    middleware(req, res, next);

    const error = getError();
    assert.ok(error instanceof ValidationError);
    assert.ok(error.message.includes('token') || error.message.includes('no permitida'));
  });

  it('clave repetida en query (arreglo) falla contra schema de string', () => {
    const { req, res, next, getError } = crearReqResNext();
    req.query = { q: ['a', 'b'] };

    const qs = z.strictObject({ q: z.string() });
    const middleware = validar({ query: qs });
    middleware(req, res, next);

    const error = getError();
    assert.ok(error instanceof ValidationError);
  });

  it('no modifica req.query ni req.params', () => {
    const { req, res, next, getError } = crearReqResNext();
    req.body = { email: 'a@b.com', password: '123' };
    const queryOriginal = { q: 'test' };
    const paramsOriginal = { id: 'abc' };
    req.query = queryOriginal;
    req.params = paramsOriginal;

    const middleware = validar({ body: loginBodySchema });
    middleware(req, res, next);

    assert.equal(getError(), undefined);
    assert.strictEqual(req.query, queryOriginal);
    assert.strictEqual(req.params, paramsOriginal);
  });
});
