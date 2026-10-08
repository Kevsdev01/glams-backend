const { Router } = require('express');
const controller = require('../controllers/servicio.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', controller.listarServicios);
router.get('/:id', controller.obtenerServicio);
router.post('/', autenticar, autorizar('ADMIN'), controller.crearServicio);
router.put('/:id', autenticar, autorizar('ADMIN'), controller.actualizarServicio);
router.patch('/:id/estado', autenticar, autorizar('ADMIN'), controller.cambiarEstadoServicio);

module.exports = router;