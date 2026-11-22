import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Resenia } from '../../src/domain/Resenia.js';
import { Compra, EstadoCompra } from '../../src/domain/Compra.js';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { Evento } from '../../src/domain/Evento.js';
import { Usuario } from '../../src/domain/Usuario.js';
import { Categoria } from '../../src/domain/Categoria.js';
import { fijarAhora, restaurarReloj, sumarDias, ahora } from '../../src/domain/reloj.js';
import { ValidationError, ForbiddenError, ConflictError } from '../../src/domain/errors.js';

function crearFixture() {
  const organizador = Usuario.crear({
    id: 'org1',
    nombre: 'Org',
    apellido: 'Uno',
    email: 'org@example.com',
    contrasena: '123',
  });

  const comprador = Usuario.crear({
    id: 'comp1',
    nombre: 'Comp',
    apellido: 'Uno',
    email: 'comp@example.com',
    contrasena: '123',
  });

  const categoria = Categoria.crear({
    id: 'cat1',
    nombre: 'Recital',
    descripcion: 'Música en vivo',
  });

  const tipoGeneral = TipoEntrada.crear({
    id: 'te1',
    nombre: 'General',
    descripcion: 'Piso',
    precio: 10000,
    cupo: 100,
  });

  const evento = Evento.crear({
    id: 'evt1',
    nombre: 'Concierto',
    descripcion: 'Rock en vivo',
    categoria,
    fecha: sumarDias(ahora(), 30).toISOString(),
    tiposEntrada: [tipoGeneral],
    multimedia: [],
    organizador,
  });

  return {
    organizador,
    comprador,
    categoria,
    tipoGeneral,
    evento,
  };
}

function crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador }) {
  fijarAhora(sumarDias(evento.fecha, -1));
  const compra = Compra.crear({
    id: 'cp_1',
    comprador,
    evento,
    tipoEntrada: tipoGeneral,
    cantidad: 1,
  });
  compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
  compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador);
  restaurarReloj();
  return compra;
}

function crearCompraConfirmada({ comprador, evento, tipoGeneral }) {
  const compra = Compra.crear({
    id: 'cp_2',
    comprador,
    evento,
    tipoEntrada: tipoGeneral,
    cantidad: 1,
  });
  compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
  return compra;
}

