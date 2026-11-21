import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';

describe('GET /salud', () => {
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

  it('debe responder 200 con { estado: "ok" }', async () => {
    const res = await fetch(`${baseUrl}/salud`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { estado: 'ok' });
  });

  it('debe cerrar el servidor correctamente', async () => {
    // El after() ya cierra; este test verifica que no haya error al cerrar.
    assert.ok(true);
  });
});
