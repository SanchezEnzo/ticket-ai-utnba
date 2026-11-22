import { NotFoundError, ValidationError } from '../domain/errors.js';
import { TipoEntrada } from '../domain/TipoEntrada.js';
import { Evento } from '../domain/Evento.js';
import { ahora, parsearFecha } from '../domain/reloj.js';

class EventoService {
  constructor({ eventoRepository, categoriaRepository, usuarioRepository, reseniaService }) {
    this._eventoRepository = eventoRepository;
    this._categoriaRepository = categoriaRepository;
    this._usuarioRepository = usuarioRepository;
    this._reseniaService = reseniaService;
  }

  listarCategorias() {
    return this._categoriaRepository.listar();
  }

  buscarEventoPorId(id) {
    const evento = this._eventoRepository.buscarPorId(id);
    if (!evento) {
      throw new NotFoundError('Evento no encontrado.');
    }
    return evento;
  }

  crearEvento({ nombre, descripcion, categoriaId, fecha, multimedia, tiposEntrada }, organizador) {
    const categoria = this._categoriaRepository.buscarPorId(categoriaId);
    if (!categoria) {
      throw new NotFoundError('Categoría no encontrada.');
    }

    const fechaParsed = parsearFecha(fecha);
    if (isNaN(fechaParsed.getTime())) {
      throw new ValidationError('La fecha del evento no es válida.');
    }

    if (fechaParsed < ahora()) {
      throw new ValidationError('La fecha del evento no puede ser una fecha pasada.');
    }

    const tiposEntradaCreados = tiposEntrada.map((te) =>
      TipoEntrada.crear({
        id: undefined,
        nombre: te.nombre,
        descripcion: te.descripcion,
        precio: te.precio,
        cupo: te.cupo,
      })
    );

    const evento = Evento.crear({
      id: undefined,
      nombre,
      descripcion,
      categoria,
      fecha: fechaParsed,
      tiposEntrada: tiposEntradaCreados,
      multimedia: multimedia || [],
      organizador,
    });

    this._eventoRepository.guardar(evento);

    return evento;
  }

  listarEventos({ q, categoria, orden }) {
    let eventos = this._eventoRepository.listar();

    // Excluir eventos ya realizados
    eventos = eventos.filter((e) => !e.yaSeRealizo());

    // Filtro por texto
    if (q && q.trim()) {
      const texto = q.trim().toLowerCase();
      eventos = eventos.filter(
        (e) =>
          e.nombre.toLowerCase().includes(texto) ||
          e.descripcion.toLowerCase().includes(texto)
      );
    }

    // Filtro por categoría
    if (categoria) {
      eventos = eventos.filter((e) => e.categoria.id === categoria);
    }

    // Calcular puntajes de organizadores
    const organizadorIds = [...new Set(eventos.map((e) => e.organizador.id))];
    const puntajesMap = this._reseniaService
      ? this._reseniaService.puntajesDeOrganizadores(organizadorIds)
      : new Map();

    // Orden
    if (orden === 'precio') {
      eventos.sort((a, b) => {
        const diff = a.precioDesde() - b.precioDesde();
        if (diff !== 0) return diff;
        return this._desempate(a, b);
      });
    } else if (orden === 'fecha') {
      eventos.sort((a, b) => {
        const diff = a.fecha.getTime() - b.fecha.getTime();
        if (diff !== 0) return diff;
        return this._desempate(a, b);
      });
    } else if (orden === 'puntaje') {
      eventos.sort((a, b) => {
        const puntajeA = puntajesMap.get(a.organizador.id);
        const puntajeB = puntajesMap.get(b.organizador.id);
        // null al final
        if (puntajeA === null && puntajeB === null) return this._desempate(a, b);
        if (puntajeA === null) return 1;
        if (puntajeB === null) return -1;
        // Mejor puntaje primero
        const diff = puntajeB - puntajeA;
        if (Math.abs(diff) > 1e-9) return diff;
        return this._desempate(a, b);
      });
    } else {
      // Sin orden: por fecha por defecto
      eventos.sort((a, b) => {
        const diff = a.fecha.getTime() - b.fecha.getTime();
        if (diff !== 0) return diff;
        return this._desempate(a, b);
      });
    }

    return { eventos, puntajesMap };
  }

  _desempate(a, b) {
    // Desempate: fecha ascendente, luego nombre
    const fechaDiff = a.fecha.getTime() - b.fecha.getTime();
    if (fechaDiff !== 0) return fechaDiff;
    return a.nombre.localeCompare(b.nombre);
  }
}

export { EventoService };
