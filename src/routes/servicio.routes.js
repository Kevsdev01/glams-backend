const { Router } = require('express');
const controller = require('../controllers/servicio.controller');

const router = Router();

router.get('/', controller.listarServicios);
router.get('/:id', controller.obtenerServicio);
router.post('/', controller.crearServicio);
router.put('/:id', controller.actualizarServicio);
router.patch('/:id/estado', controller.cambiarEstadoServicio);

module.exports = router;