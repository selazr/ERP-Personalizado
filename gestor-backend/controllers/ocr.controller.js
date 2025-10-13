const path = require('path');
const fs = require('fs/promises');
const {
  preprocessImage,
  recognizeText,
  ensureDirsSync,
  PROCESSED_DIR,
  ONE_WEEK_MS,
} = require('../services/ocr.service');

ensureDirsSync();

exports.processImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ninguna imagen' });
  }

  try {
    const originalFilename = req.file.filename;
    const baseName = path.parse(originalFilename).name;
    const processedFilename = `${baseName}-processed.png`;
    const processedPath = path.join(PROCESSED_DIR, processedFilename);

    const processedBuffer = await preprocessImage(req.file.path);
    await fs.writeFile(processedPath, processedBuffer);

    const text = await recognizeText(processedBuffer);

    const expiresAt = new Date(Date.now() + ONE_WEEK_MS).toISOString();

    return res.json({
      texto: text,
      originalUrl: `/uploads/ocr/original/${originalFilename}`,
      procesadaUrl: `/uploads/ocr/processed/${processedFilename}`,
      expiraEl: expiresAt,
    });
  } catch (err) {
    console.error('Error procesando imagen OCR:', err);
    return res.status(500).json({ error: 'No se pudo procesar la imagen' });
  }
};
