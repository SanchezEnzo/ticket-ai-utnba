import { NotFoundError } from '../domain/errors.js';
import { Resenia } from '../domain/Resenia.js';

class ReseniaService {
  constructor({ reseniaRepository, compraRepository, eventoRepository }) {
    this._reseniaRepository = reseniaRepository;
    this._compraRepository = compraRepository;
    this._eventoRepository = eventoRepository;
  }

  crear(eventoId, usuario, { puntaje, comentario }) {
    const evento = this._eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado.');
    }

    const compras = this._compraRepository.listarPorComprador(usuario.id).filter(
      (c) => c.evento.id === eventoId
    );

    const reseniaPrevia = this._reseniaRepository.buscarPorCompradorYEvento(
      usuario.id,
      eventoId
    );

    const resenia = Resenia.crear({
      id: undefined,
      comprador: usuario,
      evento,
      puntaje,
      comentario,
      compras,
      reseniaPrevia,
    });

    return this._reseniaRepository.guardar(resenia);
  }

  listarDelOrganizadorDe(eventoId) {
    const evento = this._eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado.');
    }

    const resenias = this._reseniaRepository.listarPorOrganizador(evento.organizador.id);
    return [...resenias].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );
  }

  puntajeDelOrganizador(organizadorId) {
    const resenias = this._reseniaRepository.listarPorOrganizador(organizadorId);
    return Resenia.promedio(resenias);
  }

  puntajesDeOrganizadores(organizadorIds) {
    const mapa = new Map();
    for (const id of organizadorIds) {
      mapa.set(id, this.puntajeDelOrganizador(id));
    }
    return mapa;
  }
}

export { ReseniaService };
