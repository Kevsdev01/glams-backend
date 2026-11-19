import { el } from './ui.js';

const vistaNoEncontrada = (porDefecto) =>
  el(
    'div',
    { class: 'vista' },
    el('h1', { class: 'titulo-pagina' }, 'No encontramos esta página'),
    el('p', {}, el('a', { href: `#${porDefecto}` }, 'Volver al inicio'))
  );

// rutas: { '/inicio': () => import('../vistas/inicio.js'), ... }
// Cada vista exporta una función render(contenedor, contexto)
export function iniciarRouter({ rutas, contenedor, contexto, porDefecto = '/inicio', alCambiar }) {
  let version = 0;

  const navegar = async () => {
    const ruta = window.location.hash.slice(1) || porDefecto;
    const miVersion = ++version;

    alCambiar?.(ruta);
    contenedor.setAttribute('aria-busy', 'true');
    contenedor.replaceChildren(el('p', { class: 'cargando' }, 'Cargando…'));

    let vista;
    try {
      const cargador = Object.hasOwn(rutas, ruta) ? rutas[ruta] : null;
      if (!cargador) {
        vista = vistaNoEncontrada(porDefecto);
      } else {
        const modulo = await cargador();
        vista = el('div', { class: 'vista' });
        await modulo.render(vista, contexto);
      }
    } catch (error) {
      vista = el('p', { class: 'mensaje', role: 'alert' }, error.message || 'No se pudo cargar esta sección');
    }

    // Si mientras tanto el usuario fue a otra vista, esta respuesta ya no sirve
    if (miVersion !== version) return;

    contenedor.replaceChildren(vista);
    contenedor.removeAttribute('aria-busy');
    contenedor.focus({ preventScroll: true }); // ayuda a lectores de pantalla y teclado
    window.scrollTo(0, 0);
  };

  window.addEventListener('hashchange', navegar);
  navegar();
}