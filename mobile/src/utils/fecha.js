/**
 * Parsea una fecha en formato DD/MM/AAAA y una hora en formato HH:mm
 * y devuelve una cadena ISO 8601 en hora local.
 * @param {string} fechaTexto - Fecha en formato DD/MM/AAAA
 * @param {string} horaTexto - Hora en formato HH:mm
 * @returns {string} Fecha ISO 8601 en hora local
 */
export function parsearFechaHora(fechaTexto, horaTexto) {
  const dia = parseInt(fechaTexto.substring(0, 2), 10);
  const mes = parseInt(fechaTexto.substring(3, 5), 10);
  const anio = parseInt(fechaTexto.substring(6, 10), 10);
  const hora = parseInt(horaTexto.substring(0, 2), 10);
  const minuto = parseInt(horaTexto.substring(3, 5), 10);

  const fecha = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
  return fecha.toISOString();
}

/**
 * Valida que un texto tenga el formato DD/MM/AAAA y represente una fecha válida.
 * @param {string} texto
 * @returns {boolean} True si el formato es válido
 */
export function validarFechaTexto(texto) {
  if (typeof texto !== 'string') return false;
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const dia = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const anio = parseInt(match[3], 10);

  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;

  const fecha = new Date(anio, mes - 1, dia);
  return (
    fecha.getFullYear() === anio &&
    fecha.getMonth() === mes - 1 &&
    fecha.getDate() === dia
  );
}

/**
 * Valida que un texto tenga el formato HH:mm y represente una hora válida.
 * @param {string} texto
 * @returns {boolean} True si el formato es válido
 */
export function validarHoraTexto(texto) {
  if (typeof texto !== 'string') return false;
  const match = texto.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;

  const hora = parseInt(match[1], 10);
  const minuto = parseInt(match[2], 10);

  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
}
