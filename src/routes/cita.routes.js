const { Router } = require('express');
const controller = require('../controllers/cita.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.use(autenticar);

router.post('/', autorizar('CLIENTE', 'ADMIN'), controller.crearCita);
router.get('/', controller.listarCitas);
router.get('/:id', controller.obtenerCita);

module.exports = router;