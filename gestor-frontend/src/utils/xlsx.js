export const utils = {
  book_new() {
    return { SheetNames: [], Sheets: {} };
  },
  json_to_sheet(data) {
    if (!Array.isArray(data)) return [];
    const keys = Object.keys(data[0] || {});
    const sheet = [keys];
    for (const row of data) {
      sheet.push(keys.map(k => row[k] ?? ''));
    }
    return sheet;
  },
  sheet_add_aoa(sheet, rows, { origin = 0 } = {}) {
    rows.forEach((row, idx) => {
      sheet.splice(origin + idx, 0, row);
    });
  },
  book_append_sheet(wb, sheet, name) {
    wb.SheetNames.push(name);
    wb.Sheets[name] = sheet;
  }
};

export function writeFile(wb, filename) {
  const sheet = wb.Sheets[wb.SheetNames[0]] || [];
  const csv = sheet.map(r => r.map(c => String(c).replace(/"/g, '""')).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default {
  utils,
  writeFile
};
