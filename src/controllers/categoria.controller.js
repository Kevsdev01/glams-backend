const Categoria = require('../models/categoria.model');

// Valida y limpia los datos; la usan crear y actualizar
const validarDatos = (body) => {
  const { nombre, tipo, descripcion } = body || {};

  if (
    typeof nombre !== 'string' || !nombre.trim() ||
    typeof tipo !== 'string' || !tipo.trim() ||
    typeof descripcion !== 'string' || !descripcion.trim()
  ) {
    return { error: 'nombre, tipo y descripcion son obligatorios' };
  }
  if (nombre.trim().length > 50 || tipo.trim().length > 20) {
    return { error: 'nombre admite máx. 50 caracteres y tipo máx. 20' };
  }

  return {
    datos: {
      nombre: nombre.trim(),
      tipo: tipo.trim(),
      descripcion: descripcion.trim(),
    },
  };
};

const listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.listar();
    res.json({ ok: true, data: categorias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al listar las categorías' });
  }
};

const obtenerCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.obtenerPorId(req.params.id);
    if (!categoria) {
      return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
    }
    res.json({ ok: true, data: categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener la categoría' });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { error, datos } = validarDatos(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const id = await Categoria.crear(datos);
    res.status(201).json({ ok: true, mensaje: 'Categoría creada', data: { cate_id: id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la categoría' });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const { error, datos } = validarDatos(req.body);
    if (error) {
      return res.status(400).json({ ok: false, mensaje: error });
    }

    const existente = await Categoria.obtenerPorId(req.params.id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
    }

    await Categoria.actualizar(req.params.id, datos);
    res.json({ ok: true, mensaje: 'Categoría actualizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar la categoría' });
  }
};

const eliminarCategoria = async (req, res) => {
  try {
    const existente = await Categoria.obtenerPorId(req.params.id);
    if (!existente) {
      return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
    }

    await Categoria.eliminar(req.params.id);
    res.json({ ok: true, mensaje: 'Categoría eliminada' });
  } catch (error) {
    // Código que MySQL devuelve cuando otra tabla depende de este registro
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        ok: false,
        mensaje: 'No se puede eliminar: la categoría tiene servicios asociados',
      });
    }
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar la categoría' });
  }
};

module.exports = {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};