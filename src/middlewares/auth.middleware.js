const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');

// 1) ¿Quién eres? Verifica el token y carga el usuario en req.usuario
const autenticar = async (req, res, next) => {
  try {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ ok: false, mensaje: 'Token requerido' });
    }

       let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      console.error('Error al verificar el token:', err.message);
      return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
    }
    
    const usuario = await Usuario.buscarPorId(payload.sub);
    if (!usuario || usuario.user_estado !== 'ACTIVO') {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no válido' });
    }

    req.usuario = {
      id: usuario.user_id,
      correo: usuario.user_correo,
      nombre: usuario.user_nombre,
      apellido: usuario.user_apellido,
      rol: usuario.role_nombre,
    };
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error de autenticación' });
  }
};

// 2) ¿Qué puedes hacer? Se usa después de autenticar: autorizar('ADMIN')
const autorizar = (...rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permiso para realizar esta acción' });
  }
  next();
};

module.exports = { autenticar, autorizar };