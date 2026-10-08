const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM roles');
    res.json({
      ok: true,
      mensaje: 'Servidor y base de datos funcionando',
      roles: rows[0].total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error al conectar con la base de datos' });
  }
});

app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/servicios', require('./routes/servicio.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

module.exports = app;