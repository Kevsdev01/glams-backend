const FORMATO = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

// Convierte "AAAA-MM-DD HH:MM" en Date; devuelve null si el texto no es una fecha real
const parsearFechaHora = (texto) => {
  if (typeof texto !== 'string') return null;
  const m = FORMATO.exec(texto);
  if (!m) return null;

  const [, anio, mes, dia, hora, minuto] = m.map(Number);
  const fecha = new Date(anio, mes - 1, dia, hora, minuto);

  const valida =
    fecha.getFullYear() === anio &&
    fecha.getMonth() === mes - 1 &&
    fecha.getDate() === dia &&
    fecha.getHours() === hora &&
    fecha.getMinutes() === minuto;

  return valida ? fecha : null; // rechaza, por ejemplo, 2026-02-31
};

const dosDigitos = (n) => String(n).padStart(2, '0');

const formatearFecha = (f) =>
  `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;
const formatearHora = (f) => `${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
const formatearFechaHora = (f) => `${formatearFecha(f)} ${formatearHora(f)}:00`;

// 1 = lunes ... 7 = domingo (igual que en disponibilidad_empleado)
const diaSemanaISO = (f) => (f.getDay() === 0 ? 7 : f.getDay());

const sumarMinutos = (f, minutos) => new Date(f.getTime() + minutos * 60000);

module.exports = {
  parsearFechaHora,
  formatearFecha,
  formatearHora,
  formatearFechaHora,
  diaSemanaISO,
  sumarMinutos,
};