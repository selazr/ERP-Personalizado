const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const autonomo = require('../middlewares/autonomo');
const trabajadorAutonomoController = require('../controllers/trabajador_autonomo.controller');

router.get('/', auth, autonomo, trabajadorAutonomoController.getAll);
router.get('/estadisticas', auth, autonomo, trabajadorAutonomoController.getStats);
router.get('/organizacion', auth, autonomo, trabajadorAutonomoController.getOrganizationInfo);
router.get('/:id', auth, autonomo, trabajadorAutonomoController.getById);
router.post('/', auth, autonomo, trabajadorAutonomoController.create);
router.put('/:id', auth, autonomo, trabajadorAutonomoController.update);
router.delete('/:id', auth, autonomo, trabajadorAutonomoController.remove);

module.exports = router;
