const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middlewares/auth');
const empresa = require('../middlewares/empresa');
const trabajadorController = require('../controllers/trabajador.controller');

const uploadNda = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('El NDA debe ser un archivo PDF'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.get('/', auth, empresa, trabajadorController.getAll);
router.get('/estadisticas', auth, empresa, trabajadorController.getStats);
router.get('/organizacion', auth, empresa, trabajadorController.getOrganizationInfo);
router.get('/:id/nda', auth, empresa, trabajadorController.downloadNda);
router.get('/:id', auth, empresa, trabajadorController.getById);
router.post('/', auth, empresa, trabajadorController.create);
router.post('/:id/nda', auth, empresa, uploadNda.single('nda'), trabajadorController.uploadNda);
router.put('/:id', auth, empresa, trabajadorController.update);
router.delete('/:id', auth, empresa, trabajadorController.remove);

router.use((err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(400).json({ error: err.message || 'Error subiendo NDA' });
});

module.exports = router;
