class EventoController {
  constructor({ eventoService }) {
    this._eventoService = eventoService;
  }

  listarCategorias = (req, res, _next) => {
    const categorias = this._eventoService.listarCategorias();
    res.json(categorias);
  };

  detalleEvento = async (req, res, next) => {
    const { id } = req.validado.params;
    const evento = this._eventoService.buscarEventoPorId(id);
    res.json(evento.sinDetalles());
  };

  crearEvento = async (req, res, next) => {
    const datos = req.validado.body;
    const organizador = req.usuario;
    const evento = this._eventoService.crearEvento(datos, organizador);
    res.status(201).json(evento.sinDetalles());
  };

  listarEventos = async (req, res, next) => {
    const { q, categoria, orden } = req.validado.query;
    const eventos = this._eventoService.listarEventos({ q, categoria, orden });
    res.json(eventos.map((e) => e.sinDetalles()));
  };
}

export { EventoController };
