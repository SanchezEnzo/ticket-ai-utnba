class CompraRepository {
  constructor() {
    this._compras = new Map();
    this._siguienteId = 1;
  }

  guardar(compra) {
    if (!compra.id) {
      compra.id = `cp_${this._siguienteId++}`;
    }
    this._compras.set(compra.id, compra);
    return compra;
  }

  buscarPorId(id) {
    return this._compras.get(id) || null;
  }

  listarPorComprador(compradorId) {
    const resultado = [];
    for (const compra of this._compras.values()) {
      if (compra.comprador.id === compradorId) {
        resultado.push(compra);
      }
    }
    return resultado;
  }

  listarPorEvento(eventoId) {
    const resultado = [];
    for (const compra of this._compras.values()) {
      if (compra.evento.id === eventoId) {
        resultado.push(compra);
      }
    }
    return resultado;
  }
}

export { CompraRepository };
