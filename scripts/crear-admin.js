require('dotenv').config();
const readline = require('readline/promises');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');
const Usuario = require('../src/models/usuario.model');

(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const correo = (await rl.question('Correo del administrador: ')).trim().toLowerCase();
    const password = await rl.question('Contraseña (8 a 72 caracteres): ');
    const nombre = (await rl.question('Nombre: ')).trim();
    const apellido = (await rl.question('Apellido: ')).trim();
    const telefono = (await rl.question('Teléfono: ')).trim();

    if (!correo || !nombre || !apellido || !telefono || password.length < 8 || password.length > 72) {
      console.error('Datos inválidos: revisa que no haya campos vacíos y que la contraseña tenga 8 a 72 caracteres.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await Usuario.crear({
      correo,
      passwordHash,
      rol: 'ADMIN',
      nombre,
      apellido,
      telefono,
    });
    console.log(`Administrador creado con user_id ${id}`);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('Ya existe un usuario con ese correo.');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    rl.close();
    await pool.end();
  }
})();