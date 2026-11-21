import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../helpers/crearApp.js';
import { login } from '../helpers/login.js';
import { restaurarReloj } from '../../src/domain/reloj.js';
import { seedIds } from '../../src/seed/eventos.js';

let app;
let baseUrl;
let token;

before(async () => {
  app = await crearApp();
  baseUrl = app.baseUrl;
  token = await login(fetch, baseUrl, 'organizador1@example.com', 'contraseña123');
});

after(async () => {
  await app.close();
});

afterEach(() => {
  restaurarReloj();
});

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

describe('GET /categorias', () => {
  it('debe devolver las 5 categorías del seed', async () => {
    const res = await fetch(`${baseUrl}/categorias`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 5);
    const nombres = data.map((c) => c.nombre);
    assert.ok(nombres.includes('Recitales'));
    assert.ok(nombres.includes('Teatro'));
    assert.ok(nombres.includes('Festivales'));
    assert.ok(nombres.includes('Conferencias'));
    assert.ok(nombres.includes('Deportes'));
  });

  it('debe requerir autenticación', async () => {
    const res = await fetch(`${baseUrl}/categorias`);
    assert.equal(res.status, 401);
  });
});

describe('GET /eventos/:id', () => {
  it('debe devolver el detalle de un evento existente', async () => {
    const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, seedIds.eventos.rockEnVivo);
    assert.equal(data.nombre, 'Rock en Vivo');
    assert.equal(data.puntajeOrganizador, null);
    assert.equal('email' in data.organizador, false);
  });

  it('debe devolver 404 si el evento no existe', async () => {
    const res = await fetch(`${baseUrl}/eventos/evt_no_existe`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 404);
  });

  it('debe devolver 200 para un evento pasado', async () => {
    const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.conciertoPasado}`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.nombre, 'Concierto Pasado');
  });

  it('debe devolver 400 si el id tiene formato inválido', async () => {
    const res = await fetch(`${baseUrl}/eventos/id%20con%20espacios`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 400);
  });

  it('debe requerir autenticación', async () => {
    const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}`);
    assert.equal(res.status, 401);
  });
});

