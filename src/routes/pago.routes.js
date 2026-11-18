const { Router } = require('express');
const controller = require('../controllers/pago.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

// Los pagos son solo para el administrador
router.use(autenticar, autorizar('ADMIN'));

router.post('/', controller.registrarPago);
router.get('/', controller.listarPagos);
router.get('/:id', controller.obtenerPago);

module.exports = router;