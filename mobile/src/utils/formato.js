function formatearPrecio(valor) {
  const num = Number(valor);
  if (isNaN(num)) return '$ 0';
  return '$ ' + new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatearFecha(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const fecha = formatearFecha(isoString);
  const hora = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${fecha} ${hora}:${minutos}`;
}

function textoDias(dias) {
  if (dias <= 0) return 'El evento es hoy';
  if (dias === 1) return 'Mañana';
  return `Faltan ${dias} días`;
}

export { formatearPrecio, formatearFecha, formatearFechaHora, textoDias };
