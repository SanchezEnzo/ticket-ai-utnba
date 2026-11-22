import crypto from 'node:crypto';

function generarHash(contrasena) {
  const sal = crypto.randomBytes(16);
  const hash = crypto.scryptSync(contrasena, sal, 64);
  return { sal: sal.toString('hex'), hash: hash.toString('hex') };
}

function verificarHash(contrasena, { sal, hash }) {
  const salBuf = Buffer.from(sal, 'hex');
  const hashBuf = Buffer.from(hash, 'hex');
  const nuevoHash = crypto.scryptSync(contrasena, salBuf, 64);
  return crypto.timingSafeEqual(nuevoHash, hashBuf);
}

class Usuario {
  constructor({ id, nombre, apellido, email, _hash }) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this._hash = _hash;
    this.favoritos = [];
  }

  static crear({ id, nombre, apellido, email, contrasena }) {
    const { sal, hash } = generarHash(contrasena);
    return new Usuario({
      id,
      nombre,
      apellido,
      email,
      _hash: { sal, hash },
    });
  }

  verificarPassword(contrasena) {
    return verificarHash(contrasena, this._hash);
  }

  marcarFavorito(eventoId) {
    if (!this.favoritos.includes(eventoId)) {
      this.favoritos.push(eventoId);
    }
  }

  desmarcarFavorito(eventoId) {
    this.favoritos = this.favoritos.filter(id => id !== eventoId);
  }

  esFavorito(eventoId) {
    return this.favoritos.includes(eventoId);
  }

  sinPassword() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      favoritos: [...this.favoritos],
    };
  }
}

export { Usuario };
