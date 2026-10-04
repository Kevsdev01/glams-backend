const pool = require('../config/db');

const listar = async () => {
  const [filas] = await pool.query(
    'SELECT cate_id, cate_nombre, cate_tipo, cate_descripcion FROM categoria ORDER BY cate_nombre'
  );
  return filas;
};

const obtenerPorId = async (id) => {
  const [filas] = await pool.query(
    'SELECT cate_id, cate_nombre, cate_tipo, cate_descripcion FROM categoria WHERE cate_id = ?',
    [id]
  );
  return filas[0];
};

const crear = async ({ nombre, tipo, descripcion }) => {
  const [resultado] = await pool.query(
    'INSERT INTO categoria (cate_nombre, cate_tipo, cate_descripcion) VALUES (?, ?, ?)',
    [nombre, tipo, descripcion]
  );
  return resultado.insertId;
};

module.exports = { listar, obtenerPorId, crear };