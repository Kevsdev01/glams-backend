const { Router } = require('express');
const controller = require('../controllers/usuario.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas de este archivo exigen ser administrador
router.use(autenticar, autorizar('ADMIN'));

router.post('/empleados', controller.crearEmpleado);
router.get('/', controller.listarUsuarios);
router.get('/:id', controller.obtenerUsuario);
router.patch('/:id/estado', controller.cambiarEstadoUsuario);

module.exports = router;