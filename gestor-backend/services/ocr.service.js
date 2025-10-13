const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

const UPLOAD_BASE = path.join(__dirname, '..', 'uploads', 'ocr');
const ORIGINAL_DIR = path.join(UPLOAD_BASE, 'original');
const PROCESSED_DIR = path.join(UPLOAD_BASE, 'processed');
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // cada 6 horas

function ensureDirsSync() {
  [ORIGINAL_DIR, PROCESSED_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

async function preprocessImage(filePath) {
  // Realza contraste, elimina ruido y genera PNG optimizado
  return sharp(filePath)
    .grayscale()
    .normalize()
    .median(1)
    .sharpen()
    .linear(1.15, -10) // incrementa contraste y reduce brillo leve
    .resize({
      width: 2000,
      height: 2000,
      fit: 'inside',
      withoutEnlargement: false,
    })
    .threshold(160)
    .toFormat('png')
    .toBuffer();
}

function postProcessText(text) {
  const normalized = text
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/\u00b7/g, '.');

  const cleanedLines = normalized
    .split('\n')
    .map((line) => line.replace(/\s{2,}/g, ' ').trim())
    .map((line) => line.replace(/(?<=\d)O(?=\d)/g, '0'))
    .map((line) => line.replace(/(?<=\d)I(?=\d)/g, '1'))
    .filter((line, index, arr) => line.length > 0 || (index < arr.length - 1 && arr[index + 1].length > 0));

  return cleanedLines.join('\n').trim();
}

async function recognizeText(imageBuffer) {
  const { data } = await Tesseract.recognize(imageBuffer, 'spa+eng', {
    tessjs_create_pdf: '0',
    preserve_interword_spaces: '1',
  });

  return postProcessText(data.text || '');
}

async function cleanupExpiredFiles() {
  const now = Date.now();
  const directories = [ORIGINAL_DIR, PROCESSED_DIR];

  await Promise.all(
    directories.map(async (dir) => {
      const files = await fsp.readdir(dir);
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dir, file);
          try {
            const stats = await fsp.stat(filePath);
            if (now - stats.mtimeMs > ONE_WEEK_MS) {
              await fsp.unlink(filePath);
            }
          } catch (err) {
            // Ignorar archivos que desaparecen entre lectura y borrado
            if (err.code !== 'ENOENT') {
              console.error(`Error eliminando archivo vencido ${filePath}:`, err);
            }
          }
        }),
      );
    }),
  );
}

function scheduleCleanup() {
  ensureDirsSync();
  cleanupExpiredFiles().catch((err) => console.error('Error en limpieza inicial de OCR:', err));
  setInterval(() => {
    cleanupExpiredFiles().catch((err) => console.error('Error limpiando OCR vencido:', err));
  }, CLEANUP_INTERVAL_MS);
}

module.exports = {
  ensureDirsSync,
  preprocessImage,
  recognizeText,
  scheduleCleanup,
  ORIGINAL_DIR,
  PROCESSED_DIR,
  ONE_WEEK_MS,
};
