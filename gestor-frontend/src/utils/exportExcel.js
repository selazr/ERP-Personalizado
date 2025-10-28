import ExcelJS from 'exceljs';
import { format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  calcDuration,
  calculateHourBreakdown,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPE_MESSAGE_LABELS
} from './utils';

function toHM(num) {
  // If the value is zero or undefined return an empty string so that
  // the exported template does not display "00:00" for missing hours
  if (num === 0 || num === undefined || num === null) {
    return '';
  }
  const sign = num < 0 ? '-' : '';
  const absVal = Math.abs(num);
  let hours = Math.floor(absVal);
  let minutes = Math.round((absVal - hours) * 60);
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const getPaidLabel = (type) => {
  if (!type) return 'Pagada';
  const normalized = String(type).toLowerCase();
  const label =
    PAYMENT_TYPE_MESSAGE_LABELS[normalized] ||
    PAYMENT_TYPE_LABELS[normalized] ||
    normalized;
  return `Pagada ${label}`;
};

export async function addScheduleWorksheet(
  workbook,
  trabajador,
  horarios,
  monthDate,
  sheetName
) {
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
    const {
      fecha,
      hora_inicio,
      hora_fin,
      festivo,
      vacaciones,
      bajamedica,
      horanegativa,
      dianegativo,
      pagada,
      horas_pagadas,
      tipo_horas_pagadas
    } = h;
    const dur = calcDuration(hora_inicio, hora_fin);
    if (!dayData[fecha]) {
      dayData[fecha] = {
        total: 0,
        festivo: false,
        vacaciones: false,
        baja: false,
        intervals: [],
        horanegativa: 0,
        dianegativo: false,
        pagada: false,
        horas_pagadas: 0,
        tipo_pagadas: null
      };
    }
    dayData[fecha].total += dur;
    dayData[fecha].festivo = dayData[fecha].festivo || festivo;
    dayData[fecha].vacaciones = dayData[fecha].vacaciones || vacaciones;
    dayData[fecha].baja = dayData[fecha].baja || bajamedica;
    dayData[fecha].intervals.push({ start: hora_inicio, end: hora_fin });
    if (horanegativa) dayData[fecha].horanegativa = horanegativa;
    if (dianegativo) dayData[fecha].dianegativo = true;
    if (pagada) dayData[fecha].pagada = true;
    if (pagada && horas_pagadas) dayData[fecha].horas_pagadas = horas_pagadas;
    if (pagada && tipo_horas_pagadas) dayData[fecha].tipo_pagadas = String(tipo_horas_pagadas).toLowerCase();
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = format(date, 'yyyy-MM-dd');
    if (!dayData[iso]) {
      dayData[iso] = {
        total: 0,
        festivo: false,
        vacaciones: false,
        baja: false,
        intervals: [],
        horanegativa: 0,
        dianegativo: false,
        pagada: false,
        horas_pagadas: 0,
        tipo_pagadas: null
      };
    }
  }

  const rows = [];
  const rowFlags = [];
  let totalNormales = 0;
  let totalExtras = 0;
  let totalAdeber = 0;
  let totalNocturnas = 0;
  let totalFestivas = 0;
  let totalPagadas = 0;
  let extraBalance = 0;
  Object.keys(dayData).sort().forEach((fecha) => {
    const entry = dayData[fecha];
    const date = parseISO(fecha);
    const dayName = format(date, 'EEEE', { locale: es });
    const dayNum = format(date, 'd', { locale: es });
    let entrada1 = '';
    let salida1 = '';
    let entrada2 = '';
    let salida2 = '';
    if (entry.baja) {
      entrada1 = 'Baja';
      salida1 = 'Baja';
    } else if (entry.festivo) {
      entrada1 = 'Festivo';
      salida1 = 'Festivo';
    } else if (entry.vacaciones) {
      entrada1 = 'Vacaciones';
      salida1 = 'Vacaciones';
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
    const mappedIntervals = entry.intervals.map(({ start, end }) => ({
      hora_inicio: start,
      hora_fin: end,
    }));
    const breakdown = calculateHourBreakdown(mappedIntervals, fecha, {
      isHoliday: entry.festivo,
      isVacation: entry.vacaciones,
      isBaja: entry.baja,
    });

    let normalesFinal = breakdown.normales;
    let extrasFinal = breakdown.extras;
    let nocturnasFinal = breakdown.nocturnas;
    let festivasFinal = breakdown.festivas;
    let adeber = 0;
    const neg = entry.horanegativa || 0;
    if (neg > 0) {
      let remainingNeg = neg;
      const fromExtrasDia = Math.min(extrasFinal, remainingNeg);
      extrasFinal -= fromExtrasDia;
      remainingNeg -= fromExtrasDia;

      if (remainingNeg > 0 && extraBalance > 0) {
        const fromBalance = Math.min(extraBalance, remainingNeg);
        extraBalance -= fromBalance;
        remainingNeg -= fromBalance;
      }

      adeber = remainingNeg;
    }

    const horasPagadas = entry.pagada ? parseFloat(entry.horas_pagadas || 0) : 0;
    let pagadasAplicadas = 0;
    const tipoPagadas = entry.pagada
      ? (entry.tipo_pagadas ? String(entry.tipo_pagadas).toLowerCase() : null)
      : null;
    const aplicarPagoPorTipo = (type, cantidad) => {
      const safeAmount = Math.max(cantidad, 0);
      if (!type || safeAmount <= 0) {
        return safeAmount === 0 && !!type;
      }
      let applied = 0;
      switch (type) {
        case 'normales':
          applied = Math.min(normalesFinal, safeAmount);
          normalesFinal -= applied;
          break;
        case 'extras':
          applied = Math.min(extrasFinal, safeAmount);
          extrasFinal -= applied;
          break;
        case 'nocturnas':
          applied = Math.min(nocturnasFinal, safeAmount);
          nocturnasFinal -= applied;
          break;
        case 'festivo':
        case 'festiva':
        case 'festivas':
          applied = Math.min(festivasFinal, safeAmount);
          festivasFinal -= applied;
          break;
        default:
          return false;
      }
      pagadasAplicadas += applied;
      return true;
    };

    if (horasPagadas > 0) {
      const handled = aplicarPagoPorTipo(tipoPagadas, horasPagadas);
      if (!handled) {
        let restante = horasPagadas;

        const pagadasNormales = Math.min(normalesFinal, restante);
        normalesFinal -= pagadasNormales;
        pagadasAplicadas += pagadasNormales;
        restante -= pagadasNormales;

        if (restante > 0) {
          const pagadasExtras = Math.min(extrasFinal, restante);
          extrasFinal -= pagadasExtras;
          pagadasAplicadas += pagadasExtras;
          restante -= pagadasExtras;
        }

        if (restante > 0) {
          const pagadasNocturnas = Math.min(nocturnasFinal, restante);
          nocturnasFinal -= pagadasNocturnas;
          pagadasAplicadas += pagadasNocturnas;
          restante -= pagadasNocturnas;
        }

        if (restante > 0) {
          const pagadasFestivas = Math.min(festivasFinal, restante);
          festivasFinal -= pagadasFestivas;
          pagadasAplicadas += pagadasFestivas;
          restante -= pagadasFestivas;
        }
      }
    }

    totalNormales += normalesFinal;
    totalAdeber += adeber;
    totalNocturnas += nocturnasFinal;
    totalFestivas += festivasFinal;
    totalPagadas += pagadasAplicadas;
    extraBalance += extrasFinal;
    extraBalance = Math.max(extraBalance, 0);
    totalExtras = extraBalance;

    rows.push({
      'Día de la Semana': dayName,
      'Día': dayNum,
      'Entrada 1': entrada1,
      'Salida 1': salida1,
      'Entrada 2': entrada2,
      'Salida 2': salida2,
      'Normales': toHM(normalesFinal),
      'Extras': toHM(extrasFinal),
      'A Deber': entry.dianegativo ? 'Día negativo' : adeber > 0 ? `-${toHM(adeber)}` : '',
      'Nocturnas': toHM(nocturnasFinal),
      'Festivas': toHM(festivasFinal),
      'Pagada': entry.pagada ? getPaidLabel(tipoPagadas) : '',
      'Horas Pagadas': horasPagadas > 0 ? toHM(pagadasAplicadas) : ''
    });
    rowFlags.push({
      isWeekend,
      isHoliday: entry.festivo,
      isVacation: entry.vacaciones,
      isBaja: entry.baja,
      isPaid: entry.pagada,
      hasPaidHours: horasPagadas > 0
    });
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
    'A Deber': totalAdeber > 0 ? `-${toHM(totalAdeber)}` : '',
    'Nocturnas': toHM(totalNocturnas),
    'Festivas': toHM(totalFestivas),
    'Pagada': '',
    'Horas Pagadas': toHM(totalPagadas)
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
    'A Deber',
    'Nocturnas',
    'Festivas',
    'Pagada',
    'Horas Pagadas'
  ];

  const pagadaColumnIndex = header.indexOf('Pagada') + 1;
  const horasPagadasColumnIndex = header.indexOf('Horas Pagadas') + 1;

  const baseName = trabajador.nombre || 'Horas';
  const worksheetName = (sheetName || baseName).substring(0, 31);
  const worksheet = workbook.addWorksheet(worksheetName, {
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

  const paidBorderColor = 'FF00B050';

  rows.forEach((r, idx) => {
    const row = worksheet.addRow(header.map(h => r[h]));
    row.font = { name: fontName };
    const flags = rowFlags[idx];
    const color = flags.isBaja
      ? 'FFD6D6'
      : flags.isHoliday
      ? 'E6E0FF'
      : flags.isVacation
      ? 'E6FFE6'
      : flags.isWeekend
      ? 'D9D9D9'
      : null;
    row.eachCell((cell, colNumber) => {
      if (color) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color }
        };
      }
      const hasPaidHighlight = flags.isPaid || flags.hasPaidHours;
      const shouldHighlightCell =
        hasPaidHighlight &&
        (colNumber === pagadaColumnIndex || colNumber === horasPagadasColumnIndex);

      if (shouldHighlightCell) {
        cell.border = {
          top: { style: 'medium', color: { argb: paidBorderColor } },
          bottom: { style: 'medium', color: { argb: paidBorderColor } },
          left: { style: 'medium', color: { argb: paidBorderColor } },
          right: { style: 'medium', color: { argb: paidBorderColor } }
        };
      } else {
        cell.border = { ...borderStyle };
        if (colNumber === 6) {
          cell.border = { ...borderStyle, right: { style: 'medium' } };
        }
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
}

export async function exportScheduleToExcel(trabajador, horarios, monthDate = new Date()) {
  const workbook = new ExcelJS.Workbook();
  await addScheduleWorksheet(workbook, trabajador, horarios, monthDate);
  const monthName = format(monthDate, 'MMMM', { locale: es });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `horas_${trabajador.nombre}_${monthName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAllSchedulesToExcel(items, monthDate = new Date()) {
  const workbook = new ExcelJS.Workbook();
  for (const { trabajador, horarios } of items) {
    await addScheduleWorksheet(workbook, trabajador, horarios, monthDate);
  }
  const monthName = format(monthDate, 'MMMM', { locale: es });
  const year = format(monthDate, 'yyyy');
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `HORARIOS_${monthName}_${year}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportYearScheduleToExcel(
  trabajador,
  horarios,
  yearDate = new Date()
) {
  const workbook = new ExcelJS.Workbook();
  const year = format(yearDate, 'yyyy');
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(yearDate.getFullYear(), m, 1);
    const sheetLabel = format(monthDate, 'MMM', { locale: es });
    const baseName = trabajador.nombre ? trabajador.nombre.substring(0, 27) : '';
    await addScheduleWorksheet(
      workbook,
      trabajador,
      horarios,
      monthDate,
      `${baseName}-${sheetLabel}`
    );
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `HORARIOS_${trabajador.nombre}_${year}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

