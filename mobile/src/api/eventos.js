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

/**
 * Crea un nuevo evento.
 * @param {{ nombre: string, descripcion: string, categoriaId: string, fecha: string, multimedia?: string[], tiposEntrada: Array<{nombre: string, descripcion: string, precio: number, cupo: number}> }} datos
 * @param {string} token
 * @returns {Promise<Object>} El evento creado
 */
export function crearEvento(datos, token) {
  return request('POST', '/eventos', { body: datos, token });
}

/**
 * Lista las compras de un evento (vista del organizador).
 * @param {string} eventoId
 * @param {string} token
 * @returns {Promise<Object>} Resumen con entradas disponibles y lista de compras
 */
export function listarComprasDelEvento(eventoId, token) {
  return request('GET', `/eventos/${eventoId}/compras`, { token });
}

/**
 * Crea una reseña para un evento.
 * @param {string} eventoId
 * @param {{ puntaje: number, comentario: string }} datos - puntaje entre 1 y 5 (paso 0.5)
 * @param {string} token
 * @returns {Promise<Object>} La reseña creada
 */
export function crearResenia(eventoId, datos, token) {
  return request('POST', `/eventos/${eventoId}/resenias`, { body: datos, token });
}
