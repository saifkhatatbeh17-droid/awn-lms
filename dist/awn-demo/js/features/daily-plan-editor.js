/* Enhance the existing daily fields; their values remain the saved source. */
(() => {
  const paper = document.getElementById('daily-paper');
  if (!paper) return;
  window.AwnPlanPaper(paper, document.getElementById('daily-preview-toggle'));
  document.getElementById('daily-save-draft').addEventListener('click', async event => {
    event.stopPropagation();
    const button = event.currentTarget;
    const status = document.getElementById('daily-save-status');
    button.disabled = true;
    status.textContent = 'جارٍ الحفظ…';
    try {
      const saved = await autosaveDaily();
      status.textContent = saved ? 'حُفظت المسودة محليًا' : 'لم تُحفظ المسودة';
    } finally { button.disabled = false; }
  });
  const names = ['مرحلة الدرس', 'دور المعلّم', 'دور المتعلّم', 'الزمن'];
  paper.querySelectorAll('#daily-stages tbody tr').forEach((row, index) => {
    [...row.cells].forEach((cell, column) => {
      cell.dataset.section = names[column];
      cell.querySelectorAll('input,textarea').forEach(field => {
        field.setAttribute('aria-label', `${names[column]} — المرحلة ${index + 1}`);
        if (column === 3) field.placeholder = 'مثال: 10 دقائق';
      });
    });
  });
  const labels = {subjectField:'المبحث',unitTitleField:'عنوان الوحدة',lessonTopicField:'موضوع الدرس',periodCountField:'عدد الحصص',priorLearningField:'التعلم القبلي',outcomesField:'النتاجات التعليمية',reflectionField:'التأمل الذاتي حول التعلم والتعليم'};
  Object.entries(labels).forEach(([id, label]) => paper.querySelector('#' + id)?.setAttribute('aria-label', label));
  const sessions = paper.querySelectorAll(':scope > div:nth-last-child(2) table tbody tr');
  sessions.forEach(row => {
    const title = row.cells[row.cells.length - 1].textContent.trim();
    row.querySelectorAll('input').forEach((field, index) => {
      field.setAttribute('aria-label', `${title} — المجموعة ${index + 1}`);
      field.placeholder = `المجموعة ${index + 1}`;
    });
  });
  const resize = field => {
    if (field.matches('textarea') && field.getClientRects().length) {
      field.style.height = 'auto'; field.style.height = Math.max(110, field.scrollHeight) + 'px';
    }
  };
  paper.addEventListener('input', event => resize(event.target));
  paper.addEventListener('focusin', event => resize(event.target));
  document.getElementById('outcomesField').placeholder = 'ما الذي سيستطيع الطالب فعله في نهاية الدرس؟\nاكتب كل نتاج في سطر مستقل.';
})();
