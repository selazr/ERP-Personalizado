import * as XLSX from 'xlsx-js-style';

export function exportWorkerToExcel(trabajador, filePath) {
  const fields = [
    'nombre', 'dni', 'correo_electronico', 'telefono', 'tipo_trabajador',
    'grupo', 'categoria', 'iban', 'nss', 'fecha_alta', 'fecha_baja',
    'horas_contratadas', 'salario_neto', 'salario_bruto', 'direccion',
    'desplazamiento', 'fecha_desplazamiento', 'cliente', 'a1', 'fecha_limosa',
    'condiciones', 'pais', 'epis', 'fecha_epis', 'empresa'
  ];

  const aoa = [fields, fields.map(f => trabajador[f] ?? '')];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = fields.map(() => ({ wch: 20 }));

  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  for (let c = 0; c < fields.length; c++) {
    const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (headerCell) {
      headerCell.s = { font: { bold: true }, border: borderStyle };
    }
    const dataCell = ws[XLSX.utils.encode_cell({ r: 1, c })];
    if (dataCell) {
      dataCell.s = { border: borderStyle };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Trabajador');
  const name = filePath || `trabajador_${trabajador.nombre}.xlsx`;
  XLSX.writeFile(wb, name);
}
