import { Categoria } from '../domain/Categoria.js';
import { TipoEntrada } from '../domain/TipoEntrada.js';
import { Evento } from '../domain/Evento.js';
import { ahora, sumarDias } from '../domain/reloj.js';

/**
 * Seed de categorías y eventos de ejemplo.
 *
 * Las fechas se calculan relativas a `ahora()` del reloj para que los tests
 * sean determinísticos.
 *
 * Exporta los IDs y nombres para que los tests los usen sin hardcodearlos.
 */

function diasDesdeAhora(dias) {
  return sumarDias(ahora(), dias).toISOString();
}

function seedCategorias(repositorio) {
  const categorias = [
    Categoria.crear({ id: 'cat_recital', nombre: 'Recitales', descripcion: 'Conciertos y música en vivo' }),
    Categoria.crear({ id: 'cat_teatro', nombre: 'Teatro', descripcion: 'Obras y espectáculos teatrales' }),
    Categoria.crear({ id: 'cat_festival', nombre: 'Festivales', descripcion: 'Festivales multigénero' }),
    Categoria.crear({ id: 'cat_conferencia', nombre: 'Conferencias', descripcion: 'Conferencias y charlas' }),
    Categoria.crear({ id: 'cat_deportes', nombre: 'Deportes', descripcion: 'Eventos deportivos' }),
  ];

  for (const c of categorias) {
    repositorio.guardar(c);
  }
}

