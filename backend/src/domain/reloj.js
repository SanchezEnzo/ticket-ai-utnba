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

function diasCalendario(desde, hasta) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const desdeParts = formatter.formatToParts(desde);
  const hastaParts = formatter.formatToParts(hasta);

  const getPart = (parts, type) => parseInt(parts.find(p => p.type === type).value, 10);

  const desdeYear = getPart(desdeParts, 'year');
  const desdeMonth = getPart(desdeParts, 'month');
  const desdeDay = getPart(desdeParts, 'day');

  const hastaYear = getPart(hastaParts, 'year');
  const hastaMonth = getPart(hastaParts, 'month');
  const hastaDay = getPart(hastaParts, 'day');

  const desdeUTC = Date.UTC(desdeYear, desdeMonth - 1, desdeDay);
  const hastaUTC = Date.UTC(hastaYear, hastaMonth - 1, hastaDay);

  const diffMs = hastaUTC - desdeUTC;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

export { ahora, fijarAhora, restaurarReloj, parsearFecha, sumarDias, diasCalendario };
