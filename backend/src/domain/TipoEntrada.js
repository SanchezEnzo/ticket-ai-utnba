import { ValidationError } from './errors.js';

class TipoEntrada {
  constructor({ id, nombre, descripcion, precio, cupo }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.cupo = cupo;
    this.cupoDisponible = cupo;
  }

  static crear({ id, nombre, descripcion, precio, cupo }) {
    if (!nombre || !nombre.trim()) {
      throw new ValidationError('El nombre del tipo de entrada no puede estar vacío.');
    }

    if (typeof precio !== 'number' || precio < 0) {
      throw new ValidationError('El precio debe ser un número mayor o igual a 0.');
    }

    if (!Number.isInteger(cupo) || cupo <= 0) {
      throw new ValidationError('El cupo debe ser un entero mayor a 0.');
    }

    return new TipoEntrada({ id, nombre: nombre.trim(), descripcion, precio, cupo });
  }

  hayCupoPara(cantidad) {
    return cantidad <= this.cupoDisponible;
  }

  reservar(cantidad) {
    this._validarCantidad(cantidad);
    if (!this.hayCupoPara(cantidad)) {
      throw new ValidationError('No hay cupo disponible para la cantidad solicitada.');
    }
    this.cupoDisponible -= cantidad;
  }

  liberar(cantidad) {
    this._validarCantidad(cantidad);
    if (this.cupoDisponible + cantidad > this.cupo) {
      throw new ValidationError('No se puede liberar más cupo del total.');
    }
    this.cupoDisponible += cantidad;
  }

  _validarCantidad(cantidad) {
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ValidationError('La cantidad debe ser un entero mayor o igual a 1.');
    }
  }
}

export { TipoEntrada };
