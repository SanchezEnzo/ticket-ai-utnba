import { describe, it, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';
import { login } from '../helpers/login.js';
import { seedIds } from '../../src/seed/eventos.js';
import { restaurarReloj } from '../../src/domain/reloj.js';

const EMAIL_COMPRADOR = 'comprador1@example.com';
const EMAIL_ORGANIZADOR = 'organizador1@example.com';
const PASSWORD = 'contraseña123';

describe('API - GET /eventos/:id/compras', () => {
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

  afterEach(() => {
    restaurarReloj();
  });

  describe('permisos', () => {
    it('el organizador del evento recibe 200', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.evento);
      assert.ok(Array.isArray(data.compras));
    });

    it('un tercero que no organiza el evento recibe 403', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 403);
    });

    it('el comprador de entradas no es organizador, recibe 403', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      // evt_recital1 es de organizador1, no de comprador1
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 403);
    });

    it('el organizador de otro evento recibe 403', async () => {
      // comprador1 organiza evt_festival1, pero no evt_recital1
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 403);
    });

    it('ambos1 no puede ver compras de evento de organizador1', async () => {
      const token = await login(fetch, baseUrl, 'ambos1@example.com', PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 403);
    });
  });

  describe('autenticación', () => {
    it('sin token responde 401', async () => {
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`);
      assert.equal(res.status, 401);
    });
  });

  describe('validación de parámetros', () => {
    it('id inválido con espacios responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/id con espacios/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });

    it('id que no existe responde 404', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/evt_inexistente/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 404);
    });

    it('parámetro de query no permitido responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras?filtro=todo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 400);
    });
  });

  describe('formato de respuesta', () => {
    it('devuelve evento resumido con tiposEntrada y cupoDisponible', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.evento.id, seedIds.eventos.rockEnVivo);
      assert.equal(data.evento.nombre, 'Rock en Vivo');
      assert.ok(data.evento.fecha);
      assert.ok(Array.isArray(data.evento.tiposEntrada));

      for (const te of data.evento.tiposEntrada) {
        assert.ok(te.id);
        assert.ok(te.nombre);
        assert.ok(typeof te.precio === 'number');
        assert.ok(typeof te.cupo === 'number');
        assert.ok(typeof te.cupoDisponible === 'number');
      }
    });

    it('cada compra tiene el formato de paraRespuesta', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      for (const c of data.compras) {
        assert.ok(c.id);
        assert.ok(c.estado);
        assert.ok(c.evento);
        assert.ok(c.tipoEntrada);
        assert.ok(typeof c.cantidad === 'number');
        assert.ok(typeof c.total === 'number');
        assert.ok(c.comprador);
        assert.ok(Array.isArray(c.historial));
      }
    });

    it('no expone datos sensibles del comprador', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      for (const c of data.compras) {
        assert.equal(c.comprador.email, undefined);
        assert.equal(c.comprador.contrasena, undefined);
      }
    });
  });

  describe('cupoDisponible', () => {
    it('refleja el cupo reducido por las compras del seed', async () => {
      // evt_recital1 tiene General con cupo 200, el seed crea 1 compra PENDIENTE de cantidad 1
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const general = data.evento.tiposEntrada.find((te) => te.nombre === 'General');
      assert.equal(general.cupo, 200);
      assert.equal(general.cupoDisponible, 199);
    });

    it('invariante: cupoDisponible <= cupo para cada tipo', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      for (const te of data.evento.tiposEntrada) {
        assert.ok(te.cupoDisponible <= te.cupo, `cupoDisponible (${te.cupoDisponible}) debe ser <= cupo (${te.cupo})`);
      }
    });
  });

  describe('compras de varios estados', () => {
    it('incluye compras de distintos estados del seed', async () => {
      // evt_recital1 tiene 1 compra PENDIENTE del seed
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Al menos la compra PENDIENTE del seed
      assert.ok(data.compras.length >= 1);
      const estados = data.compras.map((c) => c.estado);
      assert.ok(estados.includes('PENDIENTE'));
    });
  });

  describe('orden', () => {
    it('las compras están ordenadas de más reciente a más antigua', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      for (let i = 1; i < data.compras.length; i++) {
        const anterior = data.compras[i - 1].historial[0].fechaHora;
        const actual = data.compras[i].historial[0].fechaHora;
        assert.ok(anterior >= actual, 'Las compras deben estar ordenadas de más reciente a más antigua');
      }
    });
  });

  describe('evento sin compras', () => {
    it('devuelve array vacío de compras', async () => {
      // evt_deportes1 (Final de Fútbol) es de organizador1; el seed solo crea 1 compra CANCELADA para este evento
      // evt_conferencia2 (AI Summit) es de organizador1; el seed no crea compras para este evento
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.aiSummit}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.compras.length, 0);
      assert.equal(data.evento.id, seedIds.eventos.aiSummit);
    });
  });

  describe('evento ya realizado', () => {
    it('el organizador puede ver las compras de un evento ya realizado', async () => {
      // evt_pasado1 (Concierto Pasado) es de organizador1, ya se realizó
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.conciertoPasado}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.evento.id, seedIds.eventos.conciertoPasado);
      // El seed crea 1 compra UTILIZADA para este evento
      assert.ok(data.compras.length >= 1);
    });
  });

  describe('organizador de evento propio', () => {
    it('comprador1 puede ver compras de su propio evento (evt_festival1)', async () => {
      // evt_festival1 es organizado por comprador1
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.festivalVerano}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.evento.id, seedIds.eventos.festivalVerano);
    });

    it('ambos1 puede ver compras de evt_conferencia1 que organiza', async () => {
      // evt_conferencia1 es organizado por ambos1
      const token = await login(fetch, baseUrl, 'ambos1@example.com', PASSWORD);
      const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.techConference}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.evento.id, seedIds.eventos.techConference);
    });
  });
});
