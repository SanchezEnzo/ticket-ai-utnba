import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Usuario } from '../../src/domain/Usuario.js';

describe('Usuario', () => {
  it('el hash no es igual a la contraseña original', () => {
    const u = Usuario.crear({
      id: 'test1',
      nombre: 'Test',
      apellido: 'Uno',
      email: 'test@example.com',
      contrasena: 'miClave123',
    });
    assert.ok(u._hash.sal !== 'miClave123');
    assert.ok(u._hash.hash !== 'miClave123');
  });

  it('verificarPassword acepta la contraseña correcta', () => {
    const u = Usuario.crear({
      id: 'test2',
      nombre: 'Test',
      apellido: 'Dos',
      email: 'test2@example.com',
      contrasena: 'correcta',
    });
    assert.equal(u.verificarPassword('correcta'), true);
  });

  it('verificarPassword rechaza la contraseña incorrecta', () => {
    const u = Usuario.crear({
      id: 'test3',
      nombre: 'Test',
      apellido: 'Tres',
      email: 'test3@example.com',
      contrasena: 'correcta',
    });
    assert.equal(u.verificarPassword('incorrecta'), false);
  });

  it('dos hashes de la misma contraseña son distintos (sal diferente)', () => {
    const u1 = Usuario.crear({
      id: 'test4a',
      nombre: 'A',
      apellido: 'A',
      email: 'a@example.com',
      contrasena: 'misma',
    });
    const u2 = Usuario.crear({
      id: 'test4b',
      nombre: 'B',
      apellido: 'B',
      email: 'b@example.com',
      contrasena: 'misma',
    });
    assert.notEqual(u1._hash.sal, u2._hash.sal);
    assert.notEqual(u1._hash.hash, u2._hash.hash);
    assert.equal(u1.verificarPassword('misma'), true);
    assert.equal(u2.verificarPassword('misma'), true);
  });

  it('sinPassword no incluye datos sensibles', () => {
    const u = Usuario.crear({
      id: 'test5',
      nombre: 'Test',
      apellido: 'Cinco',
      email: 'test5@example.com',
      contrasena: 'secreto',
    });
    const sinPass = u.sinPassword();
    assert.equal(sinPass.id, 'test5');
    assert.equal(sinPass.nombre, 'Test');
    assert.equal(sinPass.apellido, 'Cinco');
    assert.equal(sinPass.email, 'test5@example.com');
    assert.ok(Array.isArray(sinPass.favoritos));
    assert.equal(sinPass.favoritos.length, 0);
    assert.equal(sinPass._hash, undefined);
    assert.equal(sinPass.contrasena, undefined);
  });
});

describe('Usuario - favoritos', () => {
  const crearUsuario = () =>
    Usuario.crear({
      id: 'fav-test',
      nombre: 'Fav',
      apellido: 'Test',
      email: 'fav@example.com',
      contrasena: 'clave',
    });

  it('marcarFavorito agrega el evento al array', () => {
    const u = crearUsuario();
    u.marcarFavorito('evt_1');
    assert.deepEqual(u.favoritos, ['evt_1']);
  });

  it('marcarFavorito no duplica si ya existe', () => {
    const u = crearUsuario();
    u.marcarFavorito('evt_1');
    u.marcarFavorito('evt_1');
    assert.deepEqual(u.favoritos, ['evt_1']);
  });

  it('marcarFavorito mantiene el orden de inserción', () => {
    const u = crearUsuario();
    u.marcarFavorito('evt_a');
    u.marcarFavorito('evt_b');
    u.marcarFavorito('evt_c');
    assert.deepEqual(u.favoritos, ['evt_a', 'evt_b', 'evt_c']);
  });

  it('desmarcarFavorito quita el evento del array', () => {
    const u = crearUsuario();
    u.marcarFavorito('evt_1');
    u.marcarFavorito('evt_2');
    u.desmarcarFavorito('evt_1');
    assert.deepEqual(u.favoritos, ['evt_2']);
  });

  it('desmarcarFavorito no falla si el evento no estaba', () => {
    const u = crearUsuario();
    u.marcarFavorito('evt_1');
    u.desmarcarFavorito('evt_no_existe');
    assert.deepEqual(u.favoritos, ['evt_1']);
  });

  it('esFavorito devuelve true cuando el evento esta marcado', () => {
    const u = crearUsuario();
    u.marcarFavorito('evt_1');
    assert.equal(u.esFavorito('evt_1'), true);
  });

  it('esFavorito devuelve false cuando el evento no esta marcado', () => {
    const u = crearUsuario();
    assert.equal(u.esFavorito('evt_no_existe'), false);
  });
});
