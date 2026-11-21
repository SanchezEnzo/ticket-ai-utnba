import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';
import { login } from '../helpers/login.js';

const EMAIL_ORGANIZADOR = 'organizador1@example.com';
const PASSWORD = 'contraseña123';

describe('Auth - Login y autenticación', () => {
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

  it('login correcto devuelve token y usuario', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL_ORGANIZADOR, password: PASSWORD }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token, 'debe devolver un token');
    assert.equal(data.usuario.email, EMAIL_ORGANIZADOR);
  });

  it('la respuesta del login no contiene la contraseña ni su hash', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL_ORGANIZADOR, password: PASSWORD }),
    });
    const data = await res.json();
    assert.equal(data.usuario._hash, undefined);
    assert.equal(data.usuario.contrasena, undefined);
  });

  it('email inexistente responde 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inexistente@example.com', password: PASSWORD }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error.code, 'UNAUTHORIZED');
  });

  it('contraseña errónea responde 401 con el mismo mensaje que email inexistente', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL_ORGANIZADOR, password: 'incorrecta' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error.code, 'UNAUTHORIZED');
  });

  it('falta de email responde 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: PASSWORD }),
    });
    assert.equal(res.status, 400);
  });

  it('falta de password responde 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL_ORGANIZADOR }),
    });
    assert.equal(res.status, 400);
  });

  it('email que no es string (número) responde 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 123, password: PASSWORD }),
    });
    assert.equal(res.status, 400);
  });

  it('password que es null responde 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL_ORGANIZADOR, password: null }),
    });
    assert.equal(res.status, 400);
  });

  it('clave de más en el body responde 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL_ORGANIZADOR, password: PASSWORD, extra: 'valor' }),
    });
    assert.equal(res.status, 400);
  });

  it('strings vacíos responden 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });
    assert.equal(res.status, 400);
  });

  it('email con formato inválido pero string no vacío responde 401 (no 400)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-es-email', password: PASSWORD }),
    });
    assert.equal(res.status, 401);
  });

  it('GET /auth/yo con token válido devuelve el usuario', async () => {
    const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
    const res = await fetch(`${baseUrl}/auth/yo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.email, EMAIL_ORGANIZADOR);
  });

  it('GET /auth/yo sin token responde 401', async () => {
    const res = await fetch(`${baseUrl}/auth/yo`);
    assert.equal(res.status, 401);
  });

  it('GET /auth/yo con token inventado responde 401', async () => {
    const res = await fetch(`${baseUrl}/auth/yo`, {
      headers: { Authorization: 'Bearer token-inventado-123' },
    });
    assert.equal(res.status, 401);
  });

  it('GET /auth/yo con esquema distinto de Bearer responde 401', async () => {
    const res = await fetch(`${baseUrl}/auth/yo`, {
      headers: { Authorization: 'Basic algo' },
    });
    assert.equal(res.status, 401);
  });

  it('dos logins del mismo usuario devuelven tokens distintos y ambos funcionan', async () => {
    const token1 = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
    const token2 = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
    assert.notEqual(token1, token2);

    const res1 = await fetch(`${baseUrl}/auth/yo`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.equal(res1.status, 200);

    const res2 = await fetch(`${baseUrl}/auth/yo`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert.equal(res2.status, 200);
  });
});
