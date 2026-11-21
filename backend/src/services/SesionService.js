import crypto from 'node:crypto';

class SesionService {
  constructor() {
    this._sesiones = new Map();
  }

  crearToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    this._sesiones.set(token, userId);
    return token;
  }

  obtenerUserIdPorToken(token) {
    return this._sesiones.get(token) || null;
  }
}

export { SesionService };
