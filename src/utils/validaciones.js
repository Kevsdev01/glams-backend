const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^\+?[0-9\s-]{7,20}$/;

const validarDatosUsuario = (body) => {
  const { correo, password, nombre, apellido, telefono } = body || {};

  for (const valor of [correo, password, nombre, apellido, telefono]) {
    if (typeof valor !== 'string' || !valor.trim()) {
      return { error: 'correo, password, nombre, apellido y telefono son obligatorios' };
    }
  }

  const correoLimpio = correo.trim().toLowerCase();
  if (!CORREO_REGEX.test(correoLimpio) || correoLimpio.length > 100) {
    return { error: 'El correo no es válido' };
  }
  if (password.length < 8 || password.length > 72) {
    return { error: 'La contraseña debe tener entre 8 y 72 caracteres' };
  }
  if (nombre.trim().length > 50 || apellido.trim().length > 50) {
    return { error: 'nombre y apellido admiten máx. 50 caracteres' };
  }
  if (!TELEFONO_REGEX.test(telefono.trim())) {
    return { error: 'El teléfono no es válido' };
  }

  return {
    datos: {
      correo: correoLimpio,
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
    },
  };
};

module.exports = { validarDatosUsuario };