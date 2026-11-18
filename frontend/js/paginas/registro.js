import { api } from '../core/api.js';
import { mostrarMensaje } from '../core/ui.js';

// Misma regla que el servidor (la del servidor es la que protege; esta solo avisa antes)
const REGLA_PASSWORD = /^(?=.*[A-Z])(?=.*\d).{8,72}$/;

const form = document.getElementById('form-registro');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('btn-enviar');

const valor = (id) => document.getElementById(id).value;

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mostrarMensaje(mensaje, '');

  if (!REGLA_PASSWORD.test(valor('password'))) {
    return mostrarMensaje(mensaje, 'La contraseña debe tener de 8 a 72 caracteres, una mayúscula y un número.');
  }
  if (valor('password') !== valor('confirmar')) {
    return mostrarMensaje(mensaje, 'Las contraseñas no coinciden.');
  }
  if (!document.getElementById('terminos').checked) {
    return mostrarMensaje(mensaje, 'Debes aceptar la política de tratamiento de datos.');
  }

  boton.disabled = true;
  try {
    await api('/auth/registro', {
      metodo: 'POST',
      publica: true,
      cuerpo: {
        nombre: valor('nombre'),
        apellido: valor('apellido'),
        telefono: valor('telefono'),
        correo: valor('correo'),
        password: valor('password'),
      },
    });

    mostrarMensaje(mensaje, 'Cuenta creada. Te llevamos al inicio de sesión...', 'ok');
    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
  } catch (error) {
    mostrarMensaje(mensaje, error.message);
    boton.disabled = false;
  }
});