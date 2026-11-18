import { api } from '../core/api.js';
import { guardarSesion, haySesion } from '../core/sesion.js';
import { mostrarMensaje } from '../core/ui.js';

// Si ya hay sesión, no tiene sentido mostrar el login
if (haySesion()) window.location.replace('/app.html');

const form = document.getElementById('form-login');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('btn-enviar');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mostrarMensaje(mensaje, '');
  boton.disabled = true;

  try {
    const { data } = await api('/auth/login', {
      metodo: 'POST',
      publica: true,
      cuerpo: {
        correo: document.getElementById('correo').value,
        password: document.getElementById('password').value,
      },
    });

    guardarSesion(data.token, data.usuario);
    window.location.href = '/app.html';
  } catch (error) {
    mostrarMensaje(mensaje, error.message);
    boton.disabled = false;
  }
});