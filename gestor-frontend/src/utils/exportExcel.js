// Use the style-enabled build of sheetjs so we can apply colours
import * as XLSX from 'xlsx-js-style';
import { format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

function calcDuration(start, end) {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
}

function toHM(num) {
  const hours = Math.floor(num);
  const minutes = Math.round((num - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function exportScheduleToExcel(trabajador, horarios, monthDate = new Date()) {
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
    let extraLaborables = 0;
    let extra = 0;
    const total = entry.total;
    if (entry.festivo || isWeekend) {
      extra = total;
    } else if (total > 8) {
      extraLaborables = total - 8;
    }

    rows.push({
      'Día': `${dayName} ${dayNum}`,
      'Hora de Entrada 1': entrada1,
      'Hora de Salida 1': salida1,
      'Hora de Entrada 2': entrada2,
      'Hora de Salida 2': salida2,
      'Horas Extra Laborables': toHM(extraLaborables),
      'Horas Extra': toHM(extra),
      'Total Horas': toHM(total)
    });
    rowFlags.push({ isWeekend, isHoliday: entry.festivo });
  });

  const wb = XLSX.utils.book_new();
  const header = [
    'Día',
    'Hora de Entrada 1',
    'Hora de Salida 1',
    'Hora de Entrada 2',
    'Hora de Salida 2',
    'Horas Extra Laborables',
    'Horas Extra',
    'Total Horas'
  ];

  // First row left empty as a placeholder for the company logo
  const aoa = [
    [''],
    ['Control horas trabajador'],
    [`Nombre: ${trabajador.nombre}`],
    [`País: ${trabajador.pais || ''}`],
    [],
    header
  ];
  rows.forEach(r => {
    aoa.push(header.map(h => r[h]));
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Increase column widths for readability
  ws['!cols'] = header.map(() => ({ wch: 20 }));

  // Reserve height for logo on the first row
  ws['!rows'] = [{ hpx: 80 }];

  // Define a simple border style
  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  const headerRowIdx = 6;
  for (let c = 0; c < header.length; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRowIdx - 1, c })];
    if (cell) {
      cell.s = {
        font: { bold: true },
        border: borderStyle
      };
    }
  }

  const firstDataRow = 7; // 1-indexed row where data starts (after logo row)
  rows.forEach((_, idx) => {
    const flags = rowFlags[idx];
    const rowIdx = firstDataRow + idx;
    const color = flags.isHoliday ? 'E6E0FF' : flags.isWeekend ? 'D9D9D9' : null;
    for (let c = 0; c < header.length; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: rowIdx - 1, c })];
      if (cell) {
        cell.s = cell.s || {};
        if (color) {
          cell.s.fill = { patternType: 'solid', fgColor: { rgb: color } };
        }
        cell.s.border = borderStyle;
      }
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Horas');
  const monthName = format(monthDate, 'MMMM', { locale: es });
  XLSX.writeFile(wb, `horas_${trabajador.nombre}_${monthName}.xlsx`);
}
