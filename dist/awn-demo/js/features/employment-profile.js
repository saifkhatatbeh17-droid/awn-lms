/* Read-only employee view. Demo figures are never used in connected mode. */
window.AwnEmploymentProfile = (() => {
  const periods = [
    {label:'تشرين الأول 2026', basic:600, allowances:50, deductions:[{name:'اشتراك الموظف',amount:45,reason:'قيمة توضيحية في مسير الرواتب؛ ليست نسبة قانونية محسوبة.'},{name:'قسط سلفة',amount:25,reason:'قسط مسجّل ضمن نموذج السلفة.'}],status:'قيد المراجعة',paid:'لم يُسجّل صرف'},
    {label:'أيلول 2026', basic:600, allowances:50, deductions:[{name:'اشتراك الموظف',amount:45,reason:'قيمة توضيحية في مسير الرواتب؛ ليست نسبة قانونية محسوبة.'}],status:'مصروف — مثال',paid:'30 / 09 / 2026'}
  ];
  const money = value => new Intl.NumberFormat('ar-JO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value) + ' د.أ';
  const escape = value => AwnUtils.escapeHtml(String(value));
  let hidden = false;
  function payroll(index) {
    const data = periods[index] || periods[0];
    const sum = data.deductions.reduce((total,item)=>total+item.amount,0);
    const display = value => hidden ? '••••' : money(value);
    const target = document.getElementById('employment-payroll');
    target.innerHTML = `<div class="employment-pay-summary"><div><span>الراتب الأساسي</span><strong>${display(data.basic)}</strong></div><div><span>البدلات</span><strong>${display(data.allowances)}</strong></div><div><span>إجمالي المستحقات</span><strong>${display(data.basic+data.allowances)}</strong></div><div><span>إجمالي الاقتطاعات</span><strong>${display(sum)}</strong></div><div class="employment-net"><span>صافي المستحق</span><strong>${display(data.basic+data.allowances-sum)}</strong></div></div>
      <p class="employment-pay-state"><strong>${data.status}</strong><span>الصرف: ${data.paid}</span></p>
      <h3>تفاصيل الخصومات والاقتطاعات</h3><div class="employment-deductions">${data.deductions.map(item=>`<article><div><strong>${escape(item.name)}</strong><b>${display(item.amount)}</b></div><p>${escape(item.reason)}</p></article>`).join('')}</div><p class="employment-muted">للاستفسار عن بند، راجع الشؤون المالية مع تحديد الشهر واسم البند.</p>`;
  }
  function mount() {
    const content = document.getElementById('employment-content');
    if (!content || content.dataset.mounted) return;
    content.dataset.mounted = 'true';
    if (window.AWN_CONFIG?.demoMode !== true) {
      document.getElementById('employment-notice').textContent = 'تظهر هنا بيانات عقدك ومستحقاتك بعد إتاحتها من إدارة المدرسة.';
      content.innerHTML = '<section class="employment-panel"><h2>لم تُتح بيانات وظيفية بعد</h2><p>لا توجد بيانات عقد أو رواتب متصلة بحسابك حاليًا.</p></section>';
      return;
    }
    document.getElementById('employment-source').textContent = 'عرض تجريبي';
    document.getElementById('employment-notice').textContent = 'الأرقام والعقد أدناه أمثلة للعرض، وليست بياناتك الفعلية. في النسخة المتصلة تُعرض القيم المعتمدة من إدارة المدرسة.';
    content.innerHTML = `<div class="employment-overview"><article><span>حالة العقد</span><strong>ساري — مثال</strong><small>محدد المدة</small></article><article><span>مدة العقد</span><strong>عام دراسي</strong><small>01 / 09 / 2026 — 31 / 08 / 2027</small></article><article><span>التجديد القادم</span><strong>لم يصدر قرار</strong><small>بانتظار مراجعة المدرسة</small></article></div>
      <div class="employment-columns"><section class="employment-panel"><div class="employment-section-heading"><div><span class="employment-eyebrow">01 / علاقة العمل</span><h2>العقد مع المدرسة</h2></div><span class="employment-badge">للاطلاع</span></div><dl class="employment-facts"><div><dt>المسمى الوظيفي</dt><dd>معلم لغة عربية</dd></div><div><dt>نوع العقد</dt><dd>محدد المدة</dd></div><div><dt>بداية العقد</dt><dd>01 / 09 / 2026</dd></div><div><dt>نهاية العقد</dt><dd>31 / 08 / 2027</dd></div><div><dt>نظام الدوام</dt><dd>دوام كامل</dd></div><div><dt>مرجع العقد</dt><dd>عقد توضيحي — غير مرفق</dd></div></dl><p class="employment-muted">يُرجع إلى العقد الموقّع مع المدرسة لتفاصيل البنود والاستحقاقات.</p></section>
      <section class="employment-panel employment-renewal"><span class="employment-eyebrow">02 / الخطوة القادمة</span><h2>تجديد العقد</h2><strong class="employment-renewal-state">بانتظار قرار المدرسة</strong><dl class="employment-facts"><div><dt>رغبتك في التجديد</dt><dd>غير مسجّلة</dd></div><div><dt>موعد المراجعة</dt><dd>لم تحدده المدرسة</dd></div><div><dt>قرار المدرسة</dt><dd>لم يصدر قرار تجديد أو عدم تجديد</dd></div></dl><p class="employment-muted">عند صدور القرار تظهر تفاصيله والعرض الجديد أو إشعار عدم التجديد هنا.</p></section></div>
      <section class="employment-panel"><div class="employment-section-heading"><div><span class="employment-eyebrow">03 / مستحقاتك بوضوح</span><h2>كشف الراتب الشهري</h2></div><div class="employment-controls"><label>شهر الكشف<select id="employment-month">${periods.map((item,index)=>`<option value="${index}">${item.label}</option>`).join('')}</select></label><button type="button" id="employment-privacy" aria-pressed="false">إخفاء المبالغ</button></div></div><div id="employment-payroll" aria-live="polite"></div></section>
      <div class="employment-columns"><section class="employment-panel"><span class="employment-eyebrow">04 / الإجازات</span><h2>رصيد الإجازات</h2><div class="employment-leave"><div><strong>10</strong><span>رصيد مُدخل</span></div><div><strong>2</strong><span>مستخدم</span></div><div><strong>8</strong><span>متبقٍ</span></div></div><p class="employment-muted">قيم توضيحية تدخلها الإدارة وفق العقد والسياسة المعتمدة. الأثر المالي لأي إجازة يظهر في كشف الشهر المعني.</p><a href="#view-leave-requests" data-path="view-leave-requests">عرض طلبات الإجازة والمغادرة ←</a></section>
      <section class="employment-panel"><span class="employment-eyebrow">05 / مستنداتك</span><h2>المستندات الوظيفية</h2><ul class="employment-documents"><li><span>نسخة العقد الموقّع</span><small>لم تُرفق بعد</small></li><li><span>كشوف الرواتب</span><small>معاينة أعلاه · لا يوجد ملف مرفق</small></li><li><span>كتب وتجديدات العقد</span><small>لا توجد مستندات</small></li></ul></section></div>`;
    const month = document.getElementById('employment-month');
    month.addEventListener('change',()=>payroll(Number(month.value)));
    document.getElementById('employment-privacy').addEventListener('click',event=>{
      event.stopPropagation(); hidden = !hidden;
      event.currentTarget.setAttribute('aria-pressed',String(hidden));
      event.currentTarget.textContent = hidden ? 'إظهار المبالغ' : 'إخفاء المبالغ';
      payroll(Number(month.value));
    });
    payroll(0);
  }
  return {mount};
})();
