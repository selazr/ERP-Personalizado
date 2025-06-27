// src/utils/utils.js

export function calculateTotalHoursFromIntervals(intervals) {
  return intervals.reduce((sum, { hora_inicio, hora_fin }) => {
    if (hora_inicio && hora_fin) {
      const [h1, m1] = hora_inicio.split(':').map(Number);
      const [h2, m2] = hora_fin.split(':').map(Number);
      let start = h1 * 60 + m1;
      let end = h2 * 60 + m2;
      if (end <= start) {
        end += 24 * 60; // Crosses midnight
      }
      return sum + (end - start) / 60;
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
