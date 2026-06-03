const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const autonomoController = require('../controllers/autonomo.controller');

router.get('/', auth, autonomoController.getAll);

module.exports = router;
