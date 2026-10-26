window.AwnPlanPaper = function (paper, toggle) {
  let printDetails = [];
  function paperValues() {
    paper.querySelectorAll('.plan-print-value').forEach(node => node.remove());
    paper.querySelectorAll('textarea,input:not([type="checkbox"])').forEach(field => {
      const text = document.createElement('span');
      text.className = 'plan-print-value';
      text.textContent = field.value || '…………';
      field.after(text);
    });
  }
  function showOptions() {
    printDetails = [...paper.querySelectorAll('details')].map(node => [node, node.open]);
    printDetails.forEach(([node]) => { node.open = true; });
  }
  function restoreOptions() { printDetails.forEach(([node, open]) => { node.open = open; }); printDetails = []; }
  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const preview = paper.classList.toggle('plan-paper-preview');
    toggle.setAttribute('aria-pressed', String(preview));
    toggle.textContent = preview ? 'العودة إلى التعبئة' : 'معاينة النموذج الورقي';
    if (preview) { paperValues(); showOptions(); } else restoreOptions();
  });
  window.addEventListener('beforeprint', () => { paperValues(); if (!paper.classList.contains('plan-paper-preview')) showOptions(); });
  window.addEventListener('afterprint', () => { if (!paper.classList.contains('plan-paper-preview')) restoreOptions(); });
};
/* One set of controls for editing, persistence and the paper view. */
(() => {
  const view = document.getElementById('view-lesson-plans');
  const paper = document.getElementById('quarterly-paper');
  const tbody = document.getElementById('plan-tbody');
  if (!paper || !tbody) return;
  const titles = ['النتاج', 'النتاجات العامة', 'مصادر التعلم', 'استراتيجيات التدريس', 'التقويم · الاستراتيجيات', 'التقويم · الأدوات', 'الأنشطة المرافقة', 'التأمل الذاتي', 'إجراءات النتاج'];
  const toggle = document.getElementById('plan-preview-toggle');
  let sequence = 0;
  function enhance() {
    [...tbody.rows].forEach((row, index) => {
      [...row.cells].forEach((cell, column) => {
        cell.dataset.section = titles[column];
        if ([2,3,4,5].includes(column) && !cell.querySelector('.plan-options')) {
          const details = document.createElement('details'); details.className = 'plan-options';
          const summary = document.createElement('summary');
          details.append(summary);
          while (cell.firstChild) details.append(cell.firstChild);
          cell.append(details);
        }
        const summary = cell.querySelector('.plan-options summary');
        if (summary) {
          const chosen = [...cell.querySelectorAll('label:has(input:checked)')].map(label => label.textContent.trim());
          summary.textContent = chosen.length ? `${chosen.length} محدّد · ${chosen.slice(0, 3).join('، ')}${chosen.length > 3 ? '…' : ''} — تعديل` : 'اختر ما يناسب النتاج';
        }
        cell.querySelectorAll('textarea,input:not([type="checkbox"])').forEach((field) => {
          field.setAttribute('aria-label', `${titles[column]} — النتاج ${index + 1} — ${field.placeholder || ''}`);
        });
      });
      row.cells[0].setAttribute('aria-label', `النتاج ${index + 1}`);
      const remove = row.querySelector('button');
      if (remove) remove.setAttribute('aria-label', `حذف النتاج ${index + 1}`);
    });
    paper.querySelectorAll('input:not([type="checkbox"]),textarea').forEach((field) => {
      if (!field.id) field.id = `plan-field-${++sequence}`;
      if (!field.closest('td')) {
        const label = field.previousElementSibling?.textContent?.trim() || field.placeholder || 'المديرية';
        field.setAttribute('aria-label', label);
      }
      if (field.type === 'number') field.min = '1';
    });
  }
  window.AwnPlanPaper(paper, toggle);
  view.addEventListener('input', event => {
    const field = event.target;
    if (field.matches('textarea')) { field.style.height = 'auto'; field.style.height = Math.max(110, field.scrollHeight) + 'px'; }
    const dates = paper.querySelectorAll('input[type="date"]');
    if (dates.length === 2) { dates[1].min = dates[0].value; dates[1].setCustomValidity(dates[0].value && dates[1].value && dates[1].value < dates[0].value ? 'اختر نهاية الفترة بعد بدايتها.' : ''); }
  });
  view.addEventListener('change', enhance);
  const observer = new MutationObserver(enhance);
  observer.observe(tbody, {childList:true});
  enhance();
})();

