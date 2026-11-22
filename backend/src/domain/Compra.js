import { ValidationError, ForbiddenError, ConflictError } from './errors.js';
import { ahora, diasCalendario } from './reloj.js';

const EstadoCompra = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  UTILIZADA: 'UTILIZADA',
  CANCELADA: 'CANCELADA',
  REEMBOLSADA: 'REEMBOLSADA',
};

const SISTEMA = { id: 'sistema', nombre: 'Sistema' };

function crearCambioEstadoCompra({ compra, estado, quien }) {
  return {
    compra,
    estado,
    quien,
    fechaHora: ahora(),
  };
}

// Tabla de transiciones: { desde → { a → { puede, condicion, efecto } } }
const TRANSICIONES = {
  [EstadoCompra.PENDIENTE]: {
    [EstadoCompra.CONFIRMADA]: {
      puede: (compra, usuario) => usuario.id === compra.comprador.id,
    },
    [EstadoCompra.CANCELADA]: {
      puede: (compra, usuario) => usuario.id === compra.comprador.id,
      condicion: (compra) => !compra.evento.yaSeRealizo(),
      efecto: (compra) => compra.tipoEntrada.liberar(compra.cantidad),
    },
  },
  [EstadoCompra.CONFIRMADA]: {
    [EstadoCompra.UTILIZADA]: {
      puede: (compra, usuario) => usuario.id === compra.evento.organizador.id,
    },
    [EstadoCompra.CANCELADA]: {
      puede: (compra, usuario) => usuario.id === compra.comprador.id,
      condicion: (compra) => !compra.evento.yaSeRealizo(),
      efecto: (compra) => compra.tipoEntrada.liberar(compra.cantidad),
    },
  },
  // UTILIZADA, CANCELADA, REEMBOLSADA no tienen salidas
  [EstadoCompra.UTILIZADA]: {},
  [EstadoCompra.CANCELADA]: {},
  [EstadoCompra.REEMBOLSADA]: {},
};

class Compra {
  constructor({ id, comprador, evento, tipoEntrada, cantidad, total, estado, historial, mensajes }) {
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.total = total;
    this.estado = estado;
    this.historial = historial;
    this.mensajes = mensajes || [];
  }

  static crear({ id, comprador, evento, tipoEntrada, cantidad }) {
    // Validar cantidad
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ValidationError('La cantidad debe ser un entero mayor o igual a 1.');
    }

    // Validar tipoEntrada pertenece al evento
    if (!evento.tiposEntrada.includes(tipoEntrada)) {
      throw new ValidationError('El tipo de entrada no pertenece al evento.');
    }

    // Validar comprador ≠ organizador
    if (comprador.id === evento.organizador.id) {
      throw new ForbiddenError('El organizador no puede comprar entradas de su propio evento.');
    }

    // Validar evento no ya realizado
    if (evento.yaSeRealizo()) {
      throw new ConflictError('No se pueden comprar entradas para un evento ya realizado.');
    }

    // Validar cupo disponible
    if (!tipoEntrada.hayCupoPara(cantidad)) {
      throw new ConflictError('No hay cupo disponible para la cantidad solicitada.');
    }

    // Reservar cupo
    tipoEntrada.reservar(cantidad);

    const total = tipoEntrada.precio * cantidad;
    const estado = EstadoCompra.PENDIENTE;
    const historial = [
      crearCambioEstadoCompra({ compra: null, estado, quien: comprador }),
    ];

    const compra = new Compra({
      id,
      comprador,
      evento,
      tipoEntrada,
      cantidad,
      total,
      estado,
      historial,
      mensajes: [],
    });

    // Actualizar referencia al objeto compra en el historial
    historial[0].compra = compra;

