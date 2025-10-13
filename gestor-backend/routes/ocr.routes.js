const express = require('express');
const multer = require('multer');
const path = require('path');
const { processImage } = require('../controllers/ocr.controller');
const { ensureDirsSync, ORIGINAL_DIR } = require('../services/ocr.service');

ensureDirsSync();

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ORIGINAL_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = file.originalname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${baseName || 'archivo'}${ext || '.png'}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

router.post('/procesar', upload.single('imagen'), (req, res, next) => {
  processImage(req, res, next);
});

// Manejo de errores específicos de carga
router.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(400).json({ error: err.message || 'Error procesando la imagen' });
});

module.exports = router;
