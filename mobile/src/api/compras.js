import { request } from './client.js';

/**
 * Crea una nueva compra de entradas.
 * @param {{ eventoId: string, tipoEntradaId: string, cantidad: number }} datos
 * @param {string} token
 * @returns {Promise<Object>} La compra creada con estado PENDIENTE
 */
export function crearCompra(datos, token) {
  return request('POST', '/compras', { body: datos, token });
}

/**
 * Paga una compra PENDIENTE, pasándola a CONFIRMADA.
 * @param {string} id
 * @param {string} token
 * @returns {Promise<Object>} La compra actualizada
 */
export function pagarCompra(id, token) {
  return request('POST', `/compras/${id}/pago`, { token });
}

/**
 * Lista las compras del usuario autenticado.
 * @param {string} token
 * @returns {Promise<Array>} Lista de compras
 */
export function listarMisCompras(token) {
  return request('GET', '/compras', { token });
}

/**
 * Marca una compra CONFIRMADA como utilizada.
 * @param {string} id
 * @param {string} token
 * @returns {Promise<Object>} La compra actualizada
 */
export function marcarUtilizada(id, token) {
  return request('POST', `/compras/${id}/uso`, { token });
}

/**
 * Cancela una compra PENDIENTE o CONFIRMADA.
 * Si está CONFIRMADA, se reembolsa automáticamente.
 * @param {string} id
 * @param {string} token
 * @returns {Promise<Object>} La compra actualizada
 */
export function cancelarCompra(id, token) {
  return request('POST', `/compras/${id}/cancelacion`, { token });
}
