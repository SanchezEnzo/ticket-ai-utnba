class ReseniaRepository {
  constructor() {
    this._resenias = new Map();
    this._siguienteId = 1;
  }

  guardar(resenia) {
    if (!resenia.id) {
      resenia.id = `res_${this._siguienteId++}`;
    }
    this._resenias.set(resenia.id, resenia);
    return resenia;
  }

  buscarPorCompradorYEvento(compradorId, eventoId) {
    for (const resenia of this._resenias.values()) {
      if (resenia.comprador.id === compradorId && resenia.evento.id === eventoId) {
        return resenia;
      }
    }
    return null;
  }

  listarPorOrganizador(organizadorId) {
    const resultado = [];
    for (const resenia of this._resenias.values()) {
      if (resenia.evento.organizador.id === organizadorId) {
        resultado.push(resenia);
      }
    }
    return resultado;
  }
}

export { ReseniaRepository };
