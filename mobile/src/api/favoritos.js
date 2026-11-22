import { request } from './client.js';

/**
 * Lista los eventos favoritos del usuario autenticado.
 * @param {string} token
 * @returns {Promise<Array>} Lista de eventos favoritos
 */
export function listarFavoritos(token) {
  return request('GET', '/favoritos', { token });
}

/**
 * Marca un evento como favorito. Responde 204 sin cuerpo.
 * @param {string} eventoId
 * @param {string} token
 * @returns {Promise<null>}
 */
export function marcarFavorito(eventoId, token) {
  return request('PUT', `/favoritos/${eventoId}`, { token });
}

/**
 * Quita un evento de los favoritos. Responde 204 sin cuerpo.
 * @param {string} eventoId
 * @param {string} token
 * @returns {Promise<null>}
 */
export function quitarFavorito(eventoId, token) {
  return request('DELETE', `/favoritos/${eventoId}`, { token });
}
