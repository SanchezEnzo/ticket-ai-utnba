class UsuarioRepository {
  constructor() {
    this._store = new Map();
  }

  guardar(usuario) {
    this._store.set(usuario.id, usuario);
  }

  buscarPorId(id) {
    return this._store.get(id) || null;
  }

  buscarPorEmail(email) {
    for (const usuario of this._store.values()) {
      if (usuario.email === email) return usuario;
    }
    return null;
  }

  listar() {
    return [...this._store.values()];
  }
}

export { UsuarioRepository };
