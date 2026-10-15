const { Router } = require('express');
const controller = require('../controllers/cita.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.use(autenticar);

// IMPORTANTE: esta ruta va antes de '/:id'; si no, Express tomaría "horas-libres" como un id
router.get('/horas-libres', controller.horasLibres);

router.post('/', autorizar('CLIENTE', 'ADMIN'), controller.crearCita);
router.get('/', controller.listarCitas);
router.get('/:id', controller.obtenerCita);
router.patch('/:id/estado', controller.cambiarEstadoCita);

module.exports = router;