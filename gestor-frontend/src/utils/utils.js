// src/utils/utils.js

import { getDay, parseISO, isValid } from 'date-fns';

export function calcDuration(start, end) {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  let s = h1 * 60 + m1;
  let e = h2 * 60 + m2;
  if (s === e) return 0; // treat equal times as zero duration
  if (e <= s) {
    e += 24 * 60; // crosses midnight
  }
  return (e - s) / 60;
}

export function calculateTotalHoursFromIntervals(intervals) {
  return intervals.reduce((sum, { hora_inicio, hora_fin }) => {
    if (hora_inicio && hora_fin) {
      return sum + calcDuration(hora_inicio, hora_fin);
    }
    return sum;
  }, 0);
}

export function calculateHourBreakdown(
  intervals = [],
  dateKey,
  { isHoliday = false, isVacation = false, isBaja = false } = {}
) {
  const result = { normales: 0, extras: 0, nocturnas: 0, festivas: 0 };

  if (!intervals || !Array.isArray(intervals) || intervals.length === 0) {
    return result;
  }

  const parsedDate = dateKey ? parseISO(dateKey) : null;
  const validDate = parsedDate && isValid(parsedDate);
  const dayOfWeek = validDate ? getDay(parsedDate) : null;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const normalizedIntervals = intervals
    .map((interval) => ({
      start: interval?.hora_inicio ?? interval?.start ?? '',
      end: interval?.hora_fin ?? interval?.end ?? '',
    }))
    .filter(({ start, end }) => start && end);

  if (normalizedIntervals.length === 0) {
    return result;
  }

  const sumDurations = (list) =>
    list.reduce((acc, { start, end }) => acc + calcDuration(start, end), 0);

  if (isVacation) {
    return { ...result, extras: sumDurations(normalizedIntervals) };
  }

  if (isWeekend || isHoliday || isBaja) {
    return { ...result, festivas: sumDurations(normalizedIntervals) };
  }

  let nocturnas = 0;
  let diurnas = 0;

  normalizedIntervals.forEach(({ start, end }) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    if ([h1, m1, h2, m2].some(Number.isNaN)) {
      return;
    }

    let startMinutes = h1 * 60 + m1;
    let endMinutes = h2 * 60 + m2;

    if (startMinutes === endMinutes) {
      return;
    }

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    let total = (endMinutes - startMinutes) / 60;

    if (startMinutes < 360) {
      const nocturnaFin = Math.min(endMinutes, 360);
      nocturnas += (nocturnaFin - startMinutes) / 60;
      total -= (nocturnaFin - startMinutes) / 60;
    }

    if (endMinutes > 1320) {
      const nocturnaInicio = Math.max(startMinutes, 1320);
      nocturnas += (endMinutes - nocturnaInicio) / 60;
      total -= (endMinutes - nocturnaInicio) / 60;
    }

    if (total > 0) {
      diurnas += total;
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

  return {
    normales: Math.max(normales, 0),
    extras: Math.max(extras, 0),
    nocturnas: Math.max(nocturnas, 0),
    festivas: 0,
  };
}

export function formatHours(value) {
  return `${value.toFixed(1)}h`;
}


export const formatHoursToHM = (total) => {
  const sign = total < 0 ? '-' : '';
  const absTotal = Math.abs(total);
  let hours = Math.floor(absTotal);
  let minutes = Math.round((absTotal - hours) * 60);
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}h`;
};

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '';
  const number = typeof value === 'number' ? value : parseCurrency(value);
  if (number === null) return '';
  const hasDecimals = number % 1 !== 0;
  const fixed = number.toFixed(hasDecimals ? 2 : 0);
  let [intPart, decPart] = fixed.split('.');
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${intPart},${decPart}` : intPart;
}

export function parseCurrency(value) {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).replace(/[^0-9.,]/g, '');
  if (str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  }
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(str);
    }
  }
  // If there are dots but no comma, they represent thousand separators
  // so we strip them before parsing to avoid interpreting "1.000" as 1
  return parseFloat(str.replace(/\./g, ''));
}

export const PAYMENT_TYPE_LABELS = {
  normales: 'Normales',
  extras: 'Extra laborable',
  nocturnas: 'Nocturnas',
  festivas: 'Festivas',
};

export const PAYMENT_TYPE_MESSAGE_LABELS = {
  normales: 'Normal',
  extras: 'Extra laborable',
  nocturnas: 'Nocturna',
  festivas: 'Festiva',
};