describe('Resenia', () => {
  afterEach(() => {
    restaurarReloj();
  });

  describe('crear', () => {
    it('crea una reseña válida con puntaje entero', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      const resenia = Resenia.crear({
        id: 'res_1',
        comprador,
        evento,
        puntaje: 5,
        comentario: 'Excelente evento',
        compras: [compra],
        reseniaPrevia: null,
      });

      assert.equal(resenia.puntaje, 5);
      assert.equal(resenia.comentario, 'Excelente evento');
      assert.equal(resenia.comprador.id, 'comp1');
      assert.equal(resenia.evento.id, 'evt1');
    });

    it('crea una reseña válida con puntaje medio', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      const resenia = Resenia.crear({
        id: 'res_1',
        comprador,
        evento,
        puntaje: 3.5,
        comentario: 'Buen evento',
        compras: [compra],
        reseniaPrevia: null,
      });

      assert.equal(resenia.puntaje, 3.5);
    });

    it('lanza ValidationError si el puntaje es menor a 1', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      assert.throws(() => {
        Resenia.crear({
          id: 'res_1',
          comprador,
          evento,
          puntaje: 0.5,
          comentario: 'Comentario',
          compras: [compra],
          reseniaPrevia: null,
        });
      }, ValidationError);
    });

    it('lanza ValidationError si el puntaje es mayor a 5', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      assert.throws(() => {
        Resenia.crear({
          id: 'res_1',
          comprador,
          evento,
          puntaje: 5.5,
          comentario: 'Comentario',
          compras: [compra],
          reseniaPrevia: null,
        });
      }, ValidationError);
    });

    it('lanza ValidationError si el puntaje no es múltiplo de 0.5', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      assert.throws(() => {
        Resenia.crear({
          id: 'res_1',
          comprador,
          evento,
          puntaje: 3.25,
          comentario: 'Comentario',
          compras: [compra],
          reseniaPrevia: null,
        });
      }, ValidationError);
    });

    it('lanza ValidationError si el comentario está vacío', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      assert.throws(() => {
        Resenia.crear({
          id: 'res_1',
          comprador,
          evento,
          puntaje: 4,
          comentario: '   ',
          compras: [compra],
          reseniaPrevia: null,
        });
      }, ValidationError);
    });

    it('lanza ValidationError si el comentario excede 1000 caracteres', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      assert.throws(() => {
        Resenia.crear({
          id: 'res_1',
          comprador,
          evento,
          puntaje: 4,
          comentario: 'a'.repeat(1001),
          compras: [compra],
          reseniaPrevia: null,
        });
      }, ValidationError);
    });

    it('lanza ForbiddenError si no tiene compras', () => {
      const { comprador, evento } = crearFixture();

      assert.throws(() => {
        Resenia.crear({
          id: 'res_1',
          comprador,
          evento,
          puntaje: 4,
          comentario: 'Buen evento',
          compras: [],
          reseniaPrevia: null,
        });
      }, ForbiddenError);
    });

    it('lanza ForbiddenError si la compra no está UTILIZADA', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = crearCompraConfirmada({ comprador, evento, tipoGeneral });

      assert.throws(() => {
        Resenia.crear({
          id: 'res_1',
          comprador,
          evento,
          puntaje: 4,
          comentario: 'Buen evento',
          compras: [compra],
          reseniaPrevia: null,
        });
      }, ForbiddenError);
    });

    it('lanza ConflictError si ya existe una reseña previa', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      const reseniaExistente = Resenia.crear({
        id: 'res_existente',
        comprador,
        evento,
        puntaje: 4,
        comentario: 'Ya reseñé',
        compras: [compra],
        reseniaPrevia: null,
      });

      assert.throws(() => {
        Resenia.crear({
          id: 'res_2',
          comprador,
          evento,
          puntaje: 5,
          comentario: 'Segunda reseña',
          compras: [compra],
          reseniaPrevia: reseniaExistente,
        });
      }, ConflictError);
    });

    it('recorta los espacios del comentario', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });

      const resenia = Resenia.crear({
        id: 'res_1',
        comprador,
        evento,
        puntaje: 4,
        comentario: '  Comentario con espacios  ',
        compras: [compra],
        reseniaPrevia: null,
      });

      assert.equal(resenia.comentario, 'Comentario con espacios');
    });
  });

  describe('promedio', () => {
    it('devuelve null si no hay reseñas', () => {
      assert.equal(Resenia.promedio([]), null);
      assert.equal(Resenia.promedio(null), null);
    });

    it('calcula el promedio correctamente', () => {
      const r1 = { puntaje: 4 };
      const r2 = { puntaje: 5 };
      const r3 = { puntaje: 3.5 };
      assert.equal(Resenia.promedio([r1, r2, r3]), 4.2);
    });

    it('redondea a 1 decimal', () => {
      const r1 = { puntaje: 4 };
      const r2 = { puntaje: 5 };
      assert.equal(Resenia.promedio([r1, r2]), 4.5);
    });

    it('devuelve el mismo puntaje si hay una sola reseña', () => {
      const r1 = { puntaje: 3.5 };
      assert.equal(Resenia.promedio([r1]), 3.5);
    });
  });

  describe('paraRespuesta', () => {
    it('devuelve el objeto de respuesta sin email ni contraseña', () => {
      const { comprador, evento, tipoGeneral, organizador } = crearFixture();
      const compra = crearCompraUtilizada({ comprador, evento, tipoGeneral, organizador });
      fijarAhora(new Date('2027-01-15T12:00:00.000Z'));

      const resenia = Resenia.crear({
        id: 'res_1',
        comprador,
        evento,
        puntaje: 4.5,
        comentario: 'Muy bueno',
        compras: [compra],
        reseniaPrevia: null,
      });

      const respuesta = resenia.paraRespuesta();

      assert.equal(respuesta.id, 'res_1');
      assert.equal(respuesta.puntaje, 4.5);
      assert.equal(respuesta.comentario, 'Muy bueno');
      assert.equal(respuesta.autor.id, 'comp1');
      assert.equal(respuesta.autor.nombre, 'Comp');
      assert.equal(respuesta.autor.apellido, 'Uno');
      assert.equal(respuesta.evento.id, 'evt1');
      assert.equal(respuesta.evento.nombre, 'Concierto');
      assert.equal(respuesta.fecha, '2027-01-15T12:00:00.000Z');
      assert.equal(respuesta.autor.email, undefined);
      assert.equal(respuesta.autor.contrasena, undefined);

      restaurarReloj();
    });
  });
});
