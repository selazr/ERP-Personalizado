import { exportObjectToCSV } from './exportCsv.js';

export function exportWorkerToCsv(trabajador) {
  const fields = [
    'nombre', 'dni', 'correo_electronico', 'telefono', 'tipo_trabajador',
    'grupo', 'categoria', 'iban', 'nss', 'fecha_alta', 'fecha_baja',
    'horas_contratadas', 'salario_neto', 'salario_bruto', 'direccion',
    'desplazamiento', 'fecha_desplazamiento', 'cliente', 'a1', 'fecha_limosa',
    'condiciones', 'pais', 'epis', 'fecha_epis', 'empresa'
  ];
  const obj = {};
  fields.forEach(f => {
    obj[f] = trabajador[f] ?? '';
  });
  exportObjectToCSV(obj, `trabajador_${trabajador.nombre}.csv`);
}
