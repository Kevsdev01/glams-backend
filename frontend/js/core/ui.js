// Muestra un mensaje de error o de éxito en un elemento .mensaje
export const mostrarMensaje = (elemento, texto, tipo = 'error') => {
  elemento.textContent = texto;
  elemento.classList.toggle('ok', tipo === 'ok');
};