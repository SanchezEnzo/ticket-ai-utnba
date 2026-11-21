let _relojFijado = null;

function ahora() {
  return _relojFijado !== null ? _relojFijado : new Date();
}

function fijarAhora(fecha) {
  _relojFijado = fecha;
}

function restaurarReloj() {
  _relojFijado = null;
}

export { ahora, fijarAhora, restaurarReloj };
