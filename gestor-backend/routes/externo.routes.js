const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const empresa = require('../middlewares/empresa');
const externoController = require('../controllers/externo.controller');

router.post('/', auth, empresa, externoController.createOrUpdate);
router.get('/', auth, empresa, externoController.getExternos);
router.get('/empresas', auth, empresa, externoController.getEmpresas);
router.delete('/', auth, empresa, externoController.deleteExterno);

module.exports = router;
