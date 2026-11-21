class Categoria {
  constructor({ id, nombre, descripcion }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }

  static crear({ id, nombre, descripcion }) {
    return new Categoria({ id, nombre, descripcion });
  }
}

export { Categoria };
