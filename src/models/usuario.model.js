const pool = require('../config/db');

const crear = async ({ correo, passwordHash, rol, nombre, apellido, telefono }) => {
  const [resultado] = await pool.query(
    `INSERT INTO usuarios
       (user_correo, user_password_hash, role_id, user_nombre, user_apellido, user_telefono)
     VALUES (?, ?, (SELECT role_id FROM roles WHERE role_nombre = ?), ?, ?, ?)`,
    [correo, passwordHash, rol, nombre, apellido, telefono]
  );
  return resultado.insertId;
};

const buscarPorCorreo = async (correo) => {
  const [filas] = await pool.query(
    `SELECT u.user_id, u.user_correo, u.user_password_hash, u.user_estado,
            u.user_nombre, u.user_apellido, r.role_nombre
     FROM usuarios u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_correo = ?`,
    [correo]
  );
  return filas[0];
};

const buscarPorId = async (id) => {
  const [filas] = await pool.query(
    `SELECT u.user_id, u.user_correo, u.user_estado,
            u.user_nombre, u.user_apellido, r.role_nombre
     FROM usuarios u
     JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = ?`,
    [id]
  );
  return filas[0];
};

module.exports = { crear, buscarPorCorreo, buscarPorId };