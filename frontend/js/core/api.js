import { obtenerToken, cerrarSesion } from './sesion.js';

const API_URL = '/api'; // mismo origen: no hace falta el puerto

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

// Llama a la API. Con "publica: true" (login, registro) no envía el token
export async function api(ruta, { metodo = 'GET', cuerpo, publica = false } = {}) {
  const cabeceras = {};
  if (cuerpo) cabeceras['Content-Type'] = 'application/json';

  const token = obtenerToken();
  if (token && !publica) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor', 0);
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    // Sesión vencida o inválida: se cierra y se vuelve al login
    if (respuesta.status === 401 && !publica) cerrarSesion();
    throw new ErrorApi(datos.mensaje || 'Ocurrió un error inesperado', respuesta.status);
  }
  return datos;
}