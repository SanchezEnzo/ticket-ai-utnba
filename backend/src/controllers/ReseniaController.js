class ReseniaController {
  constructor({ reseniaService }) {
    this._reseniaService = reseniaService;
  }

  crear = async (req, res, next) => {
    const { id } = req.validado.params;
    const { puntaje, comentario } = req.validado.body;
    const usuario = req.usuario;
    const resenia = this._reseniaService.crear(id, usuario, { puntaje, comentario });
    res.status(201).json(resenia.paraRespuesta());
  };

  listar = async (req, res, next) => {
    const { id } = req.validado.params;
    const resenias = this._reseniaService.listarDelOrganizadorDe(id);
    res.json(resenias.map((r) => r.paraRespuesta()));
  };
}

export { ReseniaController };
