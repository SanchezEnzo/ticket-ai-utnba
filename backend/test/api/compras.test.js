import { describe, it, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';
import { login } from '../helpers/login.js';
import { seedIds } from '../../src/seed/eventos.js';
import { fijarAhora, restaurarReloj, sumarDias, ahora } from '../../src/domain/reloj.js';

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

  describe('POST /compras/:id/uso - marcar como utilizada', () => {
    afterEach(() => {
      restaurarReloj();
    });

    it('crear → pagar → organizador marca UTILIZADA: 200', async () => {
      const tokenComprador = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const tokenOrganizador = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);

      // Crear compra
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
      assert.equal(compra.estado, 'PENDIENTE');

      // Pagar
      const resPagar = await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });
      assert.equal(resPagar.status, 200);

      // Usar (organizador)
      const resUsar = await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(resUsar.status, 200);
      const data = await resUsar.json();
      assert.equal(data.estado, 'UTILIZADA');
      assert.equal(data.historial.length, 3);
      assert.equal(data.historial[2].estado, 'UTILIZADA');
      assert.equal(data.historial[2].quien.id, 'organizador1');
    });

    it('comprador intenta UTILIZADA responde 403', async () => {
      const tokenComprador = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);

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

      await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });

      const resUsar = await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });
      assert.equal(resUsar.status, 403);
    });

    it('otro organizador intenta UTILIZADA responde 403', async () => {
      const tokenComprador = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const tokenAmbos = await login(fetch, baseUrl, 'ambos1@example.com', PASSWORD);

      // evt_recital1 es de organizador1, no de ambos1
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

      await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });

      const resUsar = await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenAmbos}` },
      });
      assert.equal(resUsar.status, 403);
    });

    it('usar compra PENDIENTE responde 409', async () => {
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

      const resUsar = await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(resUsar.status, 409);
    });

    it('usar dos veces responde 409', async () => {
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

      await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });

      await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });

      const resUsar2 = await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(resUsar2.status, 409);
    });

    it('usar compra CANCELADA responde 409', async () => {
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

      await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });

      const resUsar = await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(resUsar.status, 409);
    });

    it('usar compra REEMBOLSADA responde 409', async () => {
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

      await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });

      await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });

      const resUsar = await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(resUsar.status, 409);
    });

    it('usar compra inexistente responde 404', async () => {
      const tokenOrganizador = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/cp_inexistente/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(res.status, 404);
    });

    it('sin token responde 401', async () => {
      const res = await fetch(`${baseUrl}/compras/cp_1/uso`, {
        method: 'POST',
      });
      assert.equal(res.status, 401);
    });

    it(':id inválido responde 400', async () => {
      const tokenOrganizador = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/id con espacios/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(res.status, 400);
    });

    it('query param responde 400', async () => {
      const tokenOrganizador = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/cp_1/uso?x=1`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(res.status, 400);
    });
  });

  describe('POST /compras/:id/cancelacion - cancelar compra', () => {
    afterEach(() => {
      restaurarReloj();
    });

    it('cancelar compra PENDIENTE: 200, CANCELADA, cupo devuelto, sin REEMBOLSADA', async () => {
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
          cantidad: 2,
        }),
      });
      const compra = await resCrear.json();
      assert.equal(compra.estado, 'PENDIENTE');

      const resCancelar = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resCancelar.status, 200);
      const data = await resCancelar.json();
      assert.equal(data.estado, 'CANCELADA');
      assert.equal(data.historial.length, 2);
      assert.equal(data.historial[1].estado, 'CANCELADA');
      assert.equal(data.historial[1].quien.id, 'comprador1');
      // No hay REEMBOLSADA cuando se cancela desde PENDIENTE
      const tieneReembolsada = data.historial.some((h) => h.estado === 'REEMBOLSADA');
      assert.equal(tieneReembolsada, false);
    });

    it('cancelar compra CONFIRMADA: 200, REEMBOLSADA, historial correcto', async () => {
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

      await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const resCancelar = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resCancelar.status, 200);
      const data = await resCancelar.json();
      assert.equal(data.estado, 'REEMBOLSADA');
      // 4 entradas: PENDIENTE (crear) + CONFIRMADA (pagar) + CANCELADA (cancelar) + REEMBOLSADA (sistema)
      assert.equal(data.historial.length, 4);
      assert.equal(data.historial[2].estado, 'CANCELADA');
      assert.equal(data.historial[2].quien.id, 'comprador1');
      assert.equal(data.historial[3].estado, 'REEMBOLSADA');
      assert.equal(data.historial[3].quien.id, 'sistema');
    });

    it('cancelar compra UTILIZADA responde 409', async () => {
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

      await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });

      await fetch(`${baseUrl}/compras/${compra.id}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });

      const resCancelar = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenComprador}` },
      });
      assert.equal(resCancelar.status, 409);
    });

    it('cancelar evento ya realizado responde 409', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);

      // Crear compra de un evento futuro
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

      // Avanzar el reloj más allá de la fecha del evento (30 días desde ahora)
      fijarAhora(sumarDias(ahora(), 31));

      const resCancelar = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resCancelar.status, 409);
    });

    it('cancelar dos veces responde 409', async () => {
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

      await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const resCancelar2 = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resCancelar2.status, 409);
    });

    it('organizador intenta cancelar responde 403', async () => {
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

      const resCancelar = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenOrganizador}` },
      });
      assert.equal(resCancelar.status, 403);
    });

    it('tercero intenta cancelar responde 403', async () => {
      const tokenComprador = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const tokenAmbos = await login(fetch, baseUrl, 'ambos1@example.com', PASSWORD);

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

      const resCancelar = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenAmbos}` },
      });
      assert.equal(resCancelar.status, 403);
    });

    it('cancelar compra inexistente responde 404', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/cp_inexistente/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 404);
    });

    it('sin token responde 401', async () => {
      const res = await fetch(`${baseUrl}/compras/cp_1/cancelacion`, {
        method: 'POST',
      });
      assert.equal(res.status, 401);
    });

    it(':id inválido responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/id con espacios/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });

    it('query param responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/cp_1/cancelacion?x=1`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });
  });

  describe('flujo completo — crear, pagar, cancelar', () => {
    it('crear → pagar → cancelar → REEMBOLSADA, verificar cupo en cada paso', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);

      // Crear
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
      assert.equal(resCrear.status, 201);
      const compra = await resCrear.json();
      assert.equal(compra.estado, 'PENDIENTE');

      // Pagar
      const resPagar = await fetch(`${baseUrl}/compras/${compra.id}/pago`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resPagar.status, 200);
      const dataPagar = await resPagar.json();
      assert.equal(dataPagar.estado, 'CONFIRMADA');

      // Cancelar
      const resCancelar = await fetch(`${baseUrl}/compras/${compra.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resCancelar.status, 200);
      const dataCancelar = await resCancelar.json();
      assert.equal(dataCancelar.estado, 'REEMBOLSADA');
    });

    it('dos compras agotan cupo, se cancela una, tercera compra funciona', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);

      // evt_conferencia2 (AI Summit) tiene cupo 100 (Early Bird), organizado por organizador1
      // comprador1 puede comprarlo sin problema de permisos
      const res1 = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.aiSummit,
          tipoEntradaId: 'te13',
          cantidad: 100,
        }),
      });
      assert.equal(res1.status, 201);
      const compra1 = await res1.json();

      // Intentar comprar 1 más — debería fallar
      const res2 = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.aiSummit,
          tipoEntradaId: 'te13',
          cantidad: 1,
        }),
      });
      assert.equal(res2.status, 409);

      // Cancelar la primera compra
      const resCancelar = await fetch(`${baseUrl}/compras/${compra1.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resCancelar.status, 200);

      // Ahora una tercera compra de 1 debería funcionar
      const res3 = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.aiSummit,
          tipoEntradaId: 'te13',
          cantidad: 1,
        }),
      });
      assert.equal(res3.status, 201);
    });
  });

  describe('schema — compraIdParamsSchema', () => {
    it('acepta ids válidos', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/cp_123abc/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // 404 porque no existe, pero el id pasó la validación
      assert.equal(res.status, 404);
    });

    it('rechaza id con espacios (codificados)', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/id%20con%20espacios/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });

    it('rechaza id con más de 64 caracteres', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const idLargo = 'a'.repeat(65);
      const res = await fetch(`${baseUrl}/compras/${idLargo}/uso`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });
  });
});
