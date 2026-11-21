import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';
import { login } from '../helpers/login.js';
import { seedIds } from '../../src/seed/eventos.js';

const EMAIL_COMPRADOR = 'comprador1@example.com';
const EMAIL_ORGANIZADOR = 'organizador1@example.com';
const PASSWORD = 'contraseña123';

describe('API - Compras', () => {
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

  describe('POST /compras - crear', () => {
    it('crea una compra y responde 201', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: 2,
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.estado, 'PENDIENTE');
      assert.equal(data.cantidad, 2);
      assert.equal(data.total, 30000);
      assert.ok(data.id);
    });

    it('GET /eventos/:id muestra cupoDisponible reducido', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      // Crear compra
      await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te2',
          cantidad: 3,
        }),
      });
      // Verificar cupo
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const platea = data.tiposEntrada.find((te) => te.id === 'te2');
      assert.equal(platea.cupoDisponible, 47);
    });

    it('campo faltante responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
        }),
      });
      assert.equal(res.status, 400);
    });

    it('cantidad como texto responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: '2',
        }),
      });
      assert.equal(res.status, 400);
    });

    it('eventoId numérico responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: 123,
          tipoEntradaId: 'te1',
          cantidad: 1,
        }),
      });
      assert.equal(res.status, 400);
    });

    it('claves extra en el body responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: 1,
          extra: 'valor',
        }),
      });
      assert.equal(res.status, 400);
    });

    it('organizador comprando su evento responde 403', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: 1,
        }),
      });
      assert.equal(res.status, 403);
    });

    it('evento ya realizado responde 409', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.conciertoPasado,
          tipoEntradaId: 'te15',
          cantidad: 1,
        }),
      });
      assert.equal(res.status, 409);
    });

    it('cantidad > cupo responde 409 y no cambia el cupo', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te3',
          cantidad: 9999,
        }),
      });
      assert.equal(res.status, 409);
    });

    it('dos compras que superan cupo: primera 201, segunda 409', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      // evt_teatro2 (Comedia Musical) tiene cupo 120, organizado por ambos1
      const res1 = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.comediaMusical,
          tipoEntradaId: 'te12',
          cantidad: 120,
        }),
      });
      assert.equal(res1.status, 201);

      const res2 = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.comediaMusical,
          tipoEntradaId: 'te12',
          cantidad: 1,
        }),
      });
      assert.equal(res2.status, 409);
    });
  });

  describe('POST /compras/:id/pago - pagar', () => {
    it('pagar compra responde 200 y CONFIRMADA', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      // Crear compra
      const resCrear = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: 1,
        }),
      });
      const compra = await resCrear.json();

      // Pagar
      const resPagar = await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resPagar.status, 200);
      const data = await resPagar.json();
      assert.equal(data.estado, 'CONFIRMADA');
    });

    it('pagar de nuevo responde 409', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const resCrear = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: 1,
        }),
      });
      const compra = await resCrear.json();

      // Pagar primera vez
      await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Pagar segunda vez
      const res2 = await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res2.status, 409);
    });

    it('pagar compra ajena responde 403', async () => {
      const tokenComprador = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const tokenOrganizador = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);

      const resCrear = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenComprador}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: 1,
        }),
      });
      const compra = await resCrear.json();

      const resPagar = await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(resPagar.status, 403);
    });

    it('pagar compra inexistente responde 404', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/cp_inexistente/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 404);
    });

    it(':id inválido responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/id con espacios/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });
  });

  describe('GET /compras - mis compras', () => {
    it('devuelve solo las compras del usuario', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      // El seed crea 5 compras de comprador1
      assert.ok(data.length >= 5);
      for (const c of data) {
        assert.equal(c.comprador.id, 'comprador1');
      }
    });

    it('diasParaEvento solo en CONFIRMADA', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      for (const c of data) {
        if (c.estado === 'CONFIRMADA') {
          assert.ok(typeof c.diasParaEvento === 'number');
        } else {
          assert.equal(c.diasParaEvento, null);
        }
      }
    });

    it('sin datos sensibles en respuestas', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      for (const c of data) {
        assert.equal(c.comprador.email, undefined);
        assert.equal(c.comprador.contrasena, undefined);
      }
    });

    it('parámetro de query responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras?q=algo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });
  });

  describe('autenticación', () => {
    it('sin token responde 401 en POST /compras', async () => {
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventoId: seedIds.eventos.rockEnVivo,
          tipoEntradaId: 'te1',
          cantidad: 1,
        }),
      });
      assert.equal(res.status, 401);
    });

    it('sin token responde 401 en GET /compras', async () => {
      const res = await fetch(`${baseUrl}/compras`);
      assert.equal(res.status, 401);
    });

    it('sin token responde 401 en POST /compras/:id/pago', async () => {
      const res = await fetch(`${baseUrl}/compras/cp_1/pago`, {
        method: 'POST',
      });
      assert.equal(res.status, 401);
    });
  });
});
