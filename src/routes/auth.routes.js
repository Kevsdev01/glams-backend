const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/registro', controller.registrar);
router.post('/login', controller.login);
router.get('/perfil', autenticar, controller.perfil);

module.exports = router;