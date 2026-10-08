const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');
   const { validarDatosUsuario } = require('../utils/validaciones');

// Hash de relleno: se compara cuando el correo no existe, para que la
// respuesta tarde lo mismo y no se pueda averiguar qué correos están registrados
const HASH_FALSO = bcrypt.hashSync('contraseña-de-relleno', 10);



const registrar = async (req, res) => {
  try {
    const { error, datos } = validarDatosUsuario(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const passwordHash = await bcrypt.hash(datos.password, 10);

    // El rol siempre es CLIENTE: el registro público nunca crea administradores ni empleados
    const id = await Usuario.crear({
      correo: datos.correo,
      passwordHash,
      rol: 'CLIENTE',
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
    });

    res.status(201).json({ ok: true, mensaje: 'Usuario registrado', data: { user_id: id } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un usuario con ese correo' });
    }
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { correo, password } = req.body || {};

    if (typeof correo !== 'string' || !correo.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ ok: false, mensaje: 'correo y password son obligatorios' });
    }

    const usuario = await Usuario.buscarPorCorreo(correo.trim().toLowerCase());
    const hash = usuario ? usuario.user_password_hash : HASH_FALSO;
    const coincide = await bcrypt.compare(password, hash);

    if (!usuario || !coincide || usuario.user_estado !== 'ACTIVO') {
      return res.status(401).json({ ok: false, mensaje: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign({ sub: String(usuario.user_id) }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      data: {
        token,
        usuario: {
          user_id: usuario.user_id,
          nombre: usuario.user_nombre,
          apellido: usuario.user_apellido,
          correo: usuario.user_correo,
          rol: usuario.role_nombre,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión' });
  }
};

const perfil = (req, res) => {
  res.json({ ok: true, data: req.usuario });
};

module.exports = { registrar, login, perfil };