import { api } from '../core/api.js';
import { haySesion, cerrarSesion } from '../core/sesion.js';
import { iniciarRouter } from '../core/router.js';
import { ETIQUETAS_ROL } from '../core/formato.js';
import { construirNavegacion, marcarActiva } from '../componentes/navegacion.js';
import { configurarMenuMovil } from '../componentes/menu-movil.js';

// Una línea por pantalla; se carga el archivo solo cuando se visita
const RUTAS = {
  '/inicio': () => import('../vistas/inicio.js'),
};

const arrancar = async () => {
  const contenedor = document.getElementById('contenido');

  let usuario;
  try {
    // Los datos frescos del servidor mandan; lo guardado en el navegador no es de fiar
    ({ data: usuario } = await api('/auth/perfil'));
  } catch (error) {
    contenedor.textContent = error.message;
    return;
  }

  document.getElementById('usuario-nombre').textContent = `${usuario.nombre} ${usuario.apellido}`;
  document.getElementById('usuario-rol').textContent = ETIQUETAS_ROL[usuario.rol] ?? usuario.rol;

  construirNavegacion(document.getElementById('nav'), usuario.rol);
  configurarMenuMovil();
  iniciarRouter({ rutas: RUTAS, contenedor, contexto: { usuario }, alCambiar: marcarActiva });
};

document.getElementById('btn-salir').addEventListener('click', cerrarSesion);

if (!haySesion()) {
  window.location.replace('/login.html');
} else {
  arrancar();
}