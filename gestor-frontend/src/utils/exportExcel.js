import ExcelJS from 'exceljs';
import { format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

function calcDuration(start, end) {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
}

function toHM(num) {
  // If the value is zero or undefined return an empty string so that
  // the exported template does not display "00:00" for missing hours
  if (num === 0 || num === undefined || num === null) {
    return '';
  }
  const hours = Math.floor(num);
  const minutes = Math.round((num - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export async function exportScheduleToExcel(trabajador, horarios, monthDate = new Date()) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  

  const filtered = horarios.filter(h => {
    const d = parseISO(h.fecha);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.fecha === b.fecha) {
      return a.hora_inicio.localeCompare(b.hora_inicio);
    }
    return a.fecha.localeCompare(b.fecha);
  });

  const dayData = {};
  sorted.forEach((h) => {
    const { fecha, hora_inicio, hora_fin, festivo } = h;
    const dur = calcDuration(hora_inicio, hora_fin);
    if (!dayData[fecha]) {
      dayData[fecha] = { total: 0, festivo: false, intervals: [] };
    }
    dayData[fecha].total += dur;
    dayData[fecha].festivo = dayData[fecha].festivo || festivo;
    dayData[fecha].intervals.push({ start: hora_inicio, end: hora_fin });
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().slice(0, 10);
    if (!dayData[iso]) {
      dayData[iso] = { total: 0, festivo: false, intervals: [] };
    }
  }

  const rows = [];
  const rowFlags = [];
  let totalNormales = 0;
  let totalExtras = 0;
  let totalFestivas = 0;
  Object.keys(dayData).sort().forEach((fecha) => {
    const entry = dayData[fecha];
    const date = parseISO(fecha);
    const dayName = format(date, 'EEEE', { locale: es });
    const dayNum = format(date, 'd', { locale: es });
    let entrada1 = '';
    let salida1 = '';
    let entrada2 = '';
    let salida2 = '';
    if (entry.festivo) {
      entrada1 = 'Festivo';
      salida1 = 'Festivo';
    } else if (entry.intervals.length === 0) {
      entrada1 = '';
      salida1 = '';
    } else if (entry.intervals.length === 1) {
      entrada1 = entry.intervals[0].start;
      salida1 = entry.intervals[0].end;
    } else {
      entrada1 = entry.intervals[0].start;
      salida1 = entry.intervals[0].end;
      entrada2 = entry.intervals[1].start || '';
      salida2 = entry.intervals[1].end || '';
    }
    const isWeekend = getDay(date) === 0 || getDay(date) === 6;
    let normales = 0;
    let extras = 0;
    let festivas = 0;
    const total = entry.total;
    if (entry.festivo || isWeekend) {
      festivas = total;
    } else {
      normales = Math.min(total, 8);
      if (total > 8) {
        extras = total - 8;
      }
    }

    totalNormales += normales;
    totalExtras += extras;
    totalFestivas += festivas;

    rows.push({
      'Día de la Semana': dayName,
      'Día': dayNum,
      'Entrada': entrada1,
      'Salida': salida1,
      'Entrada': entrada2,
      'Salida': salida2,
      'Normales': toHM(normales),
      'Extras': toHM(extras),
      'Festivas': toHM(festivas)
    });
    rowFlags.push({ isWeekend, isHoliday: entry.festivo });
  });

  const totalsRow = {
    'Día de la Semana': 'Totales',
    'Día': '',
    'Entrada': '',
    'Salida': '',
    'Entrada': '',
    'Salida': '',
    'Normales': toHM(totalNormales),
    'Extras': toHM(totalExtras),
    'Festivas': toHM(totalFestivas)
  };

  const header = [
    'Día de la Semana',
    'Día',
    'Entrada',
    'Salida',
    'Entrada',
    'Salida',
    'Normales',
    'Extras',
    'Festivas'
  ];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Horas', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1
    }
  });

  worksheet.columns = header.map(() => ({ width: 15 }));

  const fontName = 'Century Gothic';

  // Row for logo
  const logoRow = worksheet.addRow([]);
  logoRow.height = 60;

  // Text rows
  const titleRow = worksheet.addRow([]);
  titleRow.getCell(1).value = 'Control horas trabajador';
  titleRow.font = { name: fontName, bold: true };

  const nameRow = worksheet.addRow([]);
  nameRow.getCell(1).value = `Nombre: ${trabajador.nombre}`;
  nameRow.font = { name: fontName };

  const countryRow = worksheet.addRow([]);
  countryRow.getCell(1).value = `País: ${trabajador.pais || ''}`;
  countryRow.font = { name: fontName };

  const companyRow = worksheet.addRow([]);
  companyRow.getCell(1).value = `Empresa: ${trabajador.empresa || ''}`;
  companyRow.font = { name: fontName, bold: true };

  const monthRow = worksheet.addRow([]);
  monthRow.getCell(1).value = format(monthDate, 'MMMM yyyy', { locale: es });
  monthRow.font = { name: fontName };

  worksheet.addRow([]); // empty row before headers

  const headerRow = worksheet.addRow(header);
  headerRow.font = { name: fontName, bold: true };

  const borderStyle = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' }
  };

  headerRow.eachCell((cell, colNumber) => {
    cell.border = { ...borderStyle };
    if (colNumber === 6) {
      cell.border = { ...borderStyle, right: { style: 'medium' } };
    }
  });

  rows.forEach((r, idx) => {
    const row = worksheet.addRow(header.map(h => r[h]));
    row.font = { name: fontName };
    const flags = rowFlags[idx];
    const color = flags.isHoliday ? 'E6E0FF' : flags.isWeekend ? 'D9D9D9' : null;
    row.eachCell((cell, colNumber) => {
      if (color) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color }
        };
      }
      cell.border = { ...borderStyle };
      if (colNumber === 6) {
        cell.border = { ...borderStyle, right: { style: 'medium' } };
      }
    });
  });

  const totals = worksheet.addRow(header.map(h => totalsRow[h]));
  totals.font = { name: fontName, bold: true };
  totals.eachCell((cell, colNumber) => {
    cell.border = { ...borderStyle };
    if (colNumber === 6) {
      cell.border = { ...borderStyle, right: { style: 'medium' } };
    }
  });

  // Add logo image if available
  async function loadImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // sólo el base64 sin encabezado
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const logoBase64 = await loadImageAsBase64('/lxh.jpg'); // desde public/
const imageId = workbook.addImage({ base64: logoBase64, extension: 'jpeg' });

  worksheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 160, height: 60 }
  });

  // Apply global font
  worksheet.eachRow(r => {
    r.eachCell(c => {
      c.font = c.font ? { ...c.font, name: fontName } : { name: fontName };
    });
  });

  const monthName = format(monthDate, 'MMMM', { locale: es });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `horas_${trabajador.nombre}_${monthName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

