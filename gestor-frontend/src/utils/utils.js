// src/utils/utils.js

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

export function formatHours(value) {
  return `${value.toFixed(1)}h`;
}


export const formatHoursToHM = (total) => {
  const hours = Math.floor(total);
  const minutes = Math.round((total - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}h`;
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
  // If there are dots but no comma, they represent thousand separators
  // so we strip them before parsing to avoid interpreting "1.000" as 1
  return parseFloat(str.replace(/\./g, ''));
}
