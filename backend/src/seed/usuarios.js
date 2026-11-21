import { Usuario } from '../domain/Usuario.js';

/**
 * Seed de usuarios de ejemplo.
 *
 * Credenciales:
 *   - organizador1@example.com / contraseña123
 *   - comprador1@example.com / contraseña123
 *   - ambos1@example.com / contraseña123
 */
function seedUsuarios(repositorio) {
  const usuarios = [
    Usuario.crear({
      id: 'organizador1',
      nombre: 'Organizador',
      apellido: 'Uno',
      email: 'organizador1@example.com',
      contrasena: 'contraseña123',
    }),
    Usuario.crear({
      id: 'comprador1',
      nombre: 'Comprador',
      apellido: 'Uno',
      email: 'comprador1@example.com',
      contrasena: 'contraseña123',
    }),
    Usuario.crear({
      id: 'ambos1',
      nombre: 'Ambos',
      apellido: 'Uno',
      email: 'ambos1@example.com',
      contrasena: 'contraseña123',
    }),
  ];

  for (const u of usuarios) {
    repositorio.guardar(u);
  }
}

export { seedUsuarios };
