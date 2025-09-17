import * as XLSX from 'xlsx-js-style';

const borderStyle = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } }
};

const formatValueForExcel = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return value;
};

const autoSizeColumns = (rows) => {
  if (!rows.length) return [];
  const columnCount = rows[0].length;
  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    const columnValues = rows.map(row => `${row[columnIndex] ?? ''}`);
    const maxLength = columnValues.reduce((max, value) => Math.max(max, value.length), 0);
    return { wch: Math.min(Math.max(maxLength + 4, 12), 45) };
  });
  return widths;
};

export function exportWorkerToExcel(trabajador, filePath) {
  const fields = [
    'nombre', 'dni', 'correo_electronico', 'telefono', 'tipo_trabajador',
    'grupo', 'categoria', 'iban', 'nss', 'fecha_alta', 'fecha_baja',
    'horas_contratadas', 'salario_neto', 'salario_bruto', 'direccion',
    'desplazamiento', 'fecha_desplazamiento', 'cliente', 'a1', 'limosa',
    'fecha_a1', 'fechafin_a1', 'fecha_limosa', 'fechafin_limosa',
    'condiciones', 'pais', 'epis', 'fecha_epis', 'empresa'
  ];

  const aoa = [fields, fields.map(f => formatValueForExcel(trabajador[f]))];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = autoSizeColumns(aoa);

  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < fields.length; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      cell.s = {
        border: borderStyle,
        font: r === 0 ? { bold: true } : undefined
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Trabajador');
  const name = filePath || `trabajador_${trabajador.nombre}.xlsx`;
  XLSX.writeFile(wb, name);
}

export function exportWorkersSelectionToExcel(trabajadores, selectedFields, {
  fieldLabels = {},
  fileName
} = {}) {
  if (!Array.isArray(trabajadores) || trabajadores.length === 0) {
    throw new Error('No hay trabajadores para exportar');
  }

  if (!Array.isArray(selectedFields) || selectedFields.length === 0) {
    throw new Error('No se han especificado campos para exportar');
  }

  const headers = selectedFields.map(field => fieldLabels[field] || field);
  const rows = trabajadores.map(trabajador => selectedFields.map(field => formatValueForExcel(trabajador[field])));
  const aoa = [headers, ...rows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = autoSizeColumns(aoa);

  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < headers.length; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      cell.s = {
        border: borderStyle,
        font: r === 0 ? { bold: true } : undefined
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores');
  const safeFileName = fileName || `trabajadores_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, safeFileName);
}
