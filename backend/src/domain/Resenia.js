import { ValidationError, ForbiddenError, ConflictError } from './errors.js';
import { EstadoCompra } from './Compra.js';
import { ahora } from './reloj.js';

class Resenia {
  constructor({ id, comprador, evento, puntaje, comentario, fecha }) {
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.puntaje = puntaje;
    this.comentario = comentario;
    this.fecha = fecha;
  }

  static crear({ id, comprador, evento, puntaje, comentario, compras, reseniaPrevia }) {
    // Validar puntaje: entre 1 y 5, múltiplo de 0.5
    if (typeof puntaje !== 'number' || puntaje < 1 || puntaje > 5) {
      throw new ValidationError('El puntaje debe ser un número entre 1 y 5.');
    }
    if (Math.abs(puntaje * 2 - Math.round(puntaje * 2)) > 1e-9) {
      throw new ValidationError('El puntaje debe ser múltiplo de 0.5.');
    }

    // Validar comentario: no vacío, máximo 1000 caracteres
    if (typeof comentario !== 'string' || !comentario.trim()) {
      throw new ValidationError('El comentario no puede estar vacío.');
    }
    if (comentario.trim().length > 1000) {
      throw new ValidationError('El comentario no puede exceder los 1000 caracteres.');
    }

    // Validar que tenga al menos una compra UTILIZADA en ese evento
    if (!compras || compras.length === 0) {
      throw new ForbiddenError('Debes tener al menos una compra utilizada en este evento para dejar una reseña.');
    }
    const tieneUtilizada = compras.some(
      (c) => c.estado === EstadoCompra.UTILIZADA
    );
    if (!tieneUtilizada) {
      throw new ForbiddenError('Debes tener al menos una compra utilizada en este evento para dejar una reseña.');
    }

    // Validar que no haya reseña previa de este comprador en este evento
    if (reseniaPrevia) {
      throw new ConflictError('Ya dejaste una reseña para este evento.');
    }

    const fecha = ahora();

    return new Resenia({
      id,
      comprador,
      evento,
      puntaje,
      comentario: comentario.trim(),
      fecha,
    });
  }

  static promedio(resenias) {
    if (!resenias || resenias.length === 0) {
      return null;
    }
    const suma = resenias.reduce((acc, r) => acc + r.puntaje, 0);
    return Math.round((suma / resenias.length) * 10) / 10;
  }

  paraRespuesta() {
    return {
      id: this.id,
      puntaje: this.puntaje,
      comentario: this.comentario,
      fecha: this.fecha.toISOString(),
      autor: {
        id: this.comprador.id,
        nombre: this.comprador.nombre,
        apellido: this.comprador.apellido,
      },
      evento: {
        id: this.evento.id,
        nombre: this.evento.nombre,
        fecha: this.evento.fecha.toISOString(),
      },
    };
  }
}

export { Resenia };
