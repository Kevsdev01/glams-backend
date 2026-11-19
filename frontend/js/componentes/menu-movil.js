export const configurarMenuMovil = () => {
  const lateral = document.getElementById('lateral');
  const velo = document.getElementById('velo');
  const boton = document.getElementById('btn-menu');

  const alternar = (abrir) => {
    lateral.classList.toggle('abierta', abrir);
    velo.classList.toggle('visible', abrir);
    boton.setAttribute('aria-expanded', String(abrir));
  };

  boton.addEventListener('click', () => alternar(!lateral.classList.contains('abierta')));
  velo.addEventListener('click', () => alternar(false));
  lateral.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) alternar(false); // al elegir una sección se cierra
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') alternar(false);
  });
};