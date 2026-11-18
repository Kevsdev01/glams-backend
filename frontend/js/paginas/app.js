import { api } from '../core/api.js';
import { haySesion, cerrarSesion } from '../core/sesion.js';
import { mostrarMensaje } from '../core/ui.js';

const cargar = async () => {
  try {
    const { data } = await api('/auth/perfil');
    document.getElementById('nombre').textContent = data.nombre;
    document.getElementById('rol').textContent = data.rol;
  } catch (error) {
    mostrarMensaje(document.getElementById('mensaje'), error.message);
  }
};

document.getElementById('btn-salir').addEventListener('click', cerrarSesion);

if (!haySesion()) {
  window.location.replace('/login.html');
} else {
  cargar();
}