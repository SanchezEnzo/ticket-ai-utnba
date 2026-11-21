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

function parsearFecha(isoString) {
  return new Date(isoString);
}

function sumarDias(base, dias) {
  const fecha = new Date(base);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

export { ahora, fijarAhora, restaurarReloj, parsearFecha, sumarDias };
