const { Router } = require('express');
const controller = require('../controllers/categoria.controller');
const { autenticar, autorizar } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', controller.listarCategorias);
router.get('/:id', controller.obtenerCategoria);
router.post('/', autenticar, autorizar('ADMIN'), controller.crearCategoria);
router.put('/:id', autenticar, autorizar('ADMIN'), controller.actualizarCategoria);
router.delete('/:id', autenticar, autorizar('ADMIN'), controller.eliminarCategoria);

module.exports = router;