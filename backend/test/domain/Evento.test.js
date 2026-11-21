import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Evento } from '../../src/domain/Evento.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { ValidationError } from '../../src/domain/errors.js';
import { fijarAhora, restaurarReloj } from '../../src/domain/reloj.js';

afterEach(() => {
  restaurarReloj();
});

function crearOrganizador() {
  return {
    id: 'org1',
    nombre: 'Organizador',
    apellido: 'Test',
    email: 'org@test.com',
  };
}

function crearCategoria() {
  return Categoria.crear({
    id: 'cat1',
    nombre: 'Recital',
    descripcion: 'Música en vivo',
  });
}

function crearTipoEntrada(precio, cupo = 100) {
  return TipoEntrada.crear({
    id: 'te1',
    nombre: 'General',
    descripcion: 'Entrada general',
    precio,
    cupo,
  });
}

describe('Evento', () => {
  describe('precioDesde', () => {
    it('debe devolver el precio más bajo con varios tipos de entrada', () => {
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [
          TipoEntrada.crear({ id: 'te1', nombre: 'General', descripcion: 'Gen', precio: 15000, cupo: 100 }),
          TipoEntrada.crear({ id: 'te2', nombre: 'Platea', descripcion: 'Plat', precio: 25000, cupo: 50 }),
          TipoEntrada.crear({ id: 'te3', nombre: 'VIP', descripcion: 'VIP', precio: 50000, cupo: 10 }),
        ],
        multimedia: [],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.precioDesde(), 15000);
    });

    it('debe devolver el único precio con un solo tipo de entrada', () => {
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(10000)],
        multimedia: [],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.precioDesde(), 10000);
    });
  });

  describe('tuPrecioEstaEntre', () => {
    it('debe incluir los extremos', () => {
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000)],
        multimedia: [],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.tuPrecioEstaEntre(15000, 20000), true);
      assert.equal(evento.tuPrecioEstaEntre(10000, 15000), true);
    });

    it('debe excluir lo de afuera', () => {
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000)],
        multimedia: [],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.tuPrecioEstaEntre(15001, 20000), false);
      assert.equal(evento.tuPrecioEstaEntre(0, 14999), false);
    });
  });

  describe('yaSeRealizo', () => {
    it('debe ser verdadero si la fecha es anterior al reloj fijado', () => {
      fijarAhora(new Date('2027-07-01T00:00:00.000Z'));

      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto pasado',
        descripcion: 'Ya pasó',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(10000)],
        multimedia: [],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.yaSeRealizo(), true);
    });

    it('debe ser falso si la fecha es posterior al reloj fijado', () => {
      fijarAhora(new Date('2027-05-01T00:00:00.000Z'));

      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto futuro',
        descripcion: 'Aún no pasa',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(10000)],
        multimedia: [],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.yaSeRealizo(), false);
    });
  });

  describe('crear', () => {
    it('debe fallar si no hay tipos de entrada', () => {
      assert.throws(() => {
        Evento.crear({
          id: 'evt1',
          nombre: 'Concierto',
          descripcion: 'Desc',
          categoria: crearCategoria(),
          fecha: '2027-06-01T21:00:00.000Z',
          tiposEntrada: [],
          multimedia: [],
          organizador: crearOrganizador(),
        });
      }, ValidationError);
    });

    it('debe fallar si los nombres de tipos de entrada están repetidos', () => {
      assert.throws(() => {
        Evento.crear({
          id: 'evt1',
          nombre: 'Concierto',
          descripcion: 'Desc',
          categoria: crearCategoria(),
          fecha: '2027-06-01T21:00:00.000Z',
          tiposEntrada: [
            TipoEntrada.crear({ id: 'te1', nombre: 'General', descripcion: 'Gen', precio: 100, cupo: 10 }),
            TipoEntrada.crear({ id: 'te2', nombre: 'General', descripcion: 'Gen2', precio: 200, cupo: 10 }),
          ],
          multimedia: [],
          organizador: crearOrganizador(),
        });
      }, ValidationError);
    });

    it('debe fallar si el nombre está vacío', () => {
      assert.throws(() => {
        Evento.crear({
          id: 'evt1',
          nombre: '',
          descripcion: 'Desc',
          categoria: crearCategoria(),
          fecha: '2027-06-01T21:00:00.000Z',
          tiposEntrada: [crearTipoEntrada(100)],
          multimedia: [],
          organizador: crearOrganizador(),
        });
      }, ValidationError);
    });

    it('debe fallar si la descripción está vacía', () => {
      assert.throws(() => {
        Evento.crear({
          id: 'evt1',
          nombre: 'Concierto',
          descripcion: '',
          categoria: crearCategoria(),
          fecha: '2027-06-01T21:00:00.000Z',
          tiposEntrada: [crearTipoEntrada(100)],
          multimedia: [],
          organizador: crearOrganizador(),
        });
      }, ValidationError);
    });

    it('debe fallar si la fecha no es válida', () => {
      assert.throws(() => {
        Evento.crear({
          id: 'evt1',
          nombre: 'Concierto',
          descripcion: 'Desc',
          categoria: crearCategoria(),
          fecha: 'no-es-fecha',
          tiposEntrada: [crearTipoEntrada(100)],
          multimedia: [],
          organizador: crearOrganizador(),
        });
      }, ValidationError);
    });

    it('debe crear un evento válido con multimedia', () => {
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000)],
        multimedia: ['https://ejemplo.com/img.jpg'],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.nombre, 'Concierto');
      assert.equal(evento.multimedia.length, 1);
      assert.equal(evento.multimedia[0], 'https://ejemplo.com/img.jpg');
    });

    it('debe crear un evento válido sin multimedia', () => {
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000)],
        multimedia: [],
        organizador: crearOrganizador(),
      });

      assert.equal(evento.multimedia.length, 0);
    });
  });

  describe('sinDetalles', () => {
    it('debe devolver el formato de respuesta API sin datos sensibles', () => {
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000, 200)],
        multimedia: ['https://ejemplo.com/img.jpg'],
        organizador: crearOrganizador(),
      });

      const detalle = evento.sinDetalles();

      assert.equal(detalle.id, 'evt1');
      assert.equal(detalle.nombre, 'Concierto');
      assert.equal(detalle.precioDesde, 15000);
      assert.equal(detalle.puntajeOrganizador, null);
      assert.equal(detalle.categoria.id, 'cat1');
      assert.equal(detalle.categoria.nombre, 'Recital');
      assert.equal(detalle.organizador.id, 'org1');
      assert.equal(detalle.organizador.nombre, 'Organizador');
      assert.equal(detalle.organizador.apellido, 'Test');
      assert.equal('email' in detalle.organizador, false);
      assert.equal('contrasena' in detalle.organizador, false);
      assert.equal('hash' in detalle.organizador, false);
      assert.equal(detalle.tiposEntrada.length, 1);
      assert.equal(detalle.tiposEntrada[0].cupo, 200);
      assert.equal(detalle.tiposEntrada[0].cupoDisponible, 200);
    });
  });

  describe('esOrganizadoPor', () => {
    it('debe ser verdadero para el organizador del evento', () => {
      const organizador = crearOrganizador();
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000)],
        multimedia: [],
        organizador,
      });

      assert.equal(evento.esOrganizadoPor(organizador), true);
    });

    it('debe ser falso para un usuario diferente al organizador', () => {
      const organizador = crearOrganizador();
      const otroUsuario = { id: 'otro1', nombre: 'Otro', apellido: 'Usuario', email: 'otro@test.com' };
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000)],
        multimedia: [],
        organizador,
      });

      assert.equal(evento.esOrganizadoPor(otroUsuario), false);
    });

    it('debe ser falso para el comprador que no es el organizador', () => {
      const organizador = crearOrganizador();
      const comprador = { id: 'comp1', nombre: 'Comprador', apellido: 'Test', email: 'comp@test.com' };
      const evento = Evento.crear({
        id: 'evt1',
        nombre: 'Concierto',
        descripcion: 'Un concierto',
        categoria: crearCategoria(),
        fecha: '2027-06-01T21:00:00.000Z',
        tiposEntrada: [crearTipoEntrada(15000)],
        multimedia: [],
        organizador,
      });

      assert.equal(evento.esOrganizadoPor(comprador), false);
    });
  });
});
