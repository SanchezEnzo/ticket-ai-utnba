class EventoRepository {
  constructor() {
    this._store = new Map();
    this._siguienteId = 1;
    this._siguienteTipoEntradaId = 1;
  }

  guardar(evento) {
    if (!evento.id) {
      evento.id = `evt_${this._siguienteId++}`;
    }
    for (const te of evento.tiposEntrada) {
      if (!te.id) {
        te.id = `te_${this._siguienteTipoEntradaId++}`;
      }
    }
    this._store.set(evento.id, evento);
  }

  buscarPorId(id) {
    return this._store.get(id) || null;
  }

  listar() {
    return [...this._store.values()];
  }
}

export { EventoRepository };
