import { ValidationError } from './errors.js';
import { TipoEntrada } from './TipoEntrada.js';
import { ahora, parsearFecha } from './reloj.js';

class Evento {
  constructor({ id, nombre, descripcion, categoria, fecha, tiposEntrada, multimedia, organizador }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.fecha = fecha;
    this.tiposEntrada = tiposEntrada;
    this.multimedia = multimedia;
    this.organizador = organizador;
  }

  static crear({ id, nombre, descripcion, categoria, fecha, tiposEntrada, multimedia, organizador }) {
    if (!nombre || !nombre.trim()) {
      throw new ValidationError('El nombre del evento no puede estar vacío.');
    }

    if (!descripcion || !descripcion.trim()) {
      throw new ValidationError('La descripción del evento no puede estar vacía.');
    }

    const fechaParsed = parsearFecha(fecha);
    if (!fecha || isNaN(fechaParsed.getTime())) {
      throw new ValidationError('La fecha del evento no es válida.');
    }

    if (!tiposEntrada || tiposEntrada.length === 0) {
      throw new ValidationError('El evento debe tener al menos un tipo de entrada.');
    }

    const nombres = new Set();
    for (const te of tiposEntrada) {
      const nombreTe = te.nombre.trim();
      if (nombres.has(nombreTe)) {
        throw new ValidationError(`El tipo de entrada "${nombreTe}" está repetido.`);
      }
      nombres.add(nombreTe);
    }

    const multimediaArray = multimedia && multimedia.length > 0 ? multimedia : [];
    if (!Array.isArray(multimediaArray) || !multimediaArray.every((m) => typeof m === 'string')) {
      throw new ValidationError('La multimedia debe ser una lista de strings.');
    }

    return new Evento({
      id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria,
      fecha: fechaParsed,
      tiposEntrada,
      multimedia: multimediaArray,
      organizador,
    });
  }

  precioDesde() {
    return Math.min(...this.tiposEntrada.map((te) => te.precio));
  }

  tuPrecioEstaEntre(min, max) {
    const precio = this.precioDesde();
    return precio >= min && precio <= max;
  }

  yaSeRealizo() {
    return this.fecha < ahora();
  }

  esOrganizadoPor(usuario) {
    return this.organizador.id === usuario.id;
  }

  sinDetalles() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      categoria: {
        id: this.categoria.id,
        nombre: this.categoria.nombre,
      },
      fecha: this.fecha.toISOString(),
      multimedia: this.multimedia,
      organizador: {
        id: this.organizador.id,
        nombre: this.organizador.nombre,
        apellido: this.organizador.apellido,
      },
      tiposEntrada: this.tiposEntrada.map((te) => ({
        id: te.id,
        nombre: te.nombre,
        descripcion: te.descripcion,
        precio: te.precio,
        cupo: te.cupo,
        cupoDisponible: te.cupoDisponible,
      })),
      precioDesde: this.precioDesde(),
      puntajeOrganizador: null,
    };
  }
}

export { Evento };
