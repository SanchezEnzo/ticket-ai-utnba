/**
 * Helper para autenticar un usuario y obtener su token.
 *
 * @param {Function} fetch - Función fetch global.
 * @param {string} baseUrl - URL base del servidor.
 * @param {string} email - Email del usuario del seed.
 * @param {string} password - Contraseña del usuario del seed.
 * @returns {Promise<string>} Token del usuario autenticado.
 */
export async function login(fetch, baseUrl, email, password) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.token;
}
