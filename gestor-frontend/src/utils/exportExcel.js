import ExcelJS from 'exceljs';
import { format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

function calcDuration(start, end) {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let s = h1 * 60 + m1;
  let e = h2 * 60 + m2;
  if (e <= s) {
    e += 24 * 60; // crosses midnight
  }
  return (e - s) / 60;
}

function classifyIntervals(intervals, date, isHoliday) {
  const day = getDay(parseISO(date));
  const isWeekend = day === 0 || day === 6;
  if (isWeekend || isHoliday) {
    const festivas = intervals.reduce(
      (sum, { start, end }) => sum + calcDuration(start, end),
      0
    );
    return { normales: 0, extras: 0, nocturnas: 0, festivas };
  }

  let nocturnas = 0;
  let diurnas = 0;

  intervals.forEach(({ start, end }) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let startMin = h1 * 60 + m1;
    let endMin = h2 * 60 + m2;
    if (endMin <= startMin) {
      endMin += 24 * 60; // crosses midnight
    }
    if (startMin < 360) {
      const noctEnd = Math.min(endMin, 360);
      nocturnas += (noctEnd - startMin) / 60;
      startMin = noctEnd;
    }
    if (endMin > 1320) {
      const noctStart = Math.max(startMin, 1320);
      nocturnas += (endMin - noctStart) / 60;
      endMin = Math.min(endMin, 1320);
    }
    if (endMin > startMin) {
      diurnas += (endMin - startMin) / 60;
    }
  });

  let normales = 0;
  let extras = 0;
  if (diurnas > 8) {
    normales = 8;
    extras = diurnas - 8;
  } else {
    normales = diurnas;
  }

  return { normales, extras, nocturnas, festivas: 0 };
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
  let totalNocturnas = 0;
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
    const { normales, extras, nocturnas, festivas } = classifyIntervals(
      entry.intervals,
      fecha,
      entry.festivo
    );

    totalNormales += normales;
    totalExtras += extras;
    totalNocturnas += nocturnas;
    totalFestivas += festivas;

    rows.push({
      'Día de la Semana': dayName,
      'Día': dayNum,
      'Entrada 1': entrada1,
      'Salida 1': salida1,
      'Entrada 2': entrada2,
      'Salida 2': salida2,
      'Normales': toHM(normales),
      'Extras': toHM(extras),
      'Nocturnas': toHM(nocturnas),
      'Festivas': toHM(festivas)
    });
    rowFlags.push({ isWeekend, isHoliday: entry.festivo });
  });

  const totalsRow = {
    'Día de la Semana': 'Totales',
    'Día': '',
    'Entrada 1': '',
    'Salida 1': '',
    'Entrada 2': '',
    'Salida 2': '',
    'Normales': toHM(totalNormales),
    'Extras': toHM(totalExtras),
    'Nocturnas': toHM(totalNocturnas),
    'Festivas': toHM(totalFestivas)
  };

  const header = [
    'Día de la Semana',
    'Día',
    'Entrada 1',
    'Salida 1',
    'Entrada 2',
    'Salida 2',
    'Normales',
    'Extras',
    'Nocturnas',
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
  worksheet.mergeCells(logoRow.number, 1, logoRow.number, header.length);
  logoRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });


  // Text rows
  const titleRow = worksheet.addRow([]);
  titleRow.getCell(1).value = 'Control horas trabajador';
  titleRow.font = { name: fontName, bold: true };
  worksheet.mergeCells(titleRow.number, 1, titleRow.number, header.length);

  const nameRow = worksheet.addRow([]);
  nameRow.getCell(1).value = `Nombre: ${trabajador.nombre}`;
  nameRow.font = { name: fontName, size: 14 };
  worksheet.mergeCells(nameRow.number, 1, nameRow.number, header.length);

  const countryRow = worksheet.addRow([]);
  countryRow.getCell(1).value = `País: ${trabajador.pais || ''}`;
  countryRow.font = { name: fontName };
  worksheet.mergeCells(countryRow.number, 1, countryRow.number, header.length);

  const companyRow = worksheet.addRow([]);
  companyRow.getCell(1).value = `Empresa: ${trabajador.empresa || ''}`;
  companyRow.font = { name: fontName, bold: true };
  worksheet.mergeCells(companyRow.number, 1, companyRow.number, header.length);

  const monthRow = worksheet.addRow([]);
  monthRow.getCell(1).value = format(monthDate, 'MMMM yyyy', { locale: es });
  monthRow.font = { name: fontName };
  worksheet.mergeCells(monthRow.number, 1, monthRow.number, header.length);

  const infoRows = [titleRow, nameRow, countryRow, companyRow, monthRow];
  infoRows.forEach((r, idx) => {
    r.eachCell((cell, col) => {
      const top = idx === 0 ? { style: 'thin' } : undefined;
      const bottom = idx === infoRows.length - 1 ? { style: 'thin' } : undefined;
      const left = col === 1 ? { style: 'thin' } : undefined;
      const right = col === header.length ? { style: 'thin' } : undefined;
      cell.border = { top, bottom, left, right };
    });
  });

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

