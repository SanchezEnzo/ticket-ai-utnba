import { crearApp } from './app.js';
import { UsuarioRepository } from './repositories/UsuarioRepository.js';
import { CategoriaRepository } from './repositories/CategoriaRepository.js';
import { EventoRepository } from './repositories/EventoRepository.js';
import { SesionService } from './services/SesionService.js';
import { AuthService } from './services/AuthService.js';
import { EventoService } from './services/EventoService.js';
import { AuthController } from './controllers/AuthController.js';
import { EventoController } from './controllers/EventoController.js';
import { seedUsuarios } from './seed/usuarios.js';
import { seedCategorias, seedEventos } from './seed/eventos.js';

// 1. Repositorios
const usuarioRepository = new UsuarioRepository();
const categoriaRepository = new CategoriaRepository();
const eventoRepository = new EventoRepository();
seedUsuarios(usuarioRepository);
seedCategorias(categoriaRepository);
seedEventos(eventoRepository, categoriaRepository, usuarioRepository);

// 2. Servicios
const sesionService = new SesionService();
const authService = new AuthService({ usuarioRepository, sesionService });
const eventoService = new EventoService({
  eventoRepository,
  categoriaRepository,
  usuarioRepository,
});

// 3. Controllers
const authController = new AuthController({ authService });
const eventoController = new EventoController({ eventoService });

const app = crearApp({
  repositorios: { usuarioRepository, categoriaRepository, eventoRepository },
  servicios: { sesionService, authService, eventoService },
  controllers: { authController, eventoController },
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
