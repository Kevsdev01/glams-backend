const pool = require('../config/db');

const redondear = (n) => Math.round(n * 100) / 100;

// Registra el pago y emite la factura en una sola transacción
const registrarPago = async ({ citaId, metodo, referencia, impuestoPorcentaje }) => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // Bloquea la cita: dos cobros simultáneos de la misma cita se procesan uno tras otro
    const [citas] = await conexion.query(
      'SELECT cita_estado FROM cita WHERE cita_id = ? FOR UPDATE',
      [citaId]
    );
    if (citas.length === 0) {
      await conexion.rollback();
      return { error: 'CITA_NO_EXISTE' };
    }
    if (citas[0].cita_estado !== 'COMPLETADA') {
      await conexion.rollback();
      return { error: 'CITA_NO_COMPLETADA' };
    }

    const [pagados] = await conexion.query(
      "SELECT 1 FROM pago WHERE cita_id = ? AND pago_estado = 'APROBADO' LIMIT 1",
      [citaId]
    );
    if (pagados.length > 0) {
      await conexion.rollback();
      return { error: 'YA_PAGADA' };
    }

    const [lineas] = await conexion.query(
      'SELECT port_cita_id, deta_cita_precio FROM detalle_cita WHERE cita_id = ?',
      [citaId]
    );
    if (lineas.length === 0) {
      await conexion.rollback();
      return { error: 'SIN_SERVICIOS' };
    }

    const subtotal = redondear(lineas.reduce((suma, l) => suma + Number(l.deta_cita_precio), 0));
    const impuestos = redondear((subtotal * impuestoPorcentaje) / 100);
    const total = redondear(subtotal + impuestos);

    const [pago] = await conexion.query(
      `INSERT INTO pago
         (cita_id, pago_proveedor, pago_estado, pago_metodo,
          pago_referencia_transaccion, pago_valor, pago_fecha)
       VALUES (?, 'MANUAL', 'APROBADO', ?, ?, ?, NOW())`,
      [citaId, metodo, referencia, total]
    );

    // Siguiente número de factura (el UNIQUE de la base es la red de seguridad)
    const [ultima] = await conexion.query(
      'SELECT fact_numero FROM factura ORDER BY fact_numero DESC LIMIT 1 FOR UPDATE'
    );
    const numero = ultima.length ? ultima[0].fact_numero + 1 : 1;

    const [factura] = await conexion.query(
      `INSERT INTO factura (pago_id, fact_numero, fact_subtotal, fact_impuestos, fact_total)
       VALUES (?, ?, ?, ?, ?)`,
      [pago.insertId, numero, subtotal, impuestos, total]
    );

    for (const linea of lineas) {
      await conexion.query(
        `INSERT INTO detalle_factura
           (fact_id, port_cita_id, deta_fact_cantidad, deta_fact_precio_unitario, deta_fact_subtotal_linea)
         VALUES (?, ?, 1, ?, ?)`,
        [factura.insertId, linea.port_cita_id, linea.deta_cita_precio, linea.deta_cita_precio]
      );
    }

    await conexion.commit();
    return {
      pagoId: pago.insertId,
      facturaId: factura.insertId,
      numero,
      subtotal,
      impuestos,
      total,
    };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
};

const COLUMNAS = `pago_id, cita_id, pago_proveedor, pago_estado, pago_metodo,
                  pago_referencia_transaccion, pago_valor, pago_fecha`;

const listar = async ({ citaId } = {}) => {
  let sql = `SELECT ${COLUMNAS} FROM pago WHERE 1 = 1`;
  const params = [];
  if (citaId) {
    sql += ' AND cita_id = ?';
    params.push(citaId);
  }
  sql += ' ORDER BY pago_id DESC';

  const [filas] = await pool.query(sql, params);
  return filas;
};

const obtenerPorId = async (id) => {
  const [filas] = await pool.query(`SELECT ${COLUMNAS} FROM pago WHERE pago_id = ?`, [id]);
  return filas[0];
};

module.exports = { registrarPago, listar, obtenerPorId };