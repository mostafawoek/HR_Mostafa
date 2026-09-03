// تصدير واستيراد CSV (متوافق مع Excel) مع دعم اللغة العربية

export function exportToCSV(filename, headers, rows) {
  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.label}"`).join(','));
  rows.forEach(row => {
    csvRows.push(headers.map(h => {
      let val = row[h.key] ?? '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(','));
  });
  const csv = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target.result || '').replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return resolve([]);
      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
        return obj;
      });
      resolve(rows);
    };
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}