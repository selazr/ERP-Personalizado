const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const trabajadorController = require('../controllers/trabajador.controller');

router.get('/', auth, trabajadorController.getAll);
router.get('/estadisticas', auth, trabajadorController.getStats);
router.get('/organizacion', auth, trabajadorController.getOrganizationInfo);
router.get('/:id', auth, trabajadorController.getById);
router.post('/', auth, trabajadorController.create);
router.put('/:id', auth, trabajadorController.update);
router.delete('/:id', auth, trabajadorController.remove);

module.exports = router;

