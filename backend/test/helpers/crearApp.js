import { app } from '../../src/app.js';

/**
 * Crea una instancia de la app Express y la levanta en un puerto efímero.
 * Devuelve un objeto con:
 *   - baseUrl: URL base del servidor (http://localhost:<puerto>).
 *   - close(): cierra el servidor y devuelve una Promesa.
 *
 * Se usa en los tests de API para evitar depender del puerto 3000.
 */
export async function crearApp() {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const close = () => new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  return { baseUrl, close };
}
