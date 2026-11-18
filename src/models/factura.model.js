const pool = require('../config/db');

const SELECT_FACTURA = `
  SELECT f.fact_id, f.fact_numero, f.fact_fecha_emision, f.fact_subtotal, f.fact_impuestos,
         f.fact_descuento, f.fact_valor_descuento, f.fact_total, f.fact_estado,
         p.pago_id, p.pago_metodo, p.pago_referencia_transaccion, p.cita_id, c.cliente_id,
         CONCAT(u.user_nombre, ' ', u.user_apellido) AS cliente_nombre
  FROM factura f
  JOIN pago p ON p.pago_id = f.pago_id
  JOIN cita c ON c.cita_id = p.cita_id
  JOIN usuarios u ON u.user_id = c.cliente_id`;

const listar = async ({ clienteId, citaId } = {}) => {
  let sql = `${SELECT_FACTURA} WHERE 1 = 1`;
  const params = [];

  if (clienteId) {
    sql += ' AND c.cliente_id = ?';
    params.push(clienteId);
  }
  if (citaId) {
    sql += ' AND p.cita_id = ?';
    params.push(citaId);
  }
  sql += ' ORDER BY f.fact_numero DESC';

  const [filas] = await pool.query(sql, params);
  return filas;
};

const obtenerPorId = async (id) => {
  const [filas] = await pool.query(`${SELECT_FACTURA} WHERE f.fact_id = ?`, [id]);
  const factura = filas[0];
  if (!factura) return undefined;

  const [lineas] = await pool.query(
    `SELECT d.port_cita_id, pc.port_cita_nombre, d.deta_fact_cantidad,
            d.deta_fact_precio_unitario, d.deta_fact_subtotal_linea
     FROM detalle_factura d
     JOIN portafolio_citas pc ON pc.port_cita_id = d.port_cita_id
     WHERE d.fact_id = ?`,
    [id]
  );
  return { ...factura, detalle: lineas };
};

module.exports = { listar, obtenerPorId };