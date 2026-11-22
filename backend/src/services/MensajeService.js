import { NotFoundError } from '../domain/errors.js';

class MensajeService {
  constructor({ compraRepository }) {
    this.compraRepository = compraRepository;
  }

  enviar(compraId, usuario, texto) {
    const compra = this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('La compra no existe.');
    }

    const mensaje = compra.enviarMensaje(usuario, texto);
    this.compraRepository.guardar(compra);
    return mensaje;
  }

  listar(compraId, usuario, desde) {
    const compra = this.compraRepository.buscarPorId(compraId);
    if (!compra) {
      throw new NotFoundError('La compra no existe.');
    }

    return compra.leerMensajes(usuario, desde);
  }
}

export { MensajeService };
