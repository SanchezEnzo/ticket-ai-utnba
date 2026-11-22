class EventoController {
  constructor({ eventoService, compraService, reseniaService }) {
    this._eventoService = eventoService;
    this._compraService = compraService;
    this._reseniaService = reseniaService;
  }

  listarCategorias = (req, res, _next) => {
    const categorias = this._eventoService.listarCategorias();
    res.json(categorias);
  };

  detalleEvento = async (req, res, next) => {
    const { id } = req.validado.params;
    const evento = this._eventoService.buscarEventoPorId(id);
    const puntaje = this._reseniaService
      ? this._reseniaService.puntajeDelOrganizador(evento.organizador.id)
      : null;
    res.json(evento.sinDetalles(puntaje));
  };

  crearEvento = async (req, res, next) => {
    const datos = req.validado.body;
    const organizador = req.usuario;
    const evento = this._eventoService.crearEvento(datos, organizador);
    res.status(201).json(evento.sinDetalles());
  };

  listarEventos = async (req, res, next) => {
    const { q, categoria, orden } = req.validado.query;
    const { eventos, puntajesMap } = this._eventoService.listarEventos({ q, categoria, orden });
    res.json(eventos.map((e) => e.sinDetalles(puntajesMap.get(e.organizador.id))));
  };

  comprasDelEvento = async (req, res, next) => {
    const { id } = req.validado.params;
    const { evento, compras } = this._compraService.comprasDelEvento(id, req.usuario);
    res.json({
      evento: {
        id: evento.id,
        nombre: evento.nombre,
        fecha: evento.fecha.toISOString(),
        tiposEntrada: evento.tiposEntrada.map((te) => ({
          id: te.id,
          nombre: te.nombre,
          precio: te.precio,
          cupo: te.cupo,
          cupoDisponible: te.cupoDisponible,
        })),
      },
      compras: compras.map((c) => c.paraRespuesta()),
    });
  };
}

export { EventoController };
