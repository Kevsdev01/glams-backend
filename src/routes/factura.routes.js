const { Router } = require('express');
const controller = require('../controllers/factura.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

// Administrador y clientes (estos solo ven las suyas); los empleados no acceden a finanzas
router.use(autenticar, autorizar('ADMIN', 'CLIENTE'));

router.get('/', controller.listarFacturas);
router.get('/:id', controller.obtenerFactura);

module.exports = router;