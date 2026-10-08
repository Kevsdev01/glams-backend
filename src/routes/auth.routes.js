const { Router } = require('express');
const controller = require('../controllers/auth.controller');

const router = Router();

router.post('/registro', controller.registrar);

module.exports = router;