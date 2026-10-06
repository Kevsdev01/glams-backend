const pool = require('../config/db');

const COLUMNAS = `
  p.port_cita_id, p.cate_id, c.cate_nombre,
  p.port_cita_nombre, p.port_cita_tipo, p.port_cita_precio,
  p.port_cita_duracion_minutos, p.port_cita_estado`;

const listar = async ({ categoriaId, estado } = {}) => {
  let sql = `SELECT ${COLUMNAS}
             FROM portafolio_citas p
             JOIN categoria c ON c.cate_id = p.cate_id
             WHERE 1 = 1`;
  const params = [];

  if (categoriaId) {
    sql += ' AND p.cate_id = ?';
    params.push(categoriaId);
  }
  if (estado) {
    sql += ' AND p.port_cita_estado = ?';
    params.push(estado);
  }
  sql += ' ORDER BY p.port_cita_nombre';

  const [filas] = await pool.query(sql, params);
  return filas;
};

const obtenerPorId = async (id) => {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS}
     FROM portafolio_citas p
     JOIN categoria c ON c.cate_id = p.cate_id
     WHERE p.port_cita_id = ?`,
    [id]
  );
  return filas[0];
};

const crear = async ({ categoriaId, nombre, tipo, precio, duracionMinutos }) => {
  const [resultado] = await pool.query(
    `INSERT INTO portafolio_citas
       (cate_id, port_cita_nombre, port_cita_tipo, port_cita_precio, port_cita_duracion_minutos)
     VALUES (?, ?, ?, ?, ?)`,
    [categoriaId, nombre, tipo, precio, duracionMinutos]
  );
  return resultado.insertId;
};

module.exports = { listar, obtenerPorId, crear };