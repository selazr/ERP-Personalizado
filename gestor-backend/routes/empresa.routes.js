const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const empresaController = require('../controllers/empresa.controller');

router.get('/', auth, empresaController.getAll);

module.exports = router;
