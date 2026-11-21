import { crearApp } from './app.js';
import { UsuarioRepository } from './repositories/UsuarioRepository.js';
import { SesionService } from './services/SesionService.js';
import { AuthService } from './services/AuthService.js';
import { AuthController } from './controllers/AuthController.js';
import { seedUsuarios } from './seed/usuarios.js';

// 1. Repositorios
const usuarioRepository = new UsuarioRepository();
seedUsuarios(usuarioRepository);

// 2. Servicios
const sesionService = new SesionService();
const authService = new AuthService({ usuarioRepository, sesionService });

// 3. Controllers
const authController = new AuthController({ authService });

const app = crearApp({
  repositorios: { usuarioRepository },
  servicios: { sesionService, authService },
  controllers: { authController },
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
