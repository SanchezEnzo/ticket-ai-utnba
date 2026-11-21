class CategoriaRepository {
  constructor() {
    this._store = new Map();
    this._siguienteId = 1;
  }

  guardar(categoria) {
    if (!categoria.id) {
      categoria.id = `cat_${this._siguienteId++}`;
    }
    this._store.set(categoria.id, categoria);
  }

  buscarPorId(id) {
    return this._store.get(id) || null;
  }

  listar() {
    return [...this._store.values()];
  }
}

export { CategoriaRepository };
