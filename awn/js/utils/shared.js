/* Formatting, validation, storage and export utilities without feature dependencies. */
(() => {
  function escapeHtml(value) { const element = document.createElement('span'); element.textContent = String(value ?? ''); return element.innerHTML; }
  function today(timeZone = 'Asia/Amman') {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  }
  function formatDate(value, options = {}) {
    if (!value) return '—';
    const date = new Date(String(value).length === 10 ? `${value}T12:00:00Z` : value);
    if (Number.isNaN(date.valueOf())) return '—';
    return new Intl.DateTimeFormat('ar-JO', { timeZone:'Asia/Amman', dateStyle:'medium', ...options }).format(date);
  }
  function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).valueOf()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value; }
  function csvCell(value) { const text = String(value ?? ''); return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"'; }
  function csv(rows) { return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n'); }
  function downloadCsv(filename, rows) {
    const url = URL.createObjectURL(new Blob([csv(rows)], { type:'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href=url; link.download=filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const storage = Object.freeze({
    read(key, fallback = null) { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } },
    write(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; },
    remove(key) { localStorage.removeItem(key); },
  });
  const response = (success, data = null, message = '') => ({ success, data, message });
  function unwrap(result) { if (!result || result.success !== true) throw new Error(result?.message || 'تعذر تنفيذ العملية'); return result.data; }
  window.AwnUtils = Object.freeze({ escapeHtml, today, formatDate, validDate, csvCell, csv, downloadCsv, storage, response, unwrap, number:(value, options={}) => new Intl.NumberFormat('ar-JO',options).format(value) });
})();
