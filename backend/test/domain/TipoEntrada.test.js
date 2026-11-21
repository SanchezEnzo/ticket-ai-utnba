import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { TipoEntrada } from '../../src/domain/TipoEntrada.js';
import { ValidationError } from '../../src/domain/errors.js';
import { restaurarReloj } from '../../src/domain/reloj.js';

afterEach(() => {
  restaurarReloj();
});

describe('TipoEntrada', () => {
  describe('crear', () => {
    it('debe crear un tipo de entrada válido', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Entrada general',
        precio: 15000,
        cupo: 200,
      });

      assert.equal(te.id, 'te1');
      assert.equal(te.nombre, 'General');
      assert.equal(te.precio, 15000);
      assert.equal(te.cupo, 200);
      assert.equal(te.cupoDisponible, 200);
    });

    it('debe fallar si el nombre está vacío', () => {
      assert.throws(() => {
        TipoEntrada.crear({
          id: 'te1',
          nombre: '',
          descripcion: 'Desc',
          precio: 100,
          cupo: 10,
        });
      }, ValidationError);

      assert.throws(() => {
        TipoEntrada.crear({
          id: 'te1',
          nombre: '   ',
          descripcion: 'Desc',
          precio: 100,
          cupo: 10,
        });
      }, ValidationError);
    });

    it('debe fallar si el precio es negativo', () => {
      assert.throws(() => {
        TipoEntrada.crear({
          id: 'te1',
          nombre: 'General',
          descripcion: 'Desc',
          precio: -100,
          cupo: 10,
        });
      }, ValidationError);
    });

    it('debe aceptar precio cero', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'Gratis',
        descripcion: 'Entrada gratuita',
        precio: 0,
        cupo: 50,
      });
      assert.equal(te.precio, 0);
    });

    it('debe fallar si el cupo es cero', () => {
      assert.throws(() => {
        TipoEntrada.crear({
          id: 'te1',
          nombre: 'General',
          descripcion: 'Desc',
          precio: 100,
          cupo: 0,
        });
      }, ValidationError);
    });

    it('debe fallar si el cupo no es entero', () => {
      assert.throws(() => {
        TipoEntrada.crear({
          id: 'te1',
          nombre: 'General',
          descripcion: 'Desc',
          precio: 100,
          cupo: 2.5,
        });
      }, ValidationError);
    });

    it('debe fallar si el cupo es negativo', () => {
      assert.throws(() => {
        TipoEntrada.crear({
          id: 'te1',
          nombre: 'General',
          descripcion: 'Desc',
          precio: 100,
          cupo: -5,
        });
      }, ValidationError);
    });
  });

  describe('hayCupoPara', () => {
    it('debe ser verdadero en el límite exacto', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.equal(te.hayCupoPara(10), true);
    });

    it('debe ser verdadero uno antes del límite', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.equal(te.hayCupoPara(9), true);
    });

    it('debe ser falso uno después del límite', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.equal(te.hayCupoPara(11), false);
    });
  });

  describe('reservar', () => {
    it('debe bajar el cupo disponible', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      te.reservar(3);
      assert.equal(te.cupoDisponible, 7);
    });

    it('debe fallar si no hay cupo suficiente', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 5,
      });

      assert.throws(() => {
        te.reservar(6);
      }, ValidationError);
      assert.equal(te.cupoDisponible, 5);
    });

    it('debe fallar con cantidad cero', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.throws(() => {
        te.reservar(0);
      }, ValidationError);
    });

    it('debe fallar con cantidad negativa', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.throws(() => {
        te.reservar(-1);
      }, ValidationError);
    });

    it('debe fallar con cantidad no entera', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.throws(() => {
        te.reservar(1.5);
      }, ValidationError);
    });
  });

  describe('liberar', () => {
    it('debe subir el cupo disponible', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      te.reservar(4);
      assert.equal(te.cupoDisponible, 6);

      te.liberar(2);
      assert.equal(te.cupoDisponible, 8);
    });

    it('debe fallar si supera el cupo total', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.throws(() => {
        te.liberar(1);
      }, ValidationError);
      assert.equal(te.cupoDisponible, 10);
    });

    it('debe fallar con cantidad cero', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.throws(() => {
        te.liberar(0);
      }, ValidationError);
    });

    it('debe fallar con cantidad negativa', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.throws(() => {
        te.liberar(-1);
      }, ValidationError);
    });

    it('debe fallar con cantidad no entera', () => {
      const te = TipoEntrada.crear({
        id: 'te1',
        nombre: 'General',
        descripcion: 'Desc',
        precio: 100,
        cupo: 10,
      });

      assert.throws(() => {
        te.liberar(1.5);
      }, ValidationError);
    });
  });
});
