/**
 * Helper para autenticar un usuario y obtener su token.
 *
 * Se completa en el spec 01 cuando exista el endpoint POST /auth/login.
 * Por ahora, esta función solo documenta la firma esperada y lanza un error.
 *
 * @param {Function} fetch - Función fetch global.
 * @param {string} baseUrl - URL base del servidor.
 * @param {string} email - Email del usuario del seed.
 * @param {string} password - Contraseña del usuario del seed.
 * @returns {Promise<string>} Token del usuario autenticado.
 */
export async function login(fetch, baseUrl, email, password) {
  throw new Error('No implementado. Se completa en spec 01.');
}
