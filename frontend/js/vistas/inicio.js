import { api } from '../core/api.js';
import { el } from '../core/ui.js';
import {
  parsearFechaHora,
  formatearFecha,
  formatearHora,
  capitalizar,
  ETIQUETAS_ESTADO,
} from '../core/formato.js';

const ESTADOS_VIGENTES = ['PENDIENTE', 'CONFIRMADA'];

const TITULOS_CITAS = {
  CLIENTE: 'Tus próximas citas',
  EMPLEADO: 'Tu agenda próxima',
  ADMIN: 'Próximas citas del salón',
};

const quienEs = (cita, rol) => {
  if (rol === 'CLIENTE') return `con ${cita.empleado_nombre}`;
  if (rol === 'EMPLEADO') return `cliente: ${cita.cliente_nombre}`;
  return `${cita.cliente_nombre} con ${cita.empleado_nombre}`;
};

const itemCita = (cita, rol) => {
  const inicio = parsearFechaHora(cita.cita_hora_inicio);
  return el(
    'li',
    { class: 'cita-item' },
    el('p', { class: 'cita-fecha' }, `${capitalizar(formatearFecha(inicio))} · ${formatearHora(inicio)}`),
    el('p', { class: 'cita-detalle' }, `${cita.servicios} — ${quienEs(cita, rol)}`),
    el('span', { class: `insignia insignia-${cita.cita_estado.toLowerCase()}` }, ETIQUETAS_ESTADO[cita.cita_estado])
  );
};

const tarjetaCitas = (resultado, rol) => {
  const tarjeta = el('section', { class: 'panel' }, el('h2', {}, TITULOS_CITAS[rol]));

  if (resultado.status === 'rejected') {
    tarjeta.append(el('p', { class: 'mensaje', role: 'alert' }, resultado.reason.message));
    return tarjeta;
  }

  const ahora = new Date();
  const proximas = resultado.value.data
    .filter((c) => ESTADOS_VIGENTES.includes(c.cita_estado) && parsearFechaHora(c.cita_hora_inicio) >= ahora)
    .sort((a, b) => a.cita_hora_inicio.localeCompare(b.cita_hora_inicio))
    .slice(0, 3);

  if (proximas.length === 0) {
    tarjeta.append(el('p', { class: 'vacio' }, 'No hay citas próximas.'));
  } else {
    tarjeta.append(el('ul', { class: 'lista-citas' }, proximas.map((c) => itemCita(c, rol))));
  }
  return tarjeta;
};

const tarjetaServicios = (resultado) => {
  const tarjeta = el('section', { class: 'panel' }, el('h2', {}, 'Nuestro catálogo'));

  if (resultado.status === 'rejected') {
    tarjeta.append(el('p', { class: 'mensaje', role: 'alert' }, resultado.reason.message));
    return tarjeta;
  }

  const total = resultado.value.data.length;
  tarjeta.append(
    el('p', { class: 'cifra' }, String(total)),
    el('p', { class: 'cita-detalle' }, total === 1 ? 'servicio disponible' : 'servicios disponibles')
  );
  return tarjeta;
};

export async function render(contenedor, { usuario }) {
  // Las dos consultas se hacen a la vez; si una falla, la otra tarjeta se muestra igual
  const [citas, servicios] = await Promise.allSettled([
    api('/citas'),
    api('/servicios?estado=ACTIVO'),
  ]);

  contenedor.append(
    el('p', { class: 'eyebrow' }, 'Mi espacio de bienestar'),
    el('h1', { class: 'titulo-pagina' }, `Hola, ${usuario.nombre}`),
    el('p', { class: 'subtitulo' }, 'Esto es lo que tienes por delante.'),
    el('div', { class: 'rejilla' }, tarjetaCitas(citas, usuario.rol), tarjetaServicios(servicios))
  );
}