const { Router } = require('express');
const controller = require('../controllers/disponibilidad.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

// Cualquier usuario con sesión puede consultar horarios (los clientes los necesitarán para agendar)
router.get('/', autenticar, controller.listarDisponibilidad);

// Solo el administrador los modifica
router.post('/', autenticar, autorizar('ADMIN'), controller.crearDisponibilidad);
router.put('/:id', autenticar, autorizar('ADMIN'), controller.actualizarDisponibilidad);
router.delete('/:id', autenticar, autorizar('ADMIN'), controller.eliminarDisponibilidad);

module.exports = router;