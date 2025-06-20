export function exportObjectToCSV(obj, filename) {
  const headers = Object.keys(obj);
  const values = headers.map((h) => String(obj[h] ?? '').replace(/"/g, '""'));
  const csv = headers.join(',') + '\n' + values.join(',');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
