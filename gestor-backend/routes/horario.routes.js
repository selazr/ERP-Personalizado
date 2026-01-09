const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const empresa = require('../middlewares/empresa');
const horarioController = require('../controllers/horario.controller');

router.get('/:id', auth, empresa, horarioController.getHorariosByTrabajador);
router.post('/', auth, empresa, horarioController.createOrUpdateHorarios);

module.exports = router;
