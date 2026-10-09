const pool = require('../config/db');

const cruceEmpleado = async (conexion, empleadoId, inicio, fin) => {
  const [filas] = await conexion.query(
    `SELECT 1 FROM cita
     WHERE id_empleado = ?
       AND cita_estado IN ('PENDIENTE', 'CONFIRMADA')
       AND cita_hora_inicio < ? AND cita_hora_fin > ?
     LIMIT 1`,
    [empleadoId, fin, inicio]
  );
  return filas.length > 0;
};

const cruceCliente = async (conexion, clienteId, inicio, fin) => {
  const [filas] = await conexion.query(
    `SELECT 1 FROM cita
     WHERE cliente_id = ?
       AND cita_estado IN ('PENDIENTE', 'CONFIRMADA')
       AND cita_hora_inicio < ? AND cita_hora_fin > ?
     LIMIT 1`,
    [clienteId, fin, inicio]
  );
  return filas.length > 0;
};

// Guarda la cita y sus servicios en una sola transacción
const crear = async ({ clienteId, empleadoId, inicio, fin, servicios }) => {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    // Bloquea al empleado: las reservas simultáneas para él se procesan una tras otra
    await conexion.query('SELECT user_id FROM usuarios WHERE user_id = ? FOR UPDATE', [empleadoId]);

    if (await cruceEmpleado(conexion, empleadoId, inicio, fin)) {
      await conexion.rollback();
      return { error: 'EMPLEADO_OCUPADO' };
    }
    if (await cruceCliente(conexion, clienteId, inicio, fin)) {
      await conexion.rollback();
      return { error: 'CLIENTE_OCUPADO' };
    }

    const [resultado] = await conexion.query(
      `INSERT INTO cita (cliente_id, id_empleado, cita_hora_inicio, cita_hora_fin)
       VALUES (?, ?, ?, ?)`,
      [clienteId, empleadoId, inicio, fin]
    );
    const citaId = resultado.insertId;

    for (const servicio of servicios) {
      await conexion.query(
        'INSERT INTO detalle_cita (cita_id, port_cita_id, deta_cita_precio) VALUES (?, ?, ?)',
        [citaId, servicio.id, servicio.precio]
      );
    }

    await conexion.commit();
    return { citaId };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
};

const SELECT_CITA = `
  SELECT c.cita_id, c.cliente_id,
         CONCAT(uc.user_nombre, ' ', uc.user_apellido) AS cliente_nombre,
         c.id_empleado,
         CONCAT(ue.user_nombre, ' ', ue.user_apellido) AS empleado_nombre,
         c.cita_hora_inicio, c.cita_hora_fin, c.cita_estado, c.cita_motivo_cancelacion,
         (SELECT GROUP_CONCAT(p.port_cita_nombre SEPARATOR ', ')
            FROM detalle_cita d
            JOIN portafolio_citas p ON p.port_cita_id = d.port_cita_id
           WHERE d.cita_id = c.cita_id) AS servicios,
         (SELECT SUM(d.deta_cita_precio) FROM detalle_cita d WHERE d.cita_id = c.cita_id) AS total
  FROM cita c
  JOIN usuarios uc ON uc.user_id = c.cliente_id
  JOIN usuarios ue ON ue.user_id = c.id_empleado`;

const listar = async ({ clienteId, empleadoId, estado, fecha } = {}) => {
  let sql = `${SELECT_CITA} WHERE 1 = 1`;
  const params = [];

  if (clienteId) {
    sql += ' AND c.cliente_id = ?';
    params.push(clienteId);
  }
  if (empleadoId) {
    sql += ' AND c.id_empleado = ?';
    params.push(empleadoId);
  }
  if (estado) {
    sql += ' AND c.cita_estado = ?';
    params.push(estado);
  }
  if (fecha) {
    sql += ' AND c.cita_hora_inicio >= ? AND c.cita_hora_inicio < DATE_ADD(?, INTERVAL 1 DAY)';
    params.push(fecha, fecha);
  }
  sql += ' ORDER BY c.cita_hora_inicio DESC';

  const [filas] = await pool.query(sql, params);
  return filas;
};

const obtenerPorId = async (id) => {
  const [filas] = await pool.query(`${SELECT_CITA} WHERE c.cita_id = ?`, [id]);
  const cita = filas[0];
  if (!cita) return undefined;

  const [servicios] = await pool.query(
    `SELECT d.port_cita_id, p.port_cita_nombre, p.port_cita_duracion_minutos, d.deta_cita_precio
     FROM detalle_cita d
     JOIN portafolio_citas p ON p.port_cita_id = d.port_cita_id
     WHERE d.cita_id = ?`,
    [id]
  );
  return { ...cita, detalle: servicios };
};

module.exports = { crear, listar, obtenerPorId };