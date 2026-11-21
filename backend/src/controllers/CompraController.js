class CompraController {
  constructor({ compraService }) {
    this.compraService = compraService;
  }

  crear = (req, res) => {
    const { eventoId, tipoEntradaId, cantidad } = req.validado.body;
    const compra = this.compraService.crear(
      { eventoId, tipoEntradaId, cantidad },
      req.usuario,
    );
    res.status(201).json(compra.paraRespuesta());
  };

  pagar = (req, res) => {
    const { id } = req.validado.params;
    const compra = this.compraService.pagar(id, req.usuario);
    res.json(compra.paraRespuesta());
  };

  misCompras = (req, res) => {
    const compras = this.compraService.misCompras(req.usuario);
    res.json(compras.map((c) => c.paraRespuesta()));
  };

  usar = (req, res) => {
    const { id } = req.validado.params;
    const compra = this.compraService.usar(id, req.usuario);
    res.json(compra.paraRespuesta());
  };

  cancelar = (req, res) => {
    const { id } = req.validado.params;
    const compra = this.compraService.cancelar(id, req.usuario);
    res.json(compra.paraRespuesta());
  };
}

export { CompraController };
