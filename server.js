require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
  if (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});