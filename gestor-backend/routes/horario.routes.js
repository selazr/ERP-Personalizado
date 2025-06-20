const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const horarioController = require('../controllers/horario.controller');

router.get('/:id', auth, horarioController.getHorariosByTrabajador);
router.post('/', auth, horarioController.createOrUpdateHorarios);

module.exports = router;