function seedEventos(eventoRepo, categoriaRepo, usuarioRepo) {
  const organizador1 = usuarioRepo.buscarPorId('organizador1');
  const comprador1 = usuarioRepo.buscarPorId('comprador1');
  const ambos1 = usuarioRepo.buscarPorId('ambos1');

  const catRecital = categoriaRepo.buscarPorId('cat_recital');
  const catTeatro = categoriaRepo.buscarPorId('cat_teatro');
  const catFestival = categoriaRepo.buscarPorId('cat_festival');
  const catConferencia = categoriaRepo.buscarPorId('cat_conferencia');
  const catDeportes = categoriaRepo.buscarPorId('cat_deportes');

  const eventos = [
    // Evento 1: Recital futuro, organizador1, 3 tipos de entrada
    Evento.crear({
      id: 'evt_recital1',
      nombre: 'Rock en Vivo',
      descripcion: 'Una noche de rock con bandas locales',
      categoria: catRecital,
      fecha: diasDesdeAhora(30),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te1', nombre: 'General', descripcion: 'Piso', precio: 15000, cupo: 200 }),
        TipoEntrada.crear({ id: 'te2', nombre: 'Platea', descripcion: 'Primera fila', precio: 25000, cupo: 50 }),
        TipoEntrada.crear({ id: 'te3', nombre: 'VIP', descripcion: 'Backstage incluido', precio: 50000, cupo: 10 }),
      ],
      multimedia: ['https://ejemplo.com/rock.jpg'],
      organizador: organizador1,
    }),
    // Evento 2: Teatro futuro, organizador1 (segundo evento del mismo organizador)
    Evento.crear({
      id: 'evt_teatro1',
      nombre: 'Hamlet',
      descripcion: 'La obra clásica de Shakespeare',
      categoria: catTeatro,
      fecha: diasDesdeAhora(14),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te4', nombre: 'General', descripcion: 'Butaca', precio: 8000, cupo: 100 }),
      ],
      multimedia: [],
      organizador: organizador1,
    }),
    // Evento 3: Festival futuro, comprador1
    Evento.crear({
      id: 'evt_festival1',
      nombre: 'Festival de Verano',
      descripcion: 'Música, comida y diversión al aire libre',
      categoria: catFestival,
      fecha: diasDesdeAhora(60),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te5', nombre: 'Entrada', descripcion: 'Acceso general', precio: 30000, cupo: 500 }),
        TipoEntrada.crear({ id: 'te6', nombre: 'Premium', descripcion: 'Zona premium', precio: 60000, cupo: 50 }),
      ],
      multimedia: ['https://ejemplo.com/festival.jpg'],
      organizador: comprador1,
    }),
    // Evento 4: Conferencia futura, ambos1
    Evento.crear({
      id: 'evt_conferencia1',
      nombre: 'Tech Conference 2027',
      descripcion: 'Las últimas tendencias en tecnología',
      categoria: catConferencia,
      fecha: diasDesdeAhora(45),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te7', nombre: 'Online', descripcion: 'Transmisión en vivo', precio: 5000, cupo: 1000 }),
        TipoEntrada.crear({ id: 'te8', nombre: 'Presencial', descripcion: 'Asistencia en persona', precio: 20000, cupo: 200 }),
      ],
      multimedia: [],
      organizador: ambos1,
    }),
    // Evento 5: Deportes futuro, organizador1
    Evento.crear({
      id: 'evt_deportes1',
      nombre: 'Final de Fútbol',
      descripcion: 'El partido más esperado del año',
      categoria: catDeportes,
      fecha: diasDesdeAhora(90),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te9', nombre: 'Popular', descripcion: 'Tribuna popular', precio: 5000, cupo: 300 }),
        TipoEntrada.crear({ id: 'te10', nombre: 'Preferencial', descripcion: 'Cama preferencial', precio: 12000, cupo: 150 }),
      ],
      multimedia: ['https://ejemplo.com/futbol.jpg'],
      organizador: organizador1,
    }),
    // Evento 6: Recital futuro cercano, comprador1
    Evento.crear({
      id: 'evt_recital2',
      nombre: 'Jazz en la Noche',
      descripcion: 'Una velada de jazz íntimo',
      categoria: catRecital,
      fecha: diasDesdeAhora(7),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te11', nombre: 'General', descripcion: 'Mesa', precio: 10000, cupo: 80 }),
      ],
      multimedia: [],
      organizador: comprador1,
    }),
    // Evento 7: Teatro futuro, ambos1
    Evento.crear({
      id: 'evt_teatro2',
      nombre: 'Comedia Musical',
      descripcion: 'Risas y música en escena',
      categoria: catTeatro,
      fecha: diasDesdeAhora(21),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te12', nombre: 'General', descripcion: 'Butaca', precio: 12000, cupo: 120 }),
      ],
      multimedia: [],
      organizador: ambos1,
    }),
    // Evento 8: Conferencia futura, organizador1
    Evento.crear({
      id: 'evt_conferencia2',
      nombre: 'AI Summit',
      descripcion: 'Inteligencia artificial y futuro',
      categoria: catConferencia,
      fecha: diasDesdeAhora(100),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te13', nombre: 'Early Bird', descripcion: 'Precio anticipado', precio: 15000, cupo: 100 }),
        TipoEntrada.crear({ id: 'te14', nombre: 'Normal', descripcion: 'Precio regular', precio: 25000, cupo: 200 }),
      ],
      multimedia: ['https://ejemplo.com/ai.jpg'],
      organizador: organizador1,
    }),
    // Evento 9: Evento ya realizado (fecha pasada)
    Evento.crear({
      id: 'evt_pasado1',
      nombre: 'Concierto Pasado',
      descripcion: 'Este evento ya se realizó',
      categoria: catRecital,
      fecha: diasDesdeAhora(-5),
      tiposEntrada: [
        TipoEntrada.crear({ id: 'te15', nombre: 'General', descripcion: 'Piso', precio: 10000, cupo: 100 }),
      ],
      multimedia: [],
      organizador: organizador1,
    }),
  ];

  for (const e of eventos) {
    eventoRepo.guardar(e);
  }
}

// IDs exportados para que los tests los usen
const seedIds = {
  categorias: {
    recital: 'cat_recital',
    teatro: 'cat_teatro',
    festival: 'cat_festival',
    conferencia: 'cat_conferencia',
    deportes: 'cat_deportes',
  },
  eventos: {
    rockEnVivo: 'evt_recital1',
    hamlet: 'evt_teatro1',
    festivalVerano: 'evt_festival1',
    techConference: 'evt_conferencia1',
    finalFutbol: 'evt_deportes1',
    jazzNoche: 'evt_recital2',
    comediaMusical: 'evt_teatro2',
    aiSummit: 'evt_conferencia2',
    conciertoPasado: 'evt_pasado1',
  },
};

function seedFavoritos(usuarioRepo) {
  const comprador1 = usuarioRepo.buscarPorId('comprador1');
  if (comprador1) {
    comprador1.marcarFavorito('evt_recital1');
    comprador1.marcarFavorito('evt_teatro1');
    comprador1.marcarFavorito('evt_pasado1');
    usuarioRepo.guardar(comprador1);
  }
}

export { seedCategorias, seedEventos, seedFavoritos, seedIds };
