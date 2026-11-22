class FavoritoController {
  constructor({ favoritoService }) {
    this._favoritoService = favoritoService;
  }

  listar = async (req, res, next) => {
    const eventos = this._favoritoService.listar(req.usuario);
    res.json(eventos);
  };

  marcar = async (req, res, next) => {
    const { eventoId } = req.validado.params;
    this._favoritoService.marcar(eventoId, req.usuario);
    res.status(204).send();
  };

  quitar = async (req, res, next) => {
    const { eventoId } = req.validado.params;
    this._favoritoService.quitar(eventoId, req.usuario);
    res.status(204).send();
  };
}

export { FavoritoController };
