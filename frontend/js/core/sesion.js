const CLAVE_TOKEN = 'glams.token';
const CLAVE_USUARIO = 'glams.usuario';

export const guardarSesion = (token, usuario) => {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
};

export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN);

export const obtenerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO));
  } catch {
    return null;
  }
};

export const haySesion = () => Boolean(obtenerToken());

export const cerrarSesion = () => {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
  window.location.replace('/login.html');
};