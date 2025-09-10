const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const externoController = require('../controllers/externo.controller');

router.post('/', auth, externoController.createOrUpdate);
router.get('/', auth, externoController.getExternos);
router.get('/empresas', auth, externoController.getEmpresas);
router.delete('/', auth, externoController.deleteExterno);

module.exports = router;
