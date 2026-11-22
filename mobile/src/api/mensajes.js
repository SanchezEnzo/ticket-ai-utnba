import { request } from './client.js';

/**
 * Lista los mensajes de chat de una compra.
 * @param {string} compraId
 * @param {{ desde?: string }} [opts] - Opciones de consulta
 * @param {string} opts.desde - Fecha ISO 8601 para filtrar mensajes posteriores
 * @param {string} token
 * @returns {Promise<Array>} Lista de mensajes [{id, autor: {id, nombre, apellido}, texto, fechaHora}]
 */
export function listarMensajes(compraId, opts = {}, token) {
  const query = opts.desde ? { desde: opts.desde } : undefined;
  return request('GET', `/compras/${compraId}/mensajes`, { query, token });
}

/**
 * Envía un mensaje de chat para una compra.
 * @param {string} compraId
 * @param {string} texto - Contenido del mensaje
 * @param {string} token
 * @returns {Promise<Object>} El mensaje creado
 */
export function enviarMensaje(compraId, texto, token) {
  return request('POST', `/compras/${compraId}/mensajes`, { body: { texto }, token });
}
