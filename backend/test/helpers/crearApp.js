import { crearApp as crearAppExpress } from '../../src/app.js';
import { UsuarioRepository } from '../../src/repositories/UsuarioRepository.js';
import { CategoriaRepository } from '../../src/repositories/CategoriaRepository.js';
import { EventoRepository } from '../../src/repositories/EventoRepository.js';
import { SesionService } from '../../src/services/SesionService.js';
import { AuthService } from '../../src/services/AuthService.js';
import { EventoService } from '../../src/services/EventoService.js';
import { AuthController } from '../../src/controllers/AuthController.js';
import { EventoController } from '../../src/controllers/EventoController.js';
import { CompraRepository } from '../../src/repositories/CompraRepository.js';
import { CompraService } from '../../src/services/CompraService.js';
import { CompraController } from '../../src/controllers/CompraController.js';
import { MensajeService } from '../../src/services/MensajeService.js';
import { MensajeController } from '../../src/controllers/MensajeController.js';
import { ReseniaRepository } from '../../src/repositories/ReseniaRepository.js';
import { ReseniaService } from '../../src/services/ReseniaService.js';
import { ReseniaController } from '../../src/controllers/ReseniaController.js';
import { seedUsuarios } from '../../src/seed/usuarios.js';
import { seedCategorias, seedEventos } from '../../src/seed/eventos.js';
import { seedCompras } from '../../src/seed/compras.js';
import { seedResenias } from '../../src/seed/resenias.js';

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
  const categoriaRepository = new CategoriaRepository();
  const eventoRepository = new EventoRepository();
  const compraRepository = new CompraRepository();
  const reseniaRepository = new ReseniaRepository();
  seedUsuarios(usuarioRepository);
  seedCategorias(categoriaRepository);
  seedEventos(eventoRepository, categoriaRepository, usuarioRepository);
  seedCompras(compraRepository, eventoRepository, usuarioRepository);
  seedResenias(reseniaRepository, compraRepository, eventoRepository, usuarioRepository);

  // 2. Servicios
  const sesionService = new SesionService();
  const authService = new AuthService({ usuarioRepository, sesionService });
  const reseniaService = new ReseniaService({ reseniaRepository, compraRepository, eventoRepository });
  const eventoService = new EventoService({
    eventoRepository,
    categoriaRepository,
    usuarioRepository,
    reseniaService,
  });
  const compraService = new CompraService({ compraRepository, eventoRepository });
  const mensajeService = new MensajeService({ compraRepository });

  // 3. Controllers
  const authController = new AuthController({ authService });
  const eventoController = new EventoController({ eventoService, compraService, reseniaService });
  const compraController = new CompraController({ compraService });
  const mensajeController = new MensajeController({ mensajeService });
  const reseniaController = new ReseniaController({ reseniaService });

  const app = crearAppExpress({
    repositorios: { usuarioRepository, categoriaRepository, eventoRepository, compraRepository, reseniaRepository },
    servicios: { sesionService, authService, eventoService, compraService, mensajeService, reseniaService },
    controllers: { authController, eventoController, compraController, mensajeController, reseniaController },
  });
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const close = () => new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  return { baseUrl, close };
}
