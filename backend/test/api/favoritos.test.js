import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';
import { login } from '../helpers/login.js';
import { restaurarReloj } from '../../src/domain/reloj.js';
import { seedIds } from '../../src/seed/eventos.js';

let app;
let baseUrl;
let tokenComprador1;
let tokenComprador2;
let tokenOrganizador1;

before(async () => {
  app = await crearApp();
  baseUrl = app.baseUrl;
  tokenComprador1 = await login(
    fetch,
    baseUrl,
    'comprador1@example.com',
    'contraseña123'
  );
  tokenComprador2 = await login(
    fetch,
    baseUrl,
    'comprador2@example.com',
    'contraseña123'
  );
  tokenOrganizador1 = await login(
    fetch,
    baseUrl,
    'organizador1@example.com',
    'contraseña123'
  );
});

after(async () => {
  await app.close();
});

afterEach(() => {
  restaurarReloj();
});

function headers(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

describe('GET /favoritos — listar favoritos del seed', () => {
  it('debe devolver los favoritos de comprador1', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador1) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 3);
    const ids = data.map((e) => e.id);
    assert.ok(ids.includes(seedIds.eventos.rockEnVivo));
    assert.ok(ids.includes(seedIds.eventos.hamlet));
    assert.ok(ids.includes(seedIds.eventos.conciertoPasado));
  });

  it('debe devolver un arreglo vacío para un usuario sin favoritos', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador2) });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 0);
  });

  it('debe ordenar por fecha ascendente y luego por nombre', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador1) });
    assert.equal(res.status, 200);
    const data = await res.json();
    const fechas = data.map((e) => e.fecha);
    for (let i = 1; i < fechas.length; i++) {
      assert.ok(fechas[i] >= fechas[i - 1]);
    }
  });

  it('debe incluir eventos ya realizados', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador1) });
    assert.equal(res.status, 200);
    const data = await res.json();
    const nombres = data.map((e) => e.nombre);
    assert.ok(nombres.includes('Concierto Pasado'));
  });

  it('debe incluir puntajeOrganizador en cada evento', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador1) });
    assert.equal(res.status, 200);
    const data = await res.json();
    for (const evento of data) {
      assert.ok('puntajeOrganizador' in evento);
    }
  });

  it('no debe incluir email, contraseña ni hash en la respuesta', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador1) });
    assert.equal(res.status, 200);
    const data = await res.json();
    const texto = JSON.stringify(data);
    assert.ok(!texto.includes('example.com'));
    assert.ok(!texto.includes('contraseña'));
    assert.ok(!texto.includes('hash'));
  });
});

