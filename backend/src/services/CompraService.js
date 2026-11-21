import { NotFoundError, ForbiddenError } from '../domain/errors.js';
import { EstadoCompra, Compra } from '../domain/Compra.js';

class CompraService {
  constructor({ compraRepository, eventoRepository }) {
    this.compraRepository = compraRepository;
    this.eventoRepository = eventoRepository;
  }

  crear({ eventoId, tipoEntradaId, cantidad }, comprador) {
    const evento = this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('El evento no existe.');
    }

    const tipoEntrada = evento.tiposEntrada.find((te) => te.id === tipoEntradaId);
    if (!tipoEntrada) {
      throw new NotFoundError('El tipo de entrada no existe.');
    }

    const compra = Compra.crear({
      id: undefined,
      comprador,
      evento,
      tipoEntrada,
      cantidad,
    });

    return this.compraRepository.guardar(compra);
  }

  pagar(id, comprador) {
    const compra = this.compraRepository.buscarPorId(id);
    if (!compra) {
      throw new NotFoundError('La compra no existe.');
    }

    compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador);
    this.compraRepository.guardar(compra);
    this.eventoRepository.guardar(compra.evento);
    return compra;
  }

  usar(compraId, usuario) {
    const compra = this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('La compra no existe.');
    }

    compra.actualizarEstado(EstadoCompra.UTILIZADA, usuario);
    this.compraRepository.guardar(compra);
    this.eventoRepository.guardar(compra.evento);
    return compra;
  }

  cancelar(compraId, usuario) {
    const compra = this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('La compra no existe.');
    }

    compra.actualizarEstado(EstadoCompra.CANCELADA, usuario);
    this.compraRepository.guardar(compra);
    this.eventoRepository.guardar(compra.evento);
    return compra;
  }

  misCompras(comprador) {
    const compras = this.compraRepository.listarPorComprador(comprador.id);
    compras.sort((a, b) => b.historial[0].fechaHora - a.historial[0].fechaHora);
    return compras;
  }

  comprasDelEvento(eventoId, usuario) {
    const evento = this.eventoRepository.buscarPorId(eventoId);
    if (!evento) {
      throw new NotFoundError('El evento no existe.');
    }

    if (!evento.esOrganizadoPor(usuario)) {
      throw new ForbiddenError('Solo el organizador puede ver las compras de este evento.');
    }

    const compras = this.compraRepository.listarPorEvento(eventoId);
    compras.sort((a, b) => b.historial[0].fechaHora - a.historial[0].fechaHora);

    return { evento, compras };
  }
}

export { CompraService };
