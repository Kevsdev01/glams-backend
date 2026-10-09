const pool = require('../config/db');

const COLUMNAS = `
  disp_empl_id, empleado_id, disp_empl_dia_semana,
  disp_empl_hora_inicio, disp_empl_hora_fin, disp_empl_estado`;

const listarPorEmpleado = async (empleadoId) => {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS}
     FROM disponibilidad_empleado
     WHERE empleado_id = ?
     ORDER BY disp_empl_dia_semana, disp_empl_hora_inicio`,
    [empleadoId]
  );
  return filas;
};

const obtenerPorId = async (id) => {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} FROM disponibilidad_empleado WHERE disp_empl_id = ?`,
    [id]
  );
  return filas[0];
};

// Dos rangos se cruzan cuando: inicio_existente < fin_nuevo Y fin_existente > inicio_nuevo
const existeSolape = async ({ empleadoId, diaSemana, horaInicio, horaFin, excluirId = 0 }) => {
  const [filas] = await pool.query(
    `SELECT 1
     FROM disponibilidad_empleado
     WHERE empleado_id = ?
       AND disp_empl_dia_semana = ?
       AND disp_empl_hora_inicio < ?
       AND disp_empl_hora_fin > ?
       AND disp_empl_id <> ?
     LIMIT 1`,
    [empleadoId, diaSemana, horaFin, horaInicio, excluirId]
  );
  return filas.length > 0;
};

const crear = async ({ empleadoId, diaSemana, horaInicio, horaFin, estado }) => {
  const [resultado] = await pool.query(
    `INSERT INTO disponibilidad_empleado
       (empleado_id, disp_empl_dia_semana, disp_empl_hora_inicio, disp_empl_hora_fin, disp_empl_estado)
     VALUES (?, ?, ?, ?, ?)`,
    [empleadoId, diaSemana, horaInicio, horaFin, estado]
  );
  return resultado.insertId;
};

const actualizar = async (id, { diaSemana, horaInicio, horaFin, estado }) => {
  await pool.query(
    `UPDATE disponibilidad_empleado
     SET disp_empl_dia_semana = ?, disp_empl_hora_inicio = ?,
         disp_empl_hora_fin = ?, disp_empl_estado = ?
     WHERE disp_empl_id = ?`,
    [diaSemana, horaInicio, horaFin, estado, id]
  );
};

const eliminar = async (id) => {
  await pool.query('DELETE FROM disponibilidad_empleado WHERE disp_empl_id = ?', [id]);
};

// ¿Existe un bloque DISPONIBLE que contenga todo el rango [horaInicio, horaFin]?
const estaDentroDeHorario = async ({ empleadoId, diaSemana, horaInicio, horaFin }) => {
  const [filas] = await pool.query(
    `SELECT 1
     FROM disponibilidad_empleado
     WHERE empleado_id = ?
       AND disp_empl_dia_semana = ?
       AND disp_empl_estado = 'DISPONIBLE'
       AND disp_empl_hora_inicio <= ?
       AND disp_empl_hora_fin >= ?
     LIMIT 1`,
    [empleadoId, diaSemana, horaInicio, horaFin]
  );
  return filas.length > 0;
};

module.exports = {
  listarPorEmpleado,
  obtenerPorId,
  existeSolape,
  estaDentroDeHorario,
  crear,
  actualizar,
  eliminar,
};