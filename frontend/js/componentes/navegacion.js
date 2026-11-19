import { el } from '../core/ui.js';

// "pronto: true" muestra la sección como no disponible; se quita al construir la vista
const ITEMS = [
  { ruta: '/inicio', etiqueta: 'Inicio', roles: ['CLIENTE', 'EMPLEADO', 'ADMIN'] },
  { ruta: '/servicios', etiqueta: 'Servicios', roles: ['CLIENTE', 'ADMIN'], pronto: true },
  { ruta: '/citas', etiqueta: 'Mis citas', roles: ['CLIENTE'], pronto: true },
];

export const construirNavegacion = (contenedor, rol) => {
  const enlaces = ITEMS.filter((item) => item.roles.includes(rol)).map((item) =>
    item.pronto
      ? el(
          'span',
          { class: 'nav-enlace desactivado', 'aria-disabled': 'true' },
          item.etiqueta,
          el('span', { class: 'etiqueta-pronto' }, 'Pronto')
        )
      : el('a', { class: 'nav-enlace', href: `#${item.ruta}`, 'data-ruta': item.ruta }, item.etiqueta)
  );
  contenedor.replaceChildren(...enlaces);
};

export const marcarActiva = (ruta) => {
  document.querySelectorAll('.nav-enlace[data-ruta]').forEach((enlace) => {
    if (enlace.dataset.ruta === ruta) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });
};