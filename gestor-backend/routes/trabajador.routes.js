const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const empresa = require('../middlewares/empresa');
const trabajadorController = require('../controllers/trabajador.controller');

router.get('/', auth, empresa, trabajadorController.getAll);
router.get('/estadisticas', auth, empresa, trabajadorController.getStats);
router.get('/organizacion', auth, empresa, trabajadorController.getOrganizationInfo);
router.get('/:id', auth, empresa, trabajadorController.getById);
router.post('/', auth, empresa, trabajadorController.create);
router.put('/:id', auth, empresa, trabajadorController.update);
router.delete('/:id', auth, empresa, trabajadorController.remove);

module.exports = router;
