import { Compra, EstadoCompra } from '../domain/Compra.js';
import { fijarAhora, restaurarReloj, ahora, sumarDias } from '../domain/reloj.js';

/**
 * Seed de compras de ejemplo.
 *
 * Crea compras de `comprador1` en los 5 estados posibles:
 * - PENDIENTE: evt_recital1, General, cantidad 1
 * - CONFIRMADA: evt_teatro1, General, cantidad 2
 * - UTILIZADA: evt_pasado1, General, cantidad 1 (con fijarAhora)
 * - CANCELADA (desde PENDIENTE): evt_festival1, Entrada, cantidad 1
 * - REEMBOLSADA (desde CONFIRMADA): evt_conferencia1, Online, cantidad 1
 *
 * El cupo queda consistente: las compras CANCELADA y REEMBOLSADA liberan
 * el cupo que reservaron.
 */
function seedCompras(compraRepository, eventoRepository, usuarioRepository) {
  const comprador1 = usuarioRepository.buscarPorId('comprador1');

  // 1. PENDIENTE: evt_recital1, General, cantidad 1
  const evtRecital1 = eventoRepository.buscarPorId('evt_recital1');
  const teRecital1General = evtRecital1.tiposEntrada.find((te) => te.nombre === 'General');
  const compraPendiente = Compra.crear({
    id: undefined,
    comprador: comprador1,
    evento: evtRecital1,
    tipoEntrada: teRecital1General,
    cantidad: 1,
  });
  compraRepository.guardar(compraPendiente);

  // 2. CONFIRMADA: evt_teatro1, General, cantidad 2
  const evtTeatro1 = eventoRepository.buscarPorId('evt_teatro1');
  const teTeatro1General = evtTeatro1.tiposEntrada.find((te) => te.nombre === 'General');
  const compraConfirmada = Compra.crear({
    id: undefined,
    comprador: comprador1,
    evento: evtTeatro1,
    tipoEntrada: teTeatro1General,
    cantidad: 2,
  });
  compraConfirmada.actualizarEstado(EstadoCompra.CONFIRMADA, comprador1);

  // Mensajes de ejemplo: intercambio entre comprador y organizador
  const organizadorTeatro = evtTeatro1.organizador;
  fijarAhora(sumarDias(ahora(), -2));
  compraConfirmada.enviarMensaje(comprador1, 'Hola! Quería confirmar que asistiré al evento.');
  compraConfirmada.enviarMensaje(organizadorTeatro, 'Perfecto! Las entradas están listas. Cualquier consulta, avisame.');
  compraConfirmada.enviarMensaje(comprador1, 'Genial, muchas gracias!');
  restaurarReloj();

  compraRepository.guardar(compraConfirmada);

  // 3. UTILIZADA: evt_pasado1, General, cantidad 1
  // Se fija el reloj un día antes del evento para poder crear y usar la compra
  const evtPasado1 = eventoRepository.buscarPorId('evt_pasado1');
  const tePasado1General = evtPasado1.tiposEntrada.find((te) => te.nombre === 'General');
  try {
    fijarAhora(sumarDias(evtPasado1.fecha, -1));
    const compraUtilizada = Compra.crear({
      id: undefined,
      comprador: comprador1,
      evento: evtPasado1,
      tipoEntrada: tePasado1General,
      cantidad: 1,
    });
    compraUtilizada.actualizarEstado(EstadoCompra.CONFIRMADA, comprador1);
    const organizadorPasado = evtPasado1.organizador;
    compraUtilizada.actualizarEstado(EstadoCompra.UTILIZADA, organizadorPasado);
    compraRepository.guardar(compraUtilizada);
  } finally {
    restaurarReloj();
  }

  // 4. CANCELADA (desde PENDIENTE): evt_deportes1, Popular, cantidad 1
  // evt_deportes1 es organizado por organizador1, no por comprador1
  const evtDeportes1 = eventoRepository.buscarPorId('evt_deportes1');
  const teDeportes1Popular = evtDeportes1.tiposEntrada.find((te) => te.nombre === 'Popular');
  const compraCancelada = Compra.crear({
    id: undefined,
    comprador: comprador1,
    evento: evtDeportes1,
    tipoEntrada: teDeportes1Popular,
    cantidad: 1,
  });
  compraCancelada.actualizarEstado(EstadoCompra.CANCELADA, comprador1);
  compraRepository.guardar(compraCancelada);

  // 5. REEMBOLSADA (desde CONFIRMADA): evt_conferencia1, Online, cantidad 1
  const evtConferencia1 = eventoRepository.buscarPorId('evt_conferencia1');
  const teConferencia1Online = evtConferencia1.tiposEntrada.find((te) => te.nombre === 'Online');
  const compraReembolsada = Compra.crear({
    id: undefined,
    comprador: comprador1,
    evento: evtConferencia1,
    tipoEntrada: teConferencia1Online,
    cantidad: 1,
  });
  compraReembolsada.actualizarEstado(EstadoCompra.CONFIRMADA, comprador1);
  compraReembolsada.actualizarEstado(EstadoCompra.CANCELADA, comprador1);

  // Mensaje de ejemplo en compra REEMBOLSADA
  const organizadorConferencia = evtConferencia1.organizador;
  fijarAhora(sumarDias(ahora(), -1));
  compraReembolsada.enviarMensaje(organizadorConferencia, 'Se te realizó el reembolso. Consultá tu cuenta bancaria.');
  restaurarReloj();

  compraRepository.guardar(compraReembolsada);
}

export { seedCompras };
