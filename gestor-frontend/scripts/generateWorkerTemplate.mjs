import path from 'path';
import { fileURLToPath } from 'url';
import { exportWorkerToExcel } from '../src/utils/exportWorkerExcel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(__dirname, '../../docs/templates/plantilla_trabajador.xlsx');

exportWorkerToExcel({}, output);
console.log(`Generated ${output}`);
