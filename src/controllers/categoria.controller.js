const Categoria = require('../models/categoria.model');

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
    const { nombre, tipo, descripcion } = req.body || {};

    if (!nombre || !tipo || !descripcion) {
      return res
        .status(400)
        .json({ ok: false, mensaje: 'nombre, tipo y descripcion son obligatorios' });
    }
    if (nombre.length > 50 || tipo.length > 20) {
      return res
        .status(400)
        .json({ ok: false, mensaje: 'nombre admite máx. 50 caracteres y tipo máx. 20' });
    }

    const id = await Categoria.crear({
      nombre: nombre.trim(),
      tipo: tipo.trim(),
      descripcion: descripcion.trim(),
    });
    res.status(201).json({ ok: true, mensaje: 'Categoría creada', data: { cate_id: id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al crear la categoría' });
  }
};

module.exports = { listarCategorias, obtenerCategoria, crearCategoria };