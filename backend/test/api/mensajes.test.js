import { describe, it, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';
import { login } from '../helpers/login.js';
import { seedIds } from '../../src/seed/eventos.js';

const EMAIL_COMPRADOR = 'comprador1@example.com';
const EMAIL_ORGANIZADOR = 'organizador1@example.com';
const EMAIL_OTRO = 'ambos1@example.com';
const PASSWORD = 'contraseña123';

describe('API - Mensajes de compra', () => {
  let baseUrl;
  let close;
  let compraConfirmadaId;
  let compraReembolsadaId;

  it('debe levantar el servidor antes de los tests', async () => {
    const result = await crearApp();
    baseUrl = result.baseUrl;
    close = result.close;

    // Obtener IDs de compras del seed
    const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
    const res = await fetch(`${baseUrl}/compras`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const compras = await res.json();

    // La compra CONFIRMADA es la de evt_teatro1
    compraConfirmadaId = compras.find(
      (c) => c.estado === 'CONFIRMADA' && c.evento.id === seedIds.eventos.hamlet,
    ).id;

    // La compra REEMBOLSADA es la de evt_conferencia1
    compraReembolsadaId = compras.find(
      (c) => c.estado === 'REEMBOLSADA' && c.evento.id === seedIds.eventos.techConference,
    ).id;
  });

  after(async () => {
    await close();
  });

  describe('POST /compras/:id/mensajes - enviar mensaje', () => {
    it('el comprador puede enviar un mensaje y recibe 201', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Consulta sobre la entrada' }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.texto, 'Consulta sobre la entrada');
      assert.equal(data.autor.id, 'comprador1');
      assert.ok(data.id);
      assert.ok(data.fechaHora);
    });

    it('el organizador puede enviar un mensaje', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Respuesta del organizador' }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.autor.id, 'organizador1');
    });

    it('un tercero no puede enviar mensaje - 403', async () => {
      const token = await login(fetch, baseUrl, EMAIL_OTRO, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'No debo poder enviar' }),
      });
      assert.equal(res.status, 403);
    });

    it('sin token responde 401', async () => {
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: 'Sin token' }),
      });
      assert.equal(res.status, 401);
    });

    it('compra inexistente responde 404', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/compra_inexistente/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Hola' }),
      });
      assert.equal(res.status, 404);
    });

    it('texto vacío responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: '   ' }),
      });
      assert.equal(res.status, 400);
    });

    it('texto de 1001 caracteres responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'a'.repeat(1001) }),
      });
      assert.equal(res.status, 400);
    });

    it('texto de 1000 caracteres es válido', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'a'.repeat(1000) }),
      });
      assert.equal(res.status, 201);
    });

    it('campo extra en body responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Hola', extra: 'campo' }),
      });
      assert.equal(res.status, 400);
    });

    it('se puede enviar en estado PENDIENTE', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      // Crear una nueva compra (PENDIENTE)
      const crearRes = await fetch(`${baseUrl}/compras`, {
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
      const nuevaCompra = await crearRes.json();
      const res = await fetch(`${baseUrl}/compras/${nuevaCompra.id}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Mensaje PENDIENTE' }),
      });
      assert.equal(res.status, 201);
    });

    it('se puede enviar en estado CANCELADA', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventoId: seedIds.eventos.finalFutbol,
          tipoEntradaId: 'te9',
          cantidad: 1,
        }),
      });
      const nueva = await res.json();
      // Cancelar
      await fetch(`${baseUrl}/compras/${nueva.id}/cancelacion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const msgRes = await fetch(`${baseUrl}/compras/${nueva.id}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Mensaje CANCELADA' }),
      });
      assert.equal(msgRes.status, 201);
    });

    it('se puede enviar en estado REEMBOLSADA', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraReembolsadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Mensaje REEMBOLSADA' }),
      });
      assert.equal(res.status, 201);
    });

    it('la respuesta no contiene datos sensibles', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: 'Sin datos sensibles' }),
      });
      const data = await res.json();
      assert.equal(data.autor.email, undefined);
      assert.equal(data.autor.contrasena, undefined);
      assert.equal(data.autor.hash, undefined);
      assert.equal(data.autor.apellido, undefined);
      assert.ok(data.autor.id);
      assert.ok(data.autor.nombre);
    });
  });

  describe('GET /compras/:id/mensajes - leer mensajes', () => {
    it('el comprador puede leer mensajes', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      // El seed tiene 3 mensajes en la compra CONFIRMADA
      assert.ok(data.length >= 3);
    });

    it('el organizador puede leer mensajes', async () => {
      const token = await login(fetch, baseUrl, EMAIL_ORGANIZADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
    });

    it('un tercero no puede leer mensajes - 403', async () => {
      const token = await login(fetch, baseUrl, EMAIL_OTRO, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 403);
    });

    it('sin token responde 401', async () => {
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`);
      assert.equal(res.status, 401);
    });

    it('compra inexistente responde 404', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/compra_inexistente/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 404);
    });

    it('los mensajes del seed están presentes', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // El seed tiene 3 mensajes: comprador, organizador, comprador
      assert.ok(data.length >= 3);
      const textos = data.map((m) => m.texto);
      assert.ok(textos.includes('Hola! Quería confirmar que asistiré al evento.'));
      assert.ok(textos.includes('Perfecto! Las entradas están listas. Cualquier consulta, avisame.'));
      assert.ok(textos.includes('Genial, muchas gracias!'));
    });

    it('los mensajes del seed REEMBOLSADA están presentes', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraReembolsadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      assert.ok(data.length >= 1);
      assert.ok(data.some((m) => m.texto.includes('reembolso')));
    });

    it('con desde devuelve solo mensajes posteriores', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      // Primero obtener todos los mensajes
      const todosRes = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const todos = await todosRes.json();
      // Usar la fecha del primer mensaje como "desde"
      const desde = todos[0].fechaHora;
      const res = await fetch(
        `${baseUrl}/compras/${compraConfirmadaId}/mensajes?desde=${encodeURIComponent(desde)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const filtrados = await res.json();
      assert.ok(filtrados.length < todos.length);
      // Todos los filtrados deben ser estrictamente posteriores
      for (const m of filtrados) {
        assert.ok(new Date(m.fechaHora).getTime() > new Date(desde).getTime());
      }
    });

    it('desde inválido responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(
        `${baseUrl}/compras/${compraConfirmadaId}/mensajes?desde=fecha-invalida`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      assert.equal(res.status, 400);
    });

    it('parámetro extra en query responde 400', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(
        `${baseUrl}/compras/${compraConfirmadaId}/mensajes?extra=campo`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      assert.equal(res.status, 400);
    });

    it('la respuesta no contiene datos sensibles', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      for (const m of data) {
        assert.equal(m.autor.email, undefined);
        assert.equal(m.autor.contrasena, undefined);
        assert.equal(m.autor.hash, undefined);
      }
    });

    it('los mensajes están ordenados cronológicamente', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      for (let i = 1; i < data.length; i++) {
        assert.ok(
          new Date(data[i].fechaHora).getTime() >= new Date(data[i - 1].fechaHora).getTime(),
          `Mensaje ${i} debería ser posterior o igual a ${i - 1}`,
        );
      }
    });
  });

  describe('GET /compras no incluye mensajes', () => {
    it('la respuesta de GET /compras no tiene campo mensajes', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res = await fetch(`${baseUrl}/compras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const compras = await res.json();
      for (const c of compras) {
        assert.equal(c.mensajes, undefined, 'GET /compras no debe incluir mensajes');
      }
    });
  });

  describe('polling simulado', () => {
    it('dos lecturas consecutivas devuelven los mismos datos', async () => {
      const token = await login(fetch, baseUrl, EMAIL_COMPRADOR, PASSWORD);
      const res1 = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data1 = await res1.json();
      const res2 = await fetch(`${baseUrl}/compras/${compraConfirmadaId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data2 = await res2.json();
      assert.equal(data1.length, data2.length);
    });
  });
});