describe('POST /eventos', () => {
  it('debe crear un evento con 3 tipos de entrada', async () => {
    const body = {
      nombre: 'Nuevo Concierto',
      descripcion: 'Un concierto nuevo',
      categoriaId: seedIds.categorias.recital,
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      multimedia: ['https://ejemplo.com/nuevo.jpg'],
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Piso', precio: 10000, cupo: 100 },
        { nombre: 'Platea', descripcion: 'Fila', precio: 20000, cupo: 50 },
        { nombre: 'VIP', descripcion: 'Backstage', precio: 40000, cupo: 10 },
      ],
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.nombre, 'Nuevo Concierto');
    assert.equal(data.tiposEntrada.length, 3);
    assert.equal(data.organizador.id, 'organizador1');
    assert.equal('email' in data.organizador, false);
  });

  it('debe fallar con categoriaId inexistente', async () => {
    const body = {
      nombre: 'Evento',
      descripcion: 'Desc',
      categoriaId: 'cat_no_existe',
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Gen', precio: 1000, cupo: 10 },
      ],
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 404);
  });

  it('debe fallar con fecha pasada', async () => {
    const body = {
      nombre: 'Evento',
      descripcion: 'Desc',
      categoriaId: seedIds.categorias.recital,
      fecha: new Date(Date.now() - 86400000).toISOString(),
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Gen', precio: 1000, cupo: 10 },
      ],
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400);
  });

  it('debe fallar con precio negativo (regla de dominio)', async () => {
    const body = {
      nombre: 'Evento',
      descripcion: 'Desc',
      categoriaId: seedIds.categorias.recital,
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Gen', precio: -100, cupo: 10 },
      ],
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400);
  });

  it('debe fallar con cupo 0 (regla de dominio)', async () => {
    const body = {
      nombre: 'Evento',
      descripcion: 'Desc',
      categoriaId: seedIds.categorias.recital,
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Gen', precio: 1000, cupo: 0 },
      ],
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400);
  });

  it('debe fallar con tipos incorrectos (número como texto)', async () => {
    const body = {
      nombre: 'Evento',
      descripcion: 'Desc',
      categoriaId: seedIds.categorias.recital,
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Gen', precio: '1000', cupo: 10 },
      ],
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400);
  });

  it('debe fallar con claves extra en el body', async () => {
    const body = {
      nombre: 'Evento',
      descripcion: 'Desc',
      categoriaId: seedIds.categorias.recital,
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Gen', precio: 1000, cupo: 10 },
      ],
      claveExtra: 'no permitido',
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400);
  });

  it('debe requerir autenticación', async () => {
    const body = {
      nombre: 'Evento',
      descripcion: 'Desc',
      categoriaId: seedIds.categorias.recital,
      fecha: new Date(Date.now() + 86400000 * 10).toISOString(),
      tiposEntrada: [
        { nombre: 'General', descripcion: 'Gen', precio: 1000, cupo: 10 },
      ],
    };

    const res = await fetch(`${baseUrl}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 401);
  });
});

describe('GET /eventos (catálogo)', () => {
  it('debe devolver eventos futuros ordenados por fecha por defecto', async () => {
    const res = await fetch(`${baseUrl}/eventos`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    // No debe incluir el evento pasado
    const ids = data.map((e) => e.id);
    assert.ok(!ids.includes(seedIds.eventos.conciertoPasado));
    // Verificar orden por fecha
    for (let i = 1; i < data.length; i++) {
      assert.ok(
        new Date(data[i].fecha).getTime() >= new Date(data[i - 1].fecha).getTime(),
        `Evento ${i} debería ser >= evento ${i - 1} por fecha`
      );
    }
  });

  it('debe buscar por nombre con q', async () => {
    const res = await fetch(`${baseUrl}/eventos?q=Rock`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.length > 0);
    for (const e of data) {
      assert.ok(
        e.nombre.toLowerCase().includes('rock') || e.descripcion.toLowerCase().includes('rock')
      );
    }
  });

  it('debe buscar por descripción con q', async () => {
    const res = await fetch(`${baseUrl}/eventos?q=Shakespeare`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.length > 0);
    assert.equal(data[0].nombre, 'Hamlet');
  });

  it('debe ser insensible a mayúsculas', async () => {
    const res = await fetch(`${baseUrl}/eventos?q=ROCK`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.length > 0);
  });

  it('debe devolver lista vacía si no hay resultados', async () => {
    const res = await fetch(`${baseUrl}/eventos?q=xyznoexiste`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 0);
  });

  it('debe filtrar por categoría', async () => {
    const res = await fetch(
      `${baseUrl}/eventos?categoria=${seedIds.categorias.teatro}`,
      { headers: authHeaders() }
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.length > 0);
    for (const e of data) {
      assert.equal(e.categoria.id, seedIds.categorias.teatro);
    }
  });

  it('debe combinar q y categoría', async () => {
    const res = await fetch(
      `${baseUrl}/eventos?q=Comedia&categoria=${seedIds.categorias.teatro}`,
      { headers: authHeaders() }
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.length > 0);
    for (const e of data) {
      assert.equal(e.categoria.id, seedIds.categorias.teatro);
      assert.ok(
        e.nombre.toLowerCase().includes('comedia') ||
          e.descripcion.toLowerCase().includes('comedia')
      );
    }
  });

  it('debe ordenar por precio ascendente', async () => {
    const res = await fetch(`${baseUrl}/eventos?orden=precio`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    for (let i = 1; i < data.length; i++) {
      assert.ok(
        data[i].precioDesde >= data[i - 1].precioDesde,
        `Evento ${i} debería tener precio >= evento ${i - 1}`
      );
    }
  });

  it('debe ordenar por fecha ascendente', async () => {
    const res = await fetch(`${baseUrl}/eventos?orden=fecha`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    for (let i = 1; i < data.length; i++) {
      assert.ok(
        new Date(data[i].fecha).getTime() >= new Date(data[i - 1].fecha).getTime(),
        `Evento ${i} debería ser >= evento ${i - 1} por fecha`
      );
    }
  });

  it('debe ordenar por puntaje (estable, todos null)', async () => {
    const res = await fetch(`${baseUrl}/eventos?orden=puntaje`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    for (const e of data) {
      assert.equal(e.puntajeOrganizador, null);
    }
  });

  it('debe devolver 400 por parámetro desconocido', async () => {
    const res = await fetch(`${baseUrl}/eventos?parametroInvalido=1`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 400);
  });

  it('debe devolver 400 por orden inválido', async () => {
    const res = await fetch(`${baseUrl}/eventos?orden=nombre`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 400);
  });

  it('debe requerir autenticación', async () => {
    const res = await fetch(`${baseUrl}/eventos`);
    assert.equal(res.status, 401);
  });
});

describe('Formato de respuesta', () => {
  it('no debe contener email, contraseña ni hash del organizador', async () => {
    const res = await fetch(`${baseUrl}/eventos/${seedIds.eventos.rockEnVivo}`, {
      headers: authHeaders(),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal('email' in data.organizador, false);
    assert.equal('contrasena' in data.organizador, false);
    assert.equal('hash' in data.organizador, false);
    assert.equal('password' in data.organizador, false);
  });
});
