import { NotFoundError } from '../domain/errors.js';

class FavoritoService {
  constructor({ eventoRepository, usuarioRepository, reseniaService }) {
    this._eventoRepository = eventoRepository;
    this._usuarioRepository = usuarioRepository;
    this._reseniaService = reseniaService;
  }

  marcar(eventoId, usuario) {
    const evento = this._eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado.');
    }
    usuario.marcarFavorito(eventoId);
    this._usuarioRepository.guardar(usuario);
  }

  quitar(eventoId, usuario) {
    const evento = this._eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado.');
    }
    usuario.desmarcarFavorito(eventoId);
    this._usuarioRepository.guardar(usuario);
  }

  listar(usuario) {
    const favoritosIds = usuario.favoritos;
    const todos = this._eventoRepository.listar();
    const favoritos = todos.filter((e) => favoritosIds.includes(e.id));

    favoritos.sort((a, b) => {
      const diff = a.fecha.getTime() - b.fecha.getTime();
      if (diff !== 0) return diff;
      return a.nombre.localeCompare(b.nombre);
    });

    const organizadorIds = [...new Set(favoritos.map((e) => e.organizador.id))];
    const puntajes = this._reseniaService.puntajesDeOrganizadores(organizadorIds);

    return favoritos.map((evento) => {
      const puntaje = puntajes.get(evento.organizador.id);
      return evento.sinDetalles(puntaje);
    });
  }
}

export { FavoritoService };
