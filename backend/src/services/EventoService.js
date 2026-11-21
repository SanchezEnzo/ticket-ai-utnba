import { NotFoundError, ValidationError } from '../domain/errors.js';
import { TipoEntrada } from '../domain/TipoEntrada.js';
import { Evento } from '../domain/Evento.js';
import { ahora, parsearFecha } from '../domain/reloj.js';

class EventoService {
  constructor({ eventoRepository, categoriaRepository, usuarioRepository }) {
    this._eventoRepository = eventoRepository;
    this._categoriaRepository = categoriaRepository;
    this._usuarioRepository = usuarioRepository;
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
        // Todos tienen puntaje null, se ordena por desempate
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

    return eventos;
  }

  _desempate(a, b) {
    // Desempate: fecha ascendente, luego nombre
    const fechaDiff = a.fecha.getTime() - b.fecha.getTime();
    if (fechaDiff !== 0) return fechaDiff;
    return a.nombre.localeCompare(b.nombre);
  }
}

export { EventoService };
