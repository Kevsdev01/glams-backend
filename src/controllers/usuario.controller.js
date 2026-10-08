const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');
const { validarDatosUsuario } = require('../utils/validaciones');

const ROLES = ['ADMIN', 'CLIENTE', 'EMPLEADO'];
const ESTADOS = ['ACTIVO', 'INACTIVO'];

const crearEmpleado = async (req, res) => {
  try {
    const { error, datos } = validarDatosUsuario(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const passwordHash = await bcrypt.hash(datos.password, 10);
    const id = await Usuario.crear({
      correo: datos.correo,
      passwordHash,
      rol: 'EMPLEADO',
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
    });

    res.status(201).json({ ok: true, mensaje: 'Empleado creado', data: { user_id: id } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un usuario con ese correo' });
    }
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el empleado' });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const { rol, estado } = req.query;

    if (rol && !ROLES.includes(rol)) {
      return res.status(400).json({ ok: false, mensaje: 'rol debe ser ADMIN, CLIENTE o EMPLEADO' });
    }
    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'estado debe ser ACTIVO o INACTIVO' });
    }

    const usuarios = await Usuario.listar({ rol, estado });
    res.json({ ok: true, data: usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al listar los usuarios' });
  }
};

const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.buscarPorId(req.params.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }
    res.json({ ok: true, data: usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el usuario' });
  }
};

const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { estado } = req.body || {};
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'estado debe ser ACTIVO o INACTIVO' });
    }

    // Evita que el administrador se bloquee a sí mismo por accidente
    if (Number(req.params.id) === req.usuario.id) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes cambiar tu propio estado' });
    }

    const existente = await Usuario.buscarPorId(req.params.id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    await Usuario.cambiarEstado(req.params.id, estado);
    res.json({
      ok: true,
      mensaje: estado === 'ACTIVO' ? 'Usuario activado' : 'Usuario desactivado',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al cambiar el estado del usuario' });
  }
};

module.exports = { crearEmpleado, listarUsuarios, obtenerUsuario, cambiarEstadoUsuario };