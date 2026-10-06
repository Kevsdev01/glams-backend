const Servicio = require('../models/servicio.model');
const Categoria = require('../models/categoria.model');

const ESTADOS = ['ACTIVO', 'INACTIVO'];

// Valida y limpia los datos; también la usará "actualizar" en el siguiente paso
const validarDatos = async (body) => {
  const { categoriaId, nombre, tipo, precio, duracionMinutos } = body || {};

  if (typeof nombre !== 'string' || !nombre.trim() || typeof tipo !== 'string' || !tipo.trim()) {
    return { error: 'nombre y tipo son obligatorios' };
  }
  if (nombre.trim().length > 100 || tipo.trim().length > 20) {
    return { error: 'nombre admite máx. 100 caracteres y tipo máx. 20' };
  }
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio <= 0 || precio > 99999999.99) {
    return { error: 'precio debe ser un número mayor que 0' };
  }
  if (!Number.isInteger(duracionMinutos) || duracionMinutos < 1 || duracionMinutos > 1440) {
    return { error: 'duracionMinutos debe ser un entero entre 1 y 1440' };
  }
  if (!Number.isInteger(categoriaId) || categoriaId < 1) {
    return { error: 'categoriaId debe ser un entero válido' };
  }

  const categoria = await Categoria.obtenerPorId(categoriaId);
  if (!categoria) {
    return { error: 'La categoría indicada no existe' };
  }

  return {
    datos: {
      categoriaId,
      nombre: nombre.trim(),
      tipo: tipo.trim(),
      precio: Math.round(precio * 100) / 100,
      duracionMinutos,
    },
  };
};

const listarServicios = async (req, res) => {
  try {
    const { categoriaId, estado } = req.query;

    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'estado debe ser ACTIVO o INACTIVO' });
    }
    if (categoriaId && !/^\d+$/.test(categoriaId)) {
      return res.status(400).json({ ok: false, mensaje: 'categoriaId debe ser un número' });
    }

    const servicios = await Servicio.listar({ categoriaId, estado });
    res.json({ ok: true, data: servicios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al listar los servicios' });
  }
};

const obtenerServicio = async (req, res) => {
  try {
    const servicio = await Servicio.obtenerPorId(req.params.id);
    if (!servicio) {
      return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado' });
    }
    res.json({ ok: true, data: servicio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener el servicio' });
  }
};

const crearServicio = async (req, res) => {
  try {
    const { error, datos } = await validarDatos(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const id = await Servicio.crear(datos);
    res.status(201).json({ ok: true, mensaje: 'Servicio creado', data: { port_cita_id: id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al crear el servicio' });
  }
};

const actualizarServicio = async (req, res) => {
  try {
    const { error, datos } = await validarDatos(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const existente = await Servicio.obtenerPorId(req.params.id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado' });
    }

    await Servicio.actualizar(req.params.id, datos);
    res.json({ ok: true, mensaje: 'Servicio actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar el servicio' });
  }
};

const cambiarEstadoServicio = async (req, res) => {
  try {
    const { estado } = req.body || {};
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: 'estado debe ser ACTIVO o INACTIVO' });
    }

    const existente = await Servicio.obtenerPorId(req.params.id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado' });
    }

    await Servicio.cambiarEstado(req.params.id, estado);
    res.json({
      ok: true,
      mensaje: estado === 'ACTIVO' ? 'Servicio activado' : 'Servicio desactivado',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al cambiar el estado del servicio' });
  }
};

module.exports = {
  listarServicios,
  obtenerServicio,
  crearServicio,
  actualizarServicio,
  cambiarEstadoServicio,
};