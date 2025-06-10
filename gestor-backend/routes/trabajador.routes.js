const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajador.controller');

router.get('/', trabajadorController.getAll);
router.get('/:id', trabajadorController.getById);
router.post('/', trabajadorController.create);
router.put('/:id', trabajadorController.update);
router.delete('/:id', trabajadorController.remove);

module.exports = router;
