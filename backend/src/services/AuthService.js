import { UnauthorizedError } from '../domain/errors.js';

class AuthService {
  constructor({ usuarioRepository, sesionService }) {
    this._usuarioRepository = usuarioRepository;
    this._sesionService = sesionService;
  }

  login(email, password) {
    const usuario = this._usuarioRepository.buscarPorEmail(email);
    if (!usuario || !usuario.verificarPassword(password)) {
      throw new UnauthorizedError('Email o contraseña incorrectos.');
    }

    const token = this._sesionService.crearToken(usuario.id);

    return {
      token,
      usuario: usuario.sinPassword(),
    };
  }
}

export { AuthService };