    return compra;
  }

  actualizarEstado(nuevoEstado, usuario) {
    const transiciones = TRANSICIONES[this.estado];
    const transicion = transiciones?.[nuevoEstado];

    // Validar que la transición exista
    if (!transicion) {
      throw new ConflictError(
        `No se puede cambiar de ${this.estado} a ${nuevoEstado}.`
      );
    }

    // Validar actor
    if (!transicion.puede(this, usuario)) {
      throw new ForbiddenError('No tienes permiso para realizar esta acción.');
    }

    // Validar condiciones
    if (transicion.condicion && !transicion.condicion(this)) {
      throw new ConflictError('No se puede realizar esta transición en este momento.');
    }

    // Guardar estado anterior para detectar CONFIRMADA → CANCELADA
    const estadoAnterior = this.estado;

    // Aplicar efectos
    if (transicion.efecto) {
      transicion.efecto(this);
    }

    // Cambiar estado
    this.estado = nuevoEstado;

    // Registrar en historial
    this.historial.push(
      crearCambioEstadoCompra({ compra: this, estado: nuevoEstado, quien: usuario })
    );

    // Si fue CONFIRMADA → CANCELADA, aplicar REEMBOLSADA automático con SISTEMA
    if (estadoAnterior === EstadoCompra.CONFIRMADA && nuevoEstado === EstadoCompra.CANCELADA) {
      this.estado = EstadoCompra.REEMBOLSADA;
      this.historial.push(
        crearCambioEstadoCompra({ compra: this, estado: EstadoCompra.REEMBOLSADA, quien: SISTEMA })
      );
    }
  }

  diasParaEvento() {
    if (this.estado !== EstadoCompra.CONFIRMADA) {
      return null;
    }
    return Math.max(0, diasCalendario(ahora(), this.evento.fecha));
  }

  _puedeAcceder(usuario) {
    return usuario.id === this.comprador.id || usuario.id === this.evento.organizador.id;
  }

  enviarMensaje(usuario, texto) {
    if (!this._puedeAcceder(usuario)) {
      throw new ForbiddenError('No tienes permiso para enviar mensajes en esta compra.');
    }

    const textoLimpiado = texto.trim();
    if (textoLimpiado.length < 1) {
      throw new ValidationError('El mensaje no puede estar vacío.');
    }
    if (textoLimpiado.length > 1000) {
      throw new ValidationError('El mensaje no puede exceder los 1000 caracteres.');
    }

    let fechaHora = ahora();
    if (this.mensajes.length > 0) {
      const ultimoMensaje = this.mensajes[this.mensajes.length - 1];
      if (fechaHora.getTime() <= ultimoMensaje.fechaHora.getTime()) {
        fechaHora = new Date(ultimoMensaje.fechaHora.getTime() + 1);
      }
    }

    const mensaje = new Mensaje({
      id: `msg-${this.id}-${this.mensajes.length + 1}`,
      autor: { id: usuario.id, nombre: usuario.nombre },
      texto: textoLimpiado,
      fechaHora,
    });

    this.mensajes.push(mensaje);
    return mensaje;
  }

  leerMensajes(usuario, desde) {
    if (!this._puedeAcceder(usuario)) {
      throw new ForbiddenError('No tienes permiso para leer mensajes de esta compra.');
    }

    let filtrados = this.mensajes;
    if (desde) {
      filtrados = this.mensajes.filter((m) => m.fechaHora.getTime() > desde.getTime());
    }

    return [...filtrados].sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());
  }

  paraRespuesta() {
    return {
      id: this.id,
      estado: this.estado,
      evento: {
        id: this.evento.id,
        nombre: this.evento.nombre,
        fecha: this.evento.fecha.toISOString(),
      },
      tipoEntrada: {
        id: this.tipoEntrada.id,
        nombre: this.tipoEntrada.nombre,
        precio: this.tipoEntrada.precio,
      },
      cantidad: this.cantidad,
      total: this.total,
      comprador: {
        id: this.comprador.id,
        nombre: this.comprador.nombre,
        apellido: this.comprador.apellido,
      },
      diasParaEvento: this.diasParaEvento(),
      historial: this.historial.map((entry) => ({
        estado: entry.estado,
        quien: {
          id: entry.quien.id,
          nombre: entry.quien.nombre,
        },
        fechaHora: entry.fechaHora.toISOString(),
      })),
    };
  }
}

class Mensaje {
  constructor({ id, autor, texto, fechaHora }) {
    this.id = id;
    this.autor = autor;
    this.texto = texto;
    this.fechaHora = fechaHora;
  }
}

export { EstadoCompra, SISTEMA, crearCambioEstadoCompra, Compra, Mensaje };
