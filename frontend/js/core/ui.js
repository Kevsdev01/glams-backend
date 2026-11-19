// Muestra un mensaje de error (por defecto) o de éxito en un elemento .mensaje
export const mostrarMensaje = (elemento, texto, tipo = 'error') => {
  elemento.textContent = texto;
  elemento.classList.toggle('ok', tipo === 'ok');
};

// Crea un elemento del DOM de forma segura:
//   el('p', { class: 'cita' }, 'Texto', otroElemento)
// Los textos se insertan como texto (nunca como HTML), así no hay riesgo de inyección.
export const el = (etiqueta, atributos = {}, ...hijos) => {
  const nodo = document.createElement(etiqueta);

  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === false || valor == null) continue;
    if (clave === 'class') {
      nodo.className = valor;
    } else if (clave.startsWith('on') && typeof valor === 'function') {
      nodo.addEventListener(clave.slice(2).toLowerCase(), valor);
    } else {
      nodo.setAttribute(clave, valor === true ? '' : valor);
    }
  }

  nodo.append(...hijos.flat().filter((hijo) => hijo != null && hijo !== false));
  return nodo;
};