class MensajeController {
  constructor({ mensajeService }) {
    this.mensajeService = mensajeService;
  }

  enviar = (req, res) => {
    const { id: compraId } = req.validado.params;
    const { texto } = req.validado.body;
    const mensaje = this.mensajeService.enviar(compraId, req.usuario, texto);
    res.status(201).json(this._mensajeParaRespuesta(mensaje));
  };

  listar = (req, res) => {
    const { id: compraId } = req.validado.params;
    const { desde } = req.validado.query;
    const mensajes = this.mensajeService.listar(compraId, req.usuario, desde);
    res.json(mensajes.map((m) => this._mensajeParaRespuesta(m)));
  };

  _mensajeParaRespuesta(mensaje) {
    return {
      id: mensaje.id,
      autor: {
        id: mensaje.autor.id,
        nombre: mensaje.autor.nombre,
      },
      texto: mensaje.texto,
      fechaHora: mensaje.fechaHora.toISOString(),
    };
  }
}

export { MensajeController };
