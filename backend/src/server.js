import { crearApp } from './app.js';
import { UsuarioRepository } from './repositories/UsuarioRepository.js';
import { CategoriaRepository } from './repositories/CategoriaRepository.js';
import { EventoRepository } from './repositories/EventoRepository.js';
import { SesionService } from './services/SesionService.js';
import { AuthService } from './services/AuthService.js';
import { EventoService } from './services/EventoService.js';
import { AuthController } from './controllers/AuthController.js';
import { EventoController } from './controllers/EventoController.js';
import { CompraRepository } from './repositories/CompraRepository.js';
import { CompraService } from './services/CompraService.js';
import { CompraController } from './controllers/CompraController.js';
import { MensajeService } from './services/MensajeService.js';
import { MensajeController } from './controllers/MensajeController.js';
import { seedUsuarios } from './seed/usuarios.js';
import { seedCategorias, seedEventos } from './seed/eventos.js';
import { seedCompras } from './seed/compras.js';

// 1. Repositorios
const usuarioRepository = new UsuarioRepository();
const categoriaRepository = new CategoriaRepository();
const eventoRepository = new EventoRepository();
const compraRepository = new CompraRepository();
seedUsuarios(usuarioRepository);
seedCategorias(categoriaRepository);
seedEventos(eventoRepository, categoriaRepository, usuarioRepository);
seedCompras(compraRepository, eventoRepository, usuarioRepository);

// 2. Servicios
const sesionService = new SesionService();
const authService = new AuthService({ usuarioRepository, sesionService });
const eventoService = new EventoService({
  eventoRepository,
  categoriaRepository,
  usuarioRepository,
});
const compraService = new CompraService({ compraRepository, eventoRepository });
const mensajeService = new MensajeService({ compraRepository });

// 3. Controllers
const authController = new AuthController({ authService });
const eventoController = new EventoController({ eventoService });
const compraController = new CompraController({ compraService });
const mensajeController = new MensajeController({ mensajeService });

const app = crearApp({
  repositorios: { usuarioRepository, categoriaRepository, eventoRepository, compraRepository },
  servicios: { sesionService, authService, eventoService, compraService, mensajeService },
  controllers: { authController, eventoController, compraController, mensajeController },
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
