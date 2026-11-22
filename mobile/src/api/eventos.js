import { request } from './client.js';

/**
 * Lista eventos del catálogo con filtros opcionales.
 * @param {{ q?: string, categoria?: string, orden?: string }} filtros
 * @param {string} [token]
 * @returns {Promise<Array>} Lista de eventos
 */
export function listarEventos(filtros, token) {
  return request('GET', '/eventos', { query: filtros, token });
}

/**
 * Obtiene el detalle de un evento por ID.
 * @param {string} id
 * @param {string} [token]
 * @returns {Promise<Object>} Evento completo
 */
export function obtenerEvento(id, token) {
  return request('GET', `/eventos/${id}`, { token });
}

/**
 * Lista las categorías disponibles.
 * @param {string} [token]
 * @returns {Promise<Array>} Lista de categorías
 */
export function listarCategorias(token) {
  return request('GET', '/categorias', { token });
}

/**
 * Lista las reseñas del organizador de un evento.
 * @param {string} eventoId
 * @param {string} [token]
 * @returns {Promise<Array>} Lista de reseñas
 */
export function listarResenias(eventoId, token) {
  return request('GET', `/eventos/${eventoId}/resenias`, { token });
}
