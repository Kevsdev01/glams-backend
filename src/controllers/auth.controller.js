const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^\+?[0-9\s-]{7,20}$/;

const registrar = async (req, res) => {
  try {
    const { correo, password, nombre, apellido, telefono } = req.body || {};

    for (const valor of [correo, password, nombre, apellido, telefono]) {
      if (typeof valor !== 'string' || !valor.trim()) {
        return res.status(400).json({
          ok: false,
          mensaje: 'correo, password, nombre, apellido y telefono son obligatorios',
        });
      }
    }

    const correoLimpio = correo.trim().toLowerCase();
    if (!CORREO_REGEX.test(correoLimpio) || correoLimpio.length > 100) {
      return res.status(400).json({ ok: false, mensaje: 'El correo no es válido' });
    }
    if (password.length < 8 || password.length > 72) {
      return res
        .status(400)
        .json({ ok: false, mensaje: 'La contraseña debe tener entre 8 y 72 caracteres' });
    }
    if (nombre.trim().length > 50 || apellido.trim().length > 50) {
      return res
        .status(400)
        .json({ ok: false, mensaje: 'nombre y apellido admiten máx. 50 caracteres' });
    }
    if (!TELEFONO_REGEX.test(telefono.trim())) {
      return res.status(400).json({ ok: false, mensaje: 'El teléfono no es válido' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // El rol siempre es CLIENTE: el registro público nunca crea administradores ni empleados
    const id = await Usuario.crear({
      correo: correoLimpio,
      passwordHash,
      rol: 'CLIENTE',
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
    });

    res.status(201).json({ ok: true, mensaje: 'Usuario registrado', data: { user_id: id } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res
        .status(409)
        .json({ ok: false, mensaje: 'Ya existe un usuario con ese correo' });
    }
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el usuario' });
  }
};

module.exports = { registrar };