const Disponibilidad = require('../models/disponibilidad.model');
const Usuario = require('../models/usuario.model');

const ESTADOS = ['DISPONIBLE', 'NO_DISPONIBLE'];
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // formato HH:MM de 00:00 a 23:59

// Valida los datos del bloque; la usan crear y actualizar
const validarBloque = (body) => {
  const { diaSemana, horaInicio, horaFin, estado } = body || {};

  if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) {
    return { error: 'diaSemana debe ser un entero de 1 (lunes) a 7 (domingo)' };
  }
  if (typeof horaInicio !== 'string' || !HORA_REGEX.test(horaInicio) ||
      typeof horaFin !== 'string' || !HORA_REGEX.test(horaFin)) {
    return { error: 'horaInicio y horaFin deben tener formato HH:MM (por ejemplo 09:00)' };
  }
  if (horaFin <= horaInicio) {
    return { error: 'horaFin debe ser posterior a horaInicio' };
  }
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    return { error: 'estado debe ser DISPONIBLE o NO_DISPONIBLE' };
  }

  return { datos: { diaSemana, horaInicio, horaFin, estado } };
};

const listarDisponibilidad = async (req, res) => {
  try {
    const { empleadoId } = req.query;
    if (!empleadoId || !/^\d+$/.test(empleadoId)) {
      return res.status(400).json({ ok: false, mensaje: 'empleadoId es obligatorio y debe ser un número' });
    }

    const empleado = await Usuario.buscarPorId(empleadoId);
    if (!empleado || empleado.role_nombre !== 'EMPLEADO') {
      return res.status(404).json({ ok: false, mensaje: 'Empleado no encontrado' });
    }

    const bloques = await Disponibilidad.listarPorEmpleado(empleadoId);
    res.json({ ok: true, data: bloques });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al listar la disponibilidad' });
  }
};

const crearDisponibilidad = async (req, res) => {
  try {
    const { empleadoId } = req.body || {};
    if (!Number.isInteger(empleadoId) || empleadoId < 1) {
      return res.status(400).json({ ok: false, mensaje: 'empleadoId debe ser un entero válido' });
    }

    const { error, datos } = validarBloque(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const empleado = await Usuario.buscarPorId(empleadoId);
    if (!empleado || empleado.role_nombre !== 'EMPLEADO' || empleado.user_estado !== 'ACTIVO') {
      return res
        .status(400)
        .json({ ok: false, mensaje: 'El empleado indicado no existe o no está activo' });
    }

    if (await Disponibilidad.existeSolape({ empleadoId, ...datos })) {
      return res
        .status(409)
        .json({ ok: false, mensaje: 'El horario se cruza con otro ya registrado para ese día' });
    }

    const id = await Disponibilidad.crear({
      empleadoId,
      ...datos,
      estado: datos.estado || 'DISPONIBLE',
    });
    res.status(201).json({ ok: true, mensaje: 'Horario creado', data: { disp_empl_id: id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el horario' });
  }
};

const actualizarDisponibilidad = async (req, res) => {
  try {
    const { error, datos } = validarBloque(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const existente = await Disponibilidad.obtenerPorId(req.params.id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Horario no encontrado' });
    }

    const solapa = await Disponibilidad.existeSolape({
      empleadoId: existente.empleado_id,
      ...datos,
      excluirId: existente.disp_empl_id, // no compararlo consigo mismo
    });
    if (solapa) {
      return res
        .status(409)
        .json({ ok: false, mensaje: 'El horario se cruza con otro ya registrado para ese día' });
    }

    await Disponibilidad.actualizar(req.params.id, {
      ...datos,
      estado: datos.estado || existente.disp_empl_estado, // si no lo envían, se conserva
    });
    res.json({ ok: true, mensaje: 'Horario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el horario' });
  }
};

const eliminarDisponibilidad = async (req, res) => {
  try {
    const existente = await Disponibilidad.obtenerPorId(req.params.id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Horario no encontrado' });
    }

    await Disponibilidad.eliminar(req.params.id);
    res.json({ ok: true, mensaje: 'Horario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar el horario' });
  }
};

module.exports = {
  listarDisponibilidad,
  crearDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad,
};