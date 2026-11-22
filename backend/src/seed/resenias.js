import { Compra, EstadoCompra } from '../domain/Compra.js';
import { Resenia } from '../domain/Resenia.js';
import { fijarAhora, restaurarReloj, ahora, sumarDias } from '../domain/reloj.js';

/**
 * Seed de reseñas de ejemplo.
 *
 * Organizador A (organizador1): 3 reseñas en 2 eventos, de 2 usuarios distintos
 *   - evt_pasado1 (Concierto Pasado):
 *     - comprador1 → 4.5 ("Excelente show")
 *     - comprador2 → 3.5 ("Bueno, pero largo")
 *   - evt_recital1 (Rock en Vivo) — se usa un evento pasado para poder UTILIZAR:
 *     - comprador3 → 5 ("Increíble")
 *   Promedio: (4.5 + 3.5 + 5) / 3 = 4.3
 *
 * Organizador B (comprador1): 1 reseña en evt_festival1
 *   - organizador2 → 2 ("Muy malo")
 *   Promedio: 2.0
 *
 * Organizador sin reseñas (ambos1): 0 reseñas
 *   Promedio: null
 *
 * Se ejecuta después de seedCompras para que las compras ya existan.
 */
function seedResenias(reseniaRepository, compraRepository, eventoRepository, usuarioRepository) {
  const organizador1 = usuarioRepository.buscarPorId('organizador1');
  const comprador1 = usuarioRepository.buscarPorId('comprador1');
  const comprador2 = usuarioRepository.buscarPorId('comprador2');
  const comprador3 = usuarioRepository.buscarPorId('comprador3');
  const comprador1AsOrganizador = usuarioRepository.buscarPorId('comprador1');
  const organizador2 = usuarioRepository.buscarPorId('organizador2');

  // --- Reseñas de organizador1 ---

  // Reseña 1: comprador1 en evt_pasado1 (ya tiene compra UTILIZADA en seedCompras)
  const evtPasado1 = eventoRepository.buscarPorId('evt_pasado1');
  const comprasComprador1Pasado1 = compraRepository.listarPorComprador(comprador1.id).filter(
    (c) => c.evento.id === 'evt_pasado1'
  );
  const reseniaPrevia1 = reseniaRepository.buscarPorCompradorYEvento(comprador1.id, 'evt_pasado1');
  const resenia1 = Resenia.crear({
    id: undefined,
    comprador: comprador1,
    evento: evtPasado1,
    puntaje: 4.5,
    comentario: 'Excelente show',
    compras: comprasComprador1Pasado1,
    reseniaPrevia: reseniaPrevia1,
  });
  reseniaRepository.guardar(resenia1);

  // Reseña 2: comprador2 en evt_pasado1 — necesita compra UTILIZADA
  const tePasado1General = evtPasado1.tiposEntrada.find((te) => te.nombre === 'General');
  try {
    fijarAhora(sumarDias(evtPasado1.fecha, -1));
    const compraComprador2Pasado1 = Compra.crear({
      id: undefined,
      comprador: comprador2,
      evento: evtPasado1,
      tipoEntrada: tePasado1General,
      cantidad: 1,
    });
    compraComprador2Pasado1.actualizarEstado(EstadoCompra.CONFIRMADA, comprador2);
    compraComprador2Pasado1.actualizarEstado(EstadoCompra.UTILIZADA, organizador1);
    compraRepository.guardar(compraComprador2Pasado1);
  } finally {
    restaurarReloj();
  }
  const comprasComprador2Pasado1 = compraRepository.listarPorComprador(comprador2.id).filter(
    (c) => c.evento.id === 'evt_pasado1'
  );
  const reseniaPrevia2 = reseniaRepository.buscarPorCompradorYEvento(comprador2.id, 'evt_pasado1');
  const resenia2 = Resenia.crear({
    id: undefined,
    comprador: comprador2,
    evento: evtPasado1,
    puntaje: 3.5,
    comentario: 'Bueno, pero largo',
    compras: comprasComprador2Pasado1,
    reseniaPrevia: reseniaPrevia2,
  });
  reseniaRepository.guardar(resenia2);

  // Reseña 3: comprador3 en evt_recital1 — necesita compra UTILIZADA
  // evt_recital1 es futuro, así que fijamos el reloj para simular que ya pasó
  const evtRecital1 = eventoRepository.buscarPorId('evt_recital1');
  const teRecital1General = evtRecital1.tiposEntrada.find((te) => te.nombre === 'General');
  try {
    fijarAhora(sumarDias(evtRecital1.fecha, -1));
    const compraComprador3Recital1 = Compra.crear({
      id: undefined,
      comprador: comprador3,
      evento: evtRecital1,
      tipoEntrada: teRecital1General,
      cantidad: 1,
    });
    compraComprador3Recital1.actualizarEstado(EstadoCompra.CONFIRMADA, comprador3);
    compraComprador3Recital1.actualizarEstado(EstadoCompra.UTILIZADA, organizador1);
    compraRepository.guardar(compraComprador3Recital1);
  } finally {
    restaurarReloj();
  }
  const comprasComprador3Recital1 = compraRepository.listarPorComprador(comprador3.id).filter(
    (c) => c.evento.id === 'evt_recital1'
  );
  const reseniaPrevia3 = reseniaRepository.buscarPorCompradorYEvento(comprador3.id, 'evt_recital1');
  const resenia3 = Resenia.crear({
    id: undefined,
    comprador: comprador3,
    evento: evtRecital1,
    puntaje: 5,
    comentario: 'Increíble',
    compras: comprasComprador3Recital1,
    reseniaPrevia: reseniaPrevia3,
  });
  reseniaRepository.guardar(resenia3);

  // --- Reseñas de comprador1 (como organizador de evt_festival1) ---

  // Reseña 4: organizador2 en evt_festival1 — necesita compra UTILIZADA
  const evtFestival1 = eventoRepository.buscarPorId('evt_festival1');
  const teFestival1Entrada = evtFestival1.tiposEntrada.find((te) => te.nombre === 'Entrada');
  try {
    fijarAhora(sumarDias(evtFestival1.fecha, -1));
    const compraOrganizador2Festival1 = Compra.crear({
      id: undefined,
      comprador: organizador2,
      evento: evtFestival1,
      tipoEntrada: teFestival1Entrada,
      cantidad: 1,
    });
    compraOrganizador2Festival1.actualizarEstado(EstadoCompra.CONFIRMADA, organizador2);
    compraOrganizador2Festival1.actualizarEstado(EstadoCompra.UTILIZADA, comprador1AsOrganizador);
    compraRepository.guardar(compraOrganizador2Festival1);
  } finally {
    restaurarReloj();
  }
  const comprasOrganizador2Festival1 = compraRepository.listarPorComprador(organizador2.id).filter(
    (c) => c.evento.id === 'evt_festival1'
  );
  const reseniaPrevia4 = reseniaRepository.buscarPorCompradorYEvento(organizador2.id, 'evt_festival1');
  const resenia4 = Resenia.crear({
    id: undefined,
    comprador: organizador2,
    evento: evtFestival1,
    puntaje: 2,
    comentario: 'Muy malo',
    compras: comprasOrganizador2Festival1,
    reseniaPrevia: reseniaPrevia4,
  });
  reseniaRepository.guardar(resenia4);
}

// IDs exportados para que los tests los usen
const seedReseniaIds = {
  resenias: {
    comprador1Pasado1: 'res_1',
    comprador2Pasado1: 'res_2',
    comprador3Recital1: 'res_3',
    organizador2Festival1: 'res_4',
  },
};

export { seedResenias, seedReseniaIds };
