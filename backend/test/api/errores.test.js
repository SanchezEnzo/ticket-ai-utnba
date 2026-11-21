import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';

describe('Middleware de errores', () => {
  let baseUrl;
  let close;

  it('debe levantar el servidor antes de los tests', async () => {
    const result = await crearApp();
    baseUrl = result.baseUrl;
    close = result.close;
  });

  after(async () => {
    await close();
  });

  it('ruta inexistente responde 404 con formato unificado', async () => {
    const res = await fetch(`${baseUrl}/ruta-inexistente`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.ok(typeof body.error.message === 'string');
  });

  it('JSON mal formado responde 400 con formato unificado', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ no es json valido',
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(typeof body.error.message === 'string');
  });

  it('error inesperado responde 500 sin stack ni detalles internos', async () => {
    const res = await fetch(`${baseUrl}/__test-internal-error`);
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.equal(body.error.code, 'INTERNAL_ERROR');
    assert.ok(typeof body.error.message === 'string');
    assert.ok(!body.error.message.includes('stack'));
    assert.ok(!body.error.message.includes('Error:'));
  });
});
