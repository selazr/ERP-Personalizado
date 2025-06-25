import * as XLSX from './xlsx.js';
import { format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

function calcDuration(start, end) {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
}

function round(num) {
  return Math.round(num * 100) / 100;
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
  Object.keys(dayData).sort().forEach((fecha) => {
    const entry = dayData[fecha];
    const date = parseISO(fecha);
    const dayName = format(date, 'EEEE', { locale: es });
    const dayNum = format(date, 'd', { locale: es });
    let entrada = '';
    let salida = '';
    if (entry.festivo) {
      entrada = 'Festivo';
      salida = 'Festivo';
    } else if (entry.intervals.length === 0) {
      entrada = '0';
      salida = '0';
    } else {
      entrada = entry.intervals[0].start;
      salida = entry.intervals[entry.intervals.length - 1].end;
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
      'Hora de Entrada': entrada,
      'Hora de Salida': salida,
      'Horas Extra Laborables': round(extraLaborables),
      'Horas Extra': round(extra),
      'Total Horas': round(total)
    });
  });

  const wb = XLSX.utils.book_new();
  const info = [
    ['Control horas trabajador'],
    [`Nombre: ${trabajador.nombre}`],
    [`País: ${trabajador.pais || ''}`],
    []
  ];
  const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
  XLSX.utils.sheet_add_aoa(ws, info, { origin: 'A1' });
  XLSX.utils.book_append_sheet(wb, ws, 'Horas');
  const monthName = format(monthDate, 'MMMM', { locale: es });
  XLSX.writeFile(wb, `horas_${trabajador.nombre}_${monthName}.xlsx`);
}
