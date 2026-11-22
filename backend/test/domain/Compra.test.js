import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Compra, EstadoCompra, SISTEMA, crearCambioEstadoCompra } from '../../src/domain/Compra.js';
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

  const otroUsuario = Usuario.crear({
    id: 'otro1',
    nombre: 'Otro',
    apellido: 'Uno',
    email: 'otro@example.com',
    contrasena: '123',
  });

  const otroOrganizador = Usuario.crear({
    id: 'org2',
    nombre: 'Org',
    apellido: 'Dos',
    email: 'org2@example.com',
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
    otroUsuario,
    otroOrganizador,
    categoria,
    tipoGeneral,
    evento,
  };
}

describe('Compra', () => {
  afterEach(() => {
    restaurarReloj();
  });

  describe('crear', () => {
    it('nace en estado PENDIENTE', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 2,
      });
      assert.equal(compra.estado, EstadoCompra.PENDIENTE);
    });

    it('calcula el total correctamente', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 3,
      });
      assert.equal(compra.total, 30000);
    });

    it('reserva el cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      assert.equal(tipoGeneral.cupoDisponible, 100);
      Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 2,
      });
      assert.equal(tipoGeneral.cupoDisponible, 98);
    });

    it('registra una entrada en el historial', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.equal(compra.historial.length, 1);
      assert.equal(compra.historial[0].estado, EstadoCompra.PENDIENTE);
      assert.equal(compra.historial[0].quien.id, comprador.id);
    });

    it('falla con cantidad 0 sin cambiar cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const cupoAntes = tipoGeneral.cupoDisponible;
      assert.throws(() =>
        Compra.crear({
          id: 'cp_1',
          comprador,
          evento,
          tipoEntrada: tipoGeneral,
          cantidad: 0,
        }),
        ValidationError,
      );
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
    });

    it('falla con cantidad negativa sin cambiar cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const cupoAntes = tipoGeneral.cupoDisponible;
      assert.throws(() =>
        Compra.crear({
          id: 'cp_1',
          comprador,
          evento,
          tipoEntrada: tipoGeneral,
          cantidad: -1,
        }),
        ValidationError,
      );
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
    });

    it('falla con cantidad float sin cambiar cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const cupoAntes = tipoGeneral.cupoDisponible;
      assert.throws(() =>
        Compra.crear({
          id: 'cp_1',
          comprador,
          evento,
          tipoEntrada: tipoGeneral,
          cantidad: 1.5,
        }),
        ValidationError,
      );
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
    });

    it('falla con tipo de otro evento', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const { categoria, organizador } = crearFixture();
      const otroTipo = TipoEntrada.crear({
        id: 'te_otro',
        nombre: 'General',
        descripcion: 'Otro',
        precio: 5000,
        cupo: 50,
      });
      const otroEvento = Evento.crear({
        id: 'evt_otro',
        nombre: 'Otro',
        descripcion: 'Otro evento',
        categoria,
        fecha: sumarDias(ahora(), 20).toISOString(),
        tiposEntrada: [otroTipo],
        multimedia: [],
        organizador,
      });
      const cupoAntes = tipoGeneral.cupoDisponible;
      assert.throws(() =>
        Compra.crear({
          id: 'cp_1',
          comprador,
          evento,
          tipoEntrada: otroTipo,
          cantidad: 1,
        }),
        ValidationError,
      );
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
    });

    it('falla si comprador es el organizador', () => {
      const { organizador, evento, tipoGeneral } = crearFixture();
      const cupoAntes = tipoGeneral.cupoDisponible;
      assert.throws(() =>
        Compra.crear({
          id: 'cp_1',
          comprador: organizador,
          evento,
          tipoEntrada: tipoGeneral,
          cantidad: 1,
        }),
        ForbiddenError,
      );
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
    });

    it('falla si el evento ya se realizó', () => {
      const { comprador, tipoGeneral, categoria, organizador } = crearFixture();
      fijarAhora(sumarDias(ahora(), 40));
      const eventoPasado = Evento.crear({
        id: 'evt_pasado',
        nombre: 'Pasado',
        descripcion: 'Ya pasó',
        categoria,
        fecha: sumarDias(ahora(), -5).toISOString(),
        tiposEntrada: [tipoGeneral],
        multimedia: [],
        organizador,
      });
      const cupoAntes = tipoGeneral.cupoDisponible;
      assert.throws(() =>
        Compra.crear({
          id: 'cp_1',
          comprador,
          evento: eventoPasado,
          tipoEntrada: tipoGeneral,
          cantidad: 1,
        }),
        ConflictError,
      );
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
    });

    it('falla si cantidad > cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const cupoAntes = tipoGeneral.cupoDisponible;
      assert.throws(() =>
        Compra.crear({
          id: 'cp_1',
          comprador,
          evento,
          tipoEntrada: tipoGeneral,
          cantidad: 101,
        }),
        ConflictError,
      );
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
    });

    it('comprar exactamente el cupo funciona', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 100,
      });
      assert.equal(compra.estado, EstadoCompra.PENDIENTE);
      assert.equal(tipoGeneral.cupoDisponible, 0);
    });

    it('la siguiente compra de 1 falla si no hay cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 100,
      });
      assert.throws(() =>
        Compra.crear({
          id: 'cp_2',
          comprador,
          evento,
          tipoEntrada: tipoGeneral,
          cantidad: 1,
        }),
        ConflictError,
      );
    });
  });

  describe('tabla de transiciones exhaustiva (5x5)', () => {
    const estados = Object.values(EstadoCompra);

    const transicionesValidas = [
      { desde: EstadoCompra.PENDIENTE, hasta: EstadoCompra.CONFIRMADA, actor: 'comprador' },
      { desde: EstadoCompra.PENDIENTE, hasta: EstadoCompra.CANCELADA, actor: 'comprador' },
      { desde: EstadoCompra.CONFIRMADA, hasta: EstadoCompra.UTILIZADA, actor: 'organizador' },
      { desde: EstadoCompra.CONFIRMADA, hasta: EstadoCompra.CANCELADA, actor: 'comprador' },
    ];

    it('las 4 transiciones válidas funcionan con el actor correcto', () => {
      for (const t of transicionesValidas) {
        const { comprador, organizador, evento, tipoGeneral } = crearFixture();
        const compra = Compra.crear({
          id: 'cp_test',
          comprador,
          evento,
          tipoEntrada: tipoGeneral,
          cantidad: 1,
        });

        // Llevar la compra al estado "desde" si es necesario
        if (t.desde === EstadoCompra.CONFIRMADA) {
          compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
        }

        const actor = t.actor === 'comprador' ? comprador : organizador;
        compra.actualizarEstado(t.hasta, actor);
        assert.equal(
          compra.estado,
          t.hasta === EstadoCompra.CANCELADA && t.desde === EstadoCompra.CONFIRMADA
            ? EstadoCompra.REEMBOLSADA
            : t.hasta,
          `Transición ${t.desde} → ${t.hasta} con ${t.actor} debería funcionar`,
        );
      }
    });

    it('las 21 transiciones inválidas lanzan ConflictError', () => {
      for (const desde of estados) {
        for (const hasta of estados) {
          if (desde === hasta) continue;

          const esValida = transicionesValidas.some(
            (t) => t.desde === desde && t.hasta === hasta,
          );

          if (esValida) continue;

          const { comprador, organizador, evento, tipoGeneral } = crearFixture();
          const compra = Compra.crear({
            id: 'cp_test',
            comprador,
            evento,
            tipoEntrada: tipoGeneral,
            cantidad: 1,
          });

          // Llevar la compra al estado "desde"
          if (desde === EstadoCompra.CONFIRMADA) {
            compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
          } else if (desde === EstadoCompra.UTILIZADA) {
            compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
            compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador);
          } else if (desde === EstadoCompra.CANCELADA) {
            compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
          } else if (desde === EstadoCompra.REEMBOLSADA) {
            compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
            compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
          }

          assert.throws(
            () => compra.actualizarEstado(hasta, comprador),
            ConflictError,
            `${desde} → ${hasta} debería lanzar ConflictError`,
          );
        }
      }
    });
  });

  describe('actores incorrectos', () => {
    it('pagar con un tercero falla', () => {
      const { comprador, otroUsuario, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.CONFIRMADA, otroUsuario),
        ForbiddenError,
      );
    });

    it('pagar con el organizador falla', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.CONFIRMADA, organizador),
        ForbiddenError,
      );
    });

    it('usar con el comprador falla', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.UTILIZADA, comprador),
        ForbiddenError,
      );
    });

    it('usar con otro organizador falla', () => {
      const { comprador, otroOrganizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.UTILIZADA, otroOrganizador),
        ForbiddenError,
      );
    });

    it('cancelar con el organizador falla', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.CANCELADA, organizador),
        ForbiddenError,
      );
    });

    it('cancelar con un tercero falla', () => {
      const { comprador, otroUsuario, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.CANCELADA, otroUsuario),
        ForbiddenError,
      );
    });
  });

  describe('cancelar desde PENDIENTE', () => {
    it('llega a CANCELADA, no a REEMBOLSADA', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 2,
      });
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      assert.equal(compra.estado, EstadoCompra.CANCELADA);
    });

    it('devuelve el cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      assert.equal(tipoGeneral.cupoDisponible, 100);
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 2,
      });
      assert.equal(tipoGeneral.cupoDisponible, 98);
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      assert.equal(tipoGeneral.cupoDisponible, 100);
    });

    it('historial tiene 2 entradas', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      assert.equal(compra.historial.length, 2);
      assert.equal(compra.historial[0].estado, EstadoCompra.PENDIENTE);
      assert.equal(compra.historial[1].estado, EstadoCompra.CANCELADA);
    });
  });

  describe('cancelar desde CONFIRMADA', () => {
    it('llega a REEMBOLSADA automáticamente', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      assert.equal(compra.estado, EstadoCompra.REEMBOLSADA);
    });

    it('devuelve el cupo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      assert.equal(tipoGeneral.cupoDisponible, 100);
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 2,
      });
      assert.equal(tipoGeneral.cupoDisponible, 98);
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      assert.equal(tipoGeneral.cupoDisponible, 100);
    });

    it('historial tiene CANCELADA (quién=comprador) y REEMBOLSADA (quién=SISTEMA)', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      assert.equal(compra.historial.length, 4);
      assert.equal(compra.historial[2].estado, EstadoCompra.CANCELADA);
      assert.equal(compra.historial[2].quien.id, comprador.id);
      assert.equal(compra.historial[3].estado, EstadoCompra.REEMBOLSADA);
      assert.equal(compra.historial[3].quien.id, SISTEMA.id);
    });
  });

  describe('cancelar UTILIZADA', () => {
    it('falla con ConflictError', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador);
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.CANCELADA, comprador),
        ConflictError,
      );
    });
  });

  describe('cancelar evento ya realizado', () => {
    it('falla con ConflictError', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      fijarAhora(sumarDias(evento.fecha, 1));
      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.CANCELADA, comprador),
        ConflictError,
      );
    });
  });

  describe('transición fallida no deja rastros', () => {
    it('no cambia estado, cupo ni historial', () => {
      const { comprador, otroUsuario, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 2,
      });
      const estadoAntes = compra.estado;
      const cupoAntes = tipoGeneral.cupoDisponible;
      const historialAntes = compra.historial.length;

      assert.throws(
        () => compra.actualizarEstado(EstadoCompra.CONFIRMADA, otroUsuario),
        ForbiddenError,
      );

      assert.equal(compra.estado, estadoAntes);
      assert.equal(tipoGeneral.cupoDisponible, cupoAntes);
      assert.equal(compra.historial.length, historialAntes);
    });
  });

  describe('diasParaEvento', () => {
    it('devuelve número solo si CONFIRMADA', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.equal(compra.diasParaEvento(), null);
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      assert.ok(typeof compra.diasParaEvento() === 'number');
    });

    it('devuelve null en otros estados', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador);
      assert.equal(compra.diasParaEvento(), null);
    });

    it('devuelve 0 el mismo día del evento', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      fijarAhora(evento.fecha);
      assert.equal(compra.diasParaEvento(), 0);
    });

    it('nunca es negativo', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      fijarAhora(sumarDias(evento.fecha, 1));
      assert.equal(compra.diasParaEvento(), 0);
    });
  });

  describe('paraRespuesta', () => {
    it('no contiene email, contraseña ni hash', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const resp = compra.paraRespuesta();
      assert.equal(resp.comprador.email, undefined);
      assert.equal(resp.comprador.contrasena, undefined);
      assert.equal(resp.comprador.hash, undefined);
    });

    it('contiene los campos esperados', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 2,
      });
      const resp = compra.paraRespuesta();
      assert.equal(resp.id, 'cp_1');
      assert.equal(resp.estado, EstadoCompra.PENDIENTE);
      assert.equal(resp.evento.id, evento.id);
      assert.equal(resp.tipoEntrada.nombre, tipoGeneral.nombre);
      assert.equal(resp.cantidad, 2);
      assert.equal(resp.total, 20000);
      assert.ok(resp.historial.length >= 1);
    });
  });

  describe('enviarMensaje', () => {
    it('inicializa mensajes como arreglo vacío', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.ok(Array.isArray(compra.mensajes));
      assert.equal(compra.mensajes.length, 0);
    });

    it('el comprador puede enviar un mensaje', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const mensaje = compra.enviarMensaje(comprador, 'Hola, consulta sobre la entrada');
      assert.equal(mensaje.texto, 'Hola, consulta sobre la entrada');
      assert.equal(mensaje.autor.id, comprador.id);
      assert.ok(mensaje.fechaHora instanceof Date);
      assert.equal(compra.mensajes.length, 1);
    });

    it('el organizador puede enviar un mensaje', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const mensaje = compra.enviarMensaje(organizador, 'Bienvenido al evento');
      assert.equal(mensaje.autor.id, organizador.id);
      assert.equal(compra.mensajes.length, 1);
    });

    it('un tercero no puede enviar mensaje', () => {
      const { comprador, otroUsuario, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.throws(
        () => compra.enviarMensaje(otroUsuario, 'No debo poder enviar'),
        ForbiddenError,
      );
      assert.equal(compra.mensajes.length, 0);
    });

    it('otro organizador no puede enviar mensaje', () => {
      const { comprador, otroOrganizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.throws(
        () => compra.enviarMensaje(otroOrganizador, 'No debo poder enviar'),
        ForbiddenError,
      );
    });

    it('el texto se limpia con trim', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const mensaje = compra.enviarMensaje(comprador, '  texto con espacios  ');
      assert.equal(mensaje.texto, 'texto con espacios');
    });

    it('texto vacío lanza ValidationError', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      assert.throws(
        () => compra.enviarMensaje(comprador, '   '),
        ValidationError,
      );
    });

    it('texto de 1001 caracteres lanza ValidationError', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const textoLargo = 'a'.repeat(1001);
      assert.throws(
        () => compra.enviarMensaje(comprador, textoLargo),
        ValidationError,
      );
    });

    it('texto de exactamente 1000 caracteres es válido', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const texto = 'a'.repeat(1000);
      const mensaje = compra.enviarMensaje(comprador, texto);
      assert.equal(mensaje.texto.length, 1000);
    });

    it('se puede enviar en estado PENDIENTE', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Mensaje PENDIENTE');
      assert.equal(compra.mensajes.length, 1);
    });

    it('se puede enviar en estado CONFIRMADA', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.enviarMensaje(comprador, 'Mensaje CONFIRMADA');
      assert.equal(compra.mensajes.length, 1);
    });

    it('se puede enviar en estado UTILIZADA', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador);
      compra.enviarMensaje(comprador, 'Mensaje UTILIZADA');
      assert.equal(compra.mensajes.length, 1);
    });

    it('se puede enviar en estado CANCELADA', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      compra.enviarMensaje(comprador, 'Mensaje CANCELADA');
      assert.equal(compra.mensajes.length, 1);
    });

    it('se puede enviar en estado REEMBOLSADA', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador);
      assert.equal(compra.estado, EstadoCompra.REEMBOLSADA);
      compra.enviarMensaje(comprador, 'Mensaje REEMBOLSADA');
      assert.equal(compra.mensajes.length, 1);
    });

    it('fechas estrictamente crecientes con fijarAhora', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });

      fijarAhora(new Date('2026-01-01T00:00:00Z'));
      const m1 = compra.enviarMensaje(comprador, 'Primer mensaje');

      // Sin avanzar el reloj, el segundo mensaje debe ser +1ms
      const m2 = compra.enviarMensaje(comprador, 'Segundo mensaje');
      assert.ok(m2.fechaHora.getTime() > m1.fechaHora.getTime());
      assert.equal(m2.fechaHora.getTime() - m1.fechaHora.getTime(), 1);
    });

    it('el ID del mensaje es único', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const m1 = compra.enviarMensaje(comprador, 'Uno');
      const m2 = compra.enviarMensaje(organizador, 'Dos');
      assert.notEqual(m1.id, m2.id);
    });

    it('enviar mensaje no cambia estado ni historial', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      const estadoAntes = compra.estado;
      const historialAntes = compra.historial.length;
      compra.enviarMensaje(comprador, 'Sin efecto');
      assert.equal(compra.estado, estadoAntes);
      assert.equal(compra.historial.length, historialAntes);
    });
  });

  describe('leerMensajes', () => {
    it('el comprador puede leer mensajes', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Hola');
      const mensajes = compra.leerMensajes(comprador);
      assert.equal(mensajes.length, 1);
    });

    it('el organizador puede leer mensajes', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Hola');
      const mensajes = compra.leerMensajes(organizador);
      assert.equal(mensajes.length, 1);
    });

    it('un tercero no puede leer mensajes', () => {
      const { comprador, otroUsuario, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Secreto');
      assert.throws(
        () => compra.leerMensajes(otroUsuario),
        ForbiddenError,
      );
    });

    it('sin desde devuelve todos los mensajes', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Uno');
      compra.enviarMensaje(organizador, 'Dos');
      compra.enviarMensaje(comprador, 'Tres');
      const mensajes = compra.leerMensajes(comprador);
      assert.equal(mensajes.length, 3);
    });

    it('con desde devuelve solo mensajes estrictamente posteriores', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Uno');
      const fechaDesde = compra.mensajes[0].fechaHora;
      compra.enviarMensaje(organizador, 'Dos');
      compra.enviarMensaje(comprador, 'Tres');

      const mensajes = compra.leerMensajes(comprador, fechaDesde);
      assert.equal(mensajes.length, 2);
      assert.equal(mensajes[0].texto, 'Dos');
      assert.equal(mensajes[1].texto, 'Tres');
    });

    it('los mensajes están ordenados cronológicamente', () => {
      const { comprador, organizador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(organizador, 'Organizador primero');
      compra.enviarMensaje(comprador, 'Comprador segundo');
      const mensajes = compra.leerMensajes(comprador);
      assert.equal(mensajes[0].autor.id, organizador.id);
      assert.equal(mensajes[1].autor.id, comprador.id);
    });

    it('leer sin desde ni desde devuelve todos', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Solo uno');
      const mensajes = compra.leerMensajes(comprador, undefined);
      assert.equal(mensajes.length, 1);
    });

    it('leer con desde después del último devuelve vacío', () => {
      const { comprador, evento, tipoGeneral } = crearFixture();
      const compra = Compra.crear({
        id: 'cp_1',
        comprador,
        evento,
        tipoEntrada: tipoGeneral,
        cantidad: 1,
      });
      compra.enviarMensaje(comprador, 'Ultimo');
      const ultimo = compra.mensajes[0].fechaHora;
      const desdeFuturo = new Date(ultimo.getTime() + 1000);
      const mensajes = compra.leerMensajes(comprador, desdeFuturo);
      assert.equal(mensajes.length, 0);
    });
  });
});
