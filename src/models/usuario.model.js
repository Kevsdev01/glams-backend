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

module.exports = { crear };