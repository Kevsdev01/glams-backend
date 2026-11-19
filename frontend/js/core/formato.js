// "2026-12-07 09:00:00" -> Date (hora local del salón)
export const parsearFechaHora = (texto) => {
  const [fecha, hora = '00:00:00'] = texto.split(' ');
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);
  return new Date(anio, mes - 1, dia, horas, minutos);
};

export const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

export const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);

export const formatearHora = (fecha) =>
  new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(fecha);

// La API devuelve los precios como texto ("45000.00")
export const formatearPrecio = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor));

export const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente de confirmación',
  CONFIRMADA: 'Confirmada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
};

export const ETIQUETAS_ROL = {
  CLIENTE: 'Cliente',
  EMPLEADO: 'Equipo',
  ADMIN: 'Administración',
};