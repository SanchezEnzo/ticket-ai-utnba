import { crearApp as crearAppExpress } from '../../src/app.js';
import { UsuarioRepository } from '../../src/repositories/UsuarioRepository.js';
import { SesionService } from '../../src/services/SesionService.js';
import { AuthService } from '../../src/services/AuthService.js';
import { AuthController } from '../../src/controllers/AuthController.js';
import { seedUsuarios } from '../../src/seed/usuarios.js';

/**
 * Crea una instancia de la app Express y la levanta en un puerto efímero.
 * Devuelve un objeto con:
 *   - baseUrl: URL base del servidor (http://localhost:<puerto>).
 *   - close(): cierra el servidor y devuelve una Promesa.
 *
 * Se usa en los tests de API para evitar depender del puerto 3000.
 * Cada llamada crea repositorios y servicios nuevos para mantener estado limpio.
 */
export async function crearApp() {
  // 1. Repositorios
  const usuarioRepository = new UsuarioRepository();
  seedUsuarios(usuarioRepository);

  // 2. Servicios
  const sesionService = new SesionService();
  const authService = new AuthService({ usuarioRepository, sesionService });

  // 3. Controllers
  const authController = new AuthController({ authService });

  const app = crearAppExpress({
    repositorios: { usuarioRepository },
    servicios: { sesionService, authService },
    controllers: { authController },
  });
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const close = () => new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  return { baseUrl, close };
}