describe('PUT /favoritos/:eventoId — marcar favorito', () => {
  it('debe marcar un evento como favorito (204)', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.festivalVerano}`,
      { method: 'PUT', headers: headers(tokenComprador2) }
    );
    assert.equal(res.status, 204);
  });

  it('el evento marcado debe aparecer en el listado', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador2) });
    assert.equal(res.status, 200);
    const data = await res.json();
    const ids = data.map((e) => e.id);
    assert.ok(ids.includes(seedIds.eventos.festivalVerano));
  });

  it('marcar dos veces no duplica (204 ambas veces)', async () => {
    const res1 = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.festivalVerano}`,
      { method: 'PUT', headers: headers(tokenComprador2) }
    );
    assert.equal(res1.status, 204);
    const res2 = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.festivalVerano}`,
      { method: 'PUT', headers: headers(tokenComprador2) }
    );
    assert.equal(res2.status, 204);
    const listRes = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador2) });
    const listData = await listRes.json();
    const count = listData.filter((e) => e.id === seedIds.eventos.festivalVerano).length;
    assert.equal(count, 1);
  });

  it('debe devolver 404 si el evento no existe', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/evt_no_existe`,
      { method: 'PUT', headers: headers(tokenComprador1) }
    );
    assert.equal(res.status, 404);
  });

  it('debe devolver 400 si el eventoId tiene formato inválido', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/id%20con%20espacios`,
      { method: 'PUT', headers: headers(tokenComprador1) }
    );
    assert.equal(res.status, 400);
  });

  it('debe devolver 400 si hay query params no esperados', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.rockEnVivo}?foo=bar`,
      { method: 'PUT', headers: headers(tokenComprador1) }
    );
    assert.equal(res.status, 400);
  });

  it('debe devolver 401 sin token', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.rockEnVivo}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
    );
    assert.equal(res.status, 401);
  });

  it('un organizador puede marcar su propio evento como favorito', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.rockEnVivo}`,
      { method: 'PUT', headers: headers(tokenOrganizador1) }
    );
    assert.equal(res.status, 204);
  });
});

describe('DELETE /favoritos/:eventoId — quitar favorito', () => {
  it('debe quitar un evento de favoritos (204)', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.festivalVerano}`,
      { method: 'DELETE', headers: headers(tokenComprador2) }
    );
    assert.equal(res.status, 204);
  });

  it('el evento quitado no debe aparecer en el listado', async () => {
    const res = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador2) });
    assert.equal(res.status, 200);
    const data = await res.json();
    const ids = data.map((e) => e.id);
    assert.ok(!ids.includes(seedIds.eventos.festivalVerano));
  });

  it('quitar un evento que no era favorito devuelve 204', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.rockEnVivo}`,
      { method: 'DELETE', headers: headers(tokenComprador2) }
    );
    assert.equal(res.status, 204);
  });

  it('debe devolver 404 si el evento no existe', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/evt_no_existe`,
      { method: 'DELETE', headers: headers(tokenComprador1) }
    );
    assert.equal(res.status, 404);
  });

  it('debe devolver 400 si el eventoId tiene formato inválido', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/id%20con%20espacios`,
      { method: 'DELETE', headers: headers(tokenComprador1) }
    );
    assert.equal(res.status, 400);
  });

  it('debe devolver 400 si hay query params no esperados', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.rockEnVivo}?foo=bar`,
      { method: 'DELETE', headers: headers(tokenComprador1) }
    );
    assert.equal(res.status, 400);
  });

  it('debe devolver 401 sin token', async () => {
    const res = await fetch(
      `${baseUrl}/favoritos/${seedIds.eventos.rockEnVivo}`,
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
    );
    assert.equal(res.status, 401);
  });
});

describe('GET /favoritos — autenticación y validación', () => {
  it('debe devolver 401 sin token', async () => {
    const res = await fetch(`${baseUrl}/favoritos`);
    assert.equal(res.status, 401);
  });

  it('debe devolver 400 si hay query params no esperados', async () => {
    const res = await fetch(`${baseUrl}/favoritos?foo=bar`, {
      headers: headers(tokenComprador1),
    });
    assert.equal(res.status, 400);
  });
});

describe('favoritos — aislamiento entre usuarios', () => {
  it('cada usuario ve solo sus propios favoritos', async () => {
    // comprador1 tiene 3 favoritos del seed
    const res1 = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador1) });
    const data1 = await res1.json();
    assert.equal(data1.length, 3);

    // comprador2 no tiene favoritos
    const res2 = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador2) });
    const data2 = await res2.json();
    assert.equal(data2.length, 0);
  });
});

describe('favoritos — ciclo completo marcar, listar y quitar', () => {
  it('marcar, listar y quitar: el evento aparece y luego desaparece', async () => {
    const evtId = seedIds.eventos.techConference;

    // Marcar
    const putRes = await fetch(
      `${baseUrl}/favoritos/${evtId}`,
      { method: 'PUT', headers: headers(tokenComprador2) }
    );
    assert.equal(putRes.status, 204);

    // Listar y verificar que aparece
    const listRes1 = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador2) });
    const listData1 = await listRes1.json();
    assert.ok(listData1.some((e) => e.id === evtId));

    // Quitar
    const delRes = await fetch(
      `${baseUrl}/favoritos/${evtId}`,
      { method: 'DELETE', headers: headers(tokenComprador2) }
    );
    assert.equal(delRes.status, 204);

    // Listar y verificar que ya no aparece
    const listRes2 = await fetch(`${baseUrl}/favoritos`, { headers: headers(tokenComprador2) });
    const listData2 = await listRes2.json();
    assert.ok(!listData2.some((e) => e.id === evtId));
  });
});
