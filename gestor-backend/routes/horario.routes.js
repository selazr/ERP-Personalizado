const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horario.controller');

router.get('/:id', horarioController.getHorariosByTrabajador);
router.post('/', horarioController.createOrUpdateHorarios);

module.exports = router;
