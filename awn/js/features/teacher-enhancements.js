// Teacher tools run entirely in this browser; no ministry or school server is contacted.
const TEACHER_STORE_PREFIX = "awn_teacher_";
const GRADE_COMPONENTS = [
  { label: "الشهر الأول" }, { label: "الشهر الثاني" },
  { label: "المشاركة" }, { label: "النهائي" },
];
function teacherRead(key, fallback) {
  try { const value = AwnUtils.storage.read(TEACHER_STORE_PREFIX + key); return value == null ? fallback : value; }
  catch { return fallback; }
}
function teacherWrite(key, value) {
  if (!requireDemoMode()) return false;
  try { AwnDemo.write(TEACHER_STORE_PREFIX + key, value); return true; }
  catch (error) { console.error(error); window.AwnUI.dialog({ icon: "error", title: "تعذر الحفظ في هذا المتصفح." }); return false; }
}
function academicInfo() {
  const date = todayISO("Asia/Amman"), year = Number(date.slice(0, 4)), month = Number(date.slice(5, 7));
  const start = month >= 8 ? year : year - 1;
  return { year: start + "/" + (start + 1), term: month >= 8 || month <= 1 ? "الفصل الأول" : "الفصل الثاني" };
}
function setTeacherLabels() {
  const user = currentUser(), info = academicInfo(), name = user.name || user.fullName || user.username || "المعلم";
  const avatar = document.querySelector('header img[alt="الملف الشخصي"]');
  if (avatar) {
    const fallback = document.createElement("span");
    fallback.className = avatar.className + " bg-primary/10 text-primary flex items-center justify-center font-bold";
    fallback.setAttribute("aria-label", "صورة افتراضية لـ " + name);
    fallback.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">person</span>';
    avatar.replaceWith(fallback);
  }
  document.querySelectorAll("[data-teacher-name]").forEach((node) => { node.textContent = name; });
  document.querySelectorAll("[data-academic-term]").forEach((node) => { node.textContent = info.term; });
  document.querySelectorAll("[data-academic-year]").forEach((node) => { node.textContent = info.year; });
  const planTerm = document.querySelector('#view-lesson-plans input[value="الثاني"]');
  if (planTerm) planTerm.value = info.term.replace("الفصل الدراسي ", "");
  const teacherSignature = document.querySelector('#view-lesson-plans input[placeholder="الاسم..."]');
  if (teacherSignature) teacherSignature.value = name;  const date = document.getElementById("attendanceDateLabel");
  if (date) date.textContent = new Intl.DateTimeFormat("ar-JO", { timeZone: "Asia/Amman", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const term = document.getElementById("attendanceTermLabel");
  if (term) term.textContent = info.term + " — تقدير تقويمي";
  const home = document.getElementById("view-dashboard");
  if (home && !document.getElementById("teacher-demo-notice")) {
    const notice = document.createElement("p");
    notice.id = "teacher-demo-notice";
    notice.className = "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900";
    notice.textContent = "الأسماء والبيانات تجريبية. أدخل مواعيد مدرستك وفق التقويم الرسمي المعتمد؛ لا يوجد اتصال بخادم الوزارة.";
    home.prepend(notice);
  }
  document.querySelectorAll("#view-lesson-plans input[type=date]").forEach((input) => { if (input.value && input.value < todayISO("Asia/Amman")) input.value = ""; });
}
function attendanceScope() {
  return { date: todayISO("Asia/Amman"), className: document.querySelector("[data-attendance-class]")?.value || "", period: document.querySelector("[data-attendance-period]")?.value || "" };
}
function updateAttendanceSummary() {
  const rows = [...document.querySelectorAll("#studentAttendanceList .student-item")], counts = { present: 0, absent: 0, late: 0 };
  rows.forEach((row) => { counts[row.dataset.status || "present"]++; });
  const card = document.querySelector('.awn-attendance-summary');
  if (card) {
    card.querySelector('[data-attendance-in-room]').textContent = counts.present + counts.late;
    card.querySelector('[data-attendance-total]').textContent = rows.length;
    Object.entries(counts).forEach(([status, count]) => {
      card.querySelector('[data-attendance-count="' + status + '"]').textContent = count;
      card.querySelector('[data-attendance-segment="' + status + '"]').style.width = (rows.length ? count / rows.length * 100 : 0) + '%';
    });
    card.querySelector('[data-attendance-meter]').setAttribute('aria-label', counts.present + ' حاضر في الموعد، ' + counts.late + ' متأخر، ' + counts.absent + ' غائب، من أصل ' + rows.length);
    card.querySelector('[data-attendance-note]').textContent = rows.length ? 'يشمل عدد الحضور الطلبة المتأخرين.' : 'لا يوجد طلبة في كشف هذه الشعبة.';
  }
  return counts;
}


function markAllAttendance(status) {
  document.querySelectorAll("#studentAttendanceList .student-item").forEach((row) => setRowStatus(row, status));
  updateAttendanceSummary();
}
function downloadTeacherCsv(filename, rows) { return AwnUtils.downloadCsv(filename, rows); }
function exportAttendance() {
  const scope = attendanceScope(), rows = [...document.querySelectorAll("#studentAttendanceList .student-item")], labels = { present: "حاضر", absent: "غائب", late: "متأخر" };
  downloadTeacherCsv("attendance-" + scope.date + ".csv", [["التاريخ", scope.date], ["الشعبة", scope.className], ["الحصة", scope.period], [], ["رمز تجريبي", "اسم الطالب", "الحالة"], ...rows.map((row) => [row.querySelector("span")?.textContent.trim(), row.querySelector(".text-sm.font-bold")?.textContent.trim(), labels[row.dataset.status] || "حاضر"])]);
}

function planControlState(field) { return { type: field.type || "", value: field.value, checked: field.type === "checkbox" ? field.checked : undefined }; }

function restorePlanControl(field, state) {
  if (!state) return;
  if (field.type === "checkbox") field.checked = Boolean(state.checked ?? state.value === "on");
  else field.value = String(state.value ?? "");
}


function gradeKey() {
  const selects = document.querySelectorAll("#view-grades select");
  return [selects[0]?.value || "", selects[1]?.value || ""].join("|");
}
function gradeRows() {
  return [...document.querySelectorAll("#view-grades tbody tr")].map((row) => {
    const inputs = [...row.querySelectorAll('input[type="number"]')];
    inputs.forEach((input, index) => { input.dataset.gradeComponent = String(index); });
    return { row, inputs, name: row.cells[1]?.textContent.trim() || "" };
  });
}
function gradeMaxima() {
  return [...document.querySelectorAll("#gradeCriteria input[data-grade-component]")].map((field) => Math.max(1, Number(field.value) || 1));
}
function gradeStore() { return teacherRead("grades", {}); }
function renderGradeSummary() {
  const maxima = gradeMaxima(), cap = maxima.reduce((a, b) => a + b, 0);
  const totals = gradeRows().map(({ row, inputs }) => {
    let total = 0, valid = true;
    inputs.forEach((field, index) => {
      const value = field.value === "" ? null : Number(field.value), limit = maxima[index] || 1;
      field.max = String(limit); field.classList.add("grade-score");
      field.setCustomValidity(value !== null && (value < 0 || value > limit) ? "العلامة تتجاوز الحد الذي حدده المعلم." : "");
      if (value !== null && (value < 0 || value > limit)) valid = false;
      total += value ?? 0;
    });
    if (row.cells.length) row.cells[row.cells.length - 1].textContent = valid ? total + " / " + cap : "تحقق من العلامات";
    return total;
  });
  const headers = [...document.querySelectorAll("#view-grades thead th")];
  GRADE_COMPONENTS.forEach((item, index) => {
    if (headers[index + 2]) headers[index + 2].textContent = item.label + " (" + maxima[index] + ")";
  });
  if (headers.length) headers[headers.length - 1].textContent = "المجموع (" + cap + ")";
  const output = document.getElementById("gradeSummary");
  if (output) output.textContent = "متوسط الصف: " + (totals.length ? (totals.reduce((a, b) => a + b, 0) / (totals.length * cap) * 100).toFixed(1) : "0.0") + "% • متابعة حسابية تجريبية دون قرار تربوي: " + totals.filter((total) => total < cap * 0.5).length;
}
function loadGradeScope() {
  const configs = teacherRead("grade-config", {}), config = configs[gradeKey()];
  if (config) document.querySelectorAll("#gradeCriteria input[data-grade-component]").forEach((field, index) => { field.value = config[index] || field.value; });
  const saved = gradeStore()[gradeKey()] || {};
  gradeRows().forEach(({ inputs, name }) => saved[name]?.scores?.forEach((score, index) => { if (inputs[index]) inputs[index].value = score; }));
  renderGradeSummary();
}
function setupGrades() {
  const view = document.getElementById("view-grades"), table = view?.querySelector(".overflow-hidden");
  if (!view || !table) return;
  const panel = document.createElement("section");
  panel.id = "gradeCriteria"; panel.className = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
  panel.innerHTML = '<div class="flex flex-wrap items-center justify-between gap-3"><div><h3 class="font-bold">توزيع علامة المبحث</h3><p class="mt-1 text-xs text-slate-500">عدّل الحدود وفق خطة المبحث المعتمدة في مدرستك؛ القيم الظاهرة تجريبية وليست توزيعًا وزاريًا.</p></div><div class="flex flex-wrap gap-2"></div></div><p id="gradeSummary" class="mt-3 text-sm font-semibold text-primary" role="status"></p>';
  const wrap = panel.querySelector(".flex.flex-wrap.gap-2");
  GRADE_COMPONENTS.forEach((item, index) => {
    const current = gradeRows()[0]?.inputs[index], label = document.createElement("label"), field = document.createElement("input");
    label.className = "flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold";
    field.type = "number"; field.min = "1"; field.max = "100"; field.value = current?.max || "20";
    field.dataset.gradeComponent = String(index); field.className = "w-16 rounded border p-1 text-center"; field.setAttribute("aria-label", "الحد الأعلى: " + item.label);
    label.append(item.label, field); wrap.appendChild(label);
  });
  table.before(panel);
  const bar = view.querySelector(".no-print.bg-white"), actions = bar?.querySelector(".flex.items-center.gap-2");
  if (actions) {
    const save = [...actions.querySelectorAll("button")].find((button) => button.textContent.includes("حفظ العلامات محليًا"));
    if (save) save.dataset.teacherAction = "save-grades";
    const exp = document.createElement("button"); exp.type = "button"; exp.dataset.teacherAction = "export-grades"; exp.className = "rounded-lg border px-3 py-2 text-xs"; exp.textContent = "تصدير CSV"; actions.appendChild(exp);
  }
  document.addEventListener("input", (event) => {
    if (event.target.closest("#view-grades")) renderGradeSummary();
    if (event.target.matches("#gradeCriteria input")) {
      const all = teacherRead("grade-config", {}); all[gradeKey()] = gradeMaxima(); teacherWrite("grade-config", all);
    }
  });
  view.querySelectorAll("select").forEach((field) => field.addEventListener("change", loadGradeScope));
  loadGradeScope();
}
function saveGrades() {
  if (!requireDemoMode()) return;
  const invalid = gradeRows().flatMap((item) => item.inputs).find((field) => !field.checkValidity());
  if (invalid) return invalid.reportValidity();
  const maxima = gradeMaxima(), all = gradeStore();
  all[gradeKey()] = Object.fromEntries(gradeRows().map(({ name, inputs }) => {
    const scores = inputs.map((field) => field.value);
    return [name, { scores, total: inputs.reduce((sum, field) => sum + (Number(field.value) || 0), 0), maximum: maxima.reduce((a, b) => a + b, 0), updated: new Date().toISOString() }];
  }));
  if (teacherWrite("grades", all)) window.AwnUI.dialog({ icon: "success", title: "حُفظت العلامات محليًا في هذا المتصفح", timer: 1600, showConfirmButton: false });
}
function exportGrades() {
  const maxima = gradeMaxima();
  downloadTeacherCsv("grades-demo.csv", [["الصف والمبحث", gradeKey()], ["تصدير محلي تجريبي — غير مرسل للوزارة"], [], ["اسم الطالب", ...GRADE_COMPONENTS.map((item, index) => item.label + " / " + maxima[index]), "المجموع"], ...gradeRows().map(({ name, inputs }) => [name, ...inputs.map((field) => field.value), inputs.reduce((sum, field) => sum + (Number(field.value) || 0), 0)])]);
}

function studentCards() {
  const view = document.getElementById("view-students");
  const grid = [...(view?.querySelectorAll(".grid") || [])].find((element) => [...element.children].some((child) => child.querySelector("h3")));
  return grid ? [...grid.children] : [];
}
function notesFor(name) {
  const all = teacherRead("student-notes", {});
  return Array.isArray(all[name]) ? all[name] : [];
}
function updateNoteCounts() {
  studentCards().forEach((card) => {
    const button = [...card.querySelectorAll("button")].find((item) => item.dataset.teacherAction === "student-notes");
    if (button) button.textContent = "الملاحظات (" + notesFor(card.dataset.studentName).length + ")";
  });
}
function filterStudentCards() {
  const query = document.getElementById("studentSearch")?.value.trim().toLocaleLowerCase("ar") || "";
  studentCards().forEach((card) => { card.hidden = query && !card.dataset.studentName?.toLocaleLowerCase("ar").includes(query); });
}
function showStudentNotes(name) {
  const notes = notesFor(name);
  const html = notes.length ? "<ul>" + notes.map((note) => "<li>" + esc(note.text) + " — " + esc(note.date) + "</li>").join("") + "</ul>" : "<p>لا توجد ملاحظات محلية محفوظة.</p>";
  window.AwnUI.dialog({ title: "ملاحظات " + name, html, input: "textarea", inputLabel: "إضافة ملاحظة", inputPlaceholder: "اكتب ملاحظة متابعة...", showCancelButton: true, confirmButtonText: "حفظ محليًا", cancelButtonText: "إلغاء" }).then((result) => {
    if (!result.isConfirmed || !result.value?.trim()) return;
    const all = teacherRead("student-notes", {}); all[name] = Array.isArray(all[name]) ? all[name] : [];
    all[name].unshift({ text: result.value.trim(), date: todayISO("Asia/Amman") });
    if (teacherWrite("student-notes", all)) updateNoteCounts();
  });
}
async function showStudentRecord(name) {
  const grade = gradeStore()[gradeKey()]?.[name];
  const res = typeof ApiService?.getAllAttendance === "function" ? await ApiService.getAllAttendance() : null;
  const allAtt = res?.success ? res.data : (Array.isArray(res) ? res : []);
  const history = allAtt.filter((item) => item.records?.some((record) => record.name === name));
  const absence = history.reduce((sum, item) => sum + item.records.filter((record) => record.name === name && record.status === "absent").length, 0);
  window.AwnUI.dialog({ title: "سجل " + name, html: '<div class="text-right leading-8"><p>العلامة: ' + (grade ? esc(grade.total + " / " + grade.maximum) : "لا توجد علامة محفوظة") + '</p><p>سجلات الحضور المحلية: ' + history.length + ' • غياب: ' + absence + '</p><p>ملاحظات محلية: ' + notesFor(name).length + '</p><small>مؤشرات متابعة تجريبية وليست قرارًا تربويًا.</small></div>', confirmButtonText: "إغلاق" });
}
function createOutcomeTracker() {
  const view = document.getElementById("view-students");
  const grid = [...(view?.querySelectorAll(".grid") || [])].find((element) => [...element.children].some((child) => child.querySelector("h3")));
  if (!grid || document.getElementById("outcomeTracker")) return;
  const panel = document.createElement("section"); panel.id = "outcomeTracker"; panel.className = "rounded-xl border bg-white p-5 shadow-sm";
  panel.innerHTML = '<h3 class="font-bold">متابعة نواتج التعلم</h3><p class="mb-3 mt-1 text-xs text-slate-500">دوّن الناتج من كتاب المبحث أو الخطة المعتمدة وسجّل نتيجة التقويم التكويني. يحفظ محليًا.</p><form id="outcomeForm" class="grid grid-cols-1 gap-3 md:grid-cols-4"><input name="outcome" required class="rounded-lg border p-2 text-sm md:col-span-2" placeholder="نتاج التعلم"><select name="student" class="rounded-lg border p-2 text-sm"></select><select name="status" class="rounded-lg border p-2 text-sm"><option>أتقن</option><option>يحتاج دعمًا</option><option>لم يقيّم</option></select><button class="rounded-lg bg-primary p-2 font-bold text-white md:col-span-4">حفظ المتابعة</button></form><div id="outcomeEntries" class="mt-3 space-y-2"></div>';
  const select = panel.querySelector('[name="student"]');
  studentCards().forEach((card) => { if (card.dataset.studentName) select.add(new Option(card.dataset.studentName, card.dataset.studentName)); });
  panel.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault(); if (!requireDemoMode()) return;
    const form = new FormData(event.currentTarget), items = teacherRead("outcomes", []);
    items.unshift({ outcome: form.get("outcome"), student: form.get("student"), status: form.get("status"), date: todayISO("Asia/Amman") });
    if (teacherWrite("outcomes", items.slice(0, 100))) { event.currentTarget.reset(); renderOutcomes(); }
  });
  grid.before(panel); renderOutcomes();
}
function renderOutcomes() {
  const target = document.getElementById("outcomeEntries"); if (!target) return;
  const items = teacherRead("outcomes", []).slice(0, 6);
  target.innerHTML = items.length ? items.map((item) => '<div class="flex justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm"><span><b>' + esc(item.student) + "</b> — " + esc(item.outcome) + '</span><span class="font-semibold">' + esc(item.status) + " · " + esc(item.date) + "</span></div>").join("") : '<p class="text-xs text-slate-500">لا توجد متابعات بعد.</p>';
}
function setupStudents() {
  const view = document.getElementById("view-students");
  const search = view?.querySelector('input[placeholder*="اسم الطالب"]');
  if (!view) return;
  if (search) { search.id = "studentSearch"; search.addEventListener("input", filterStudentCards); }
  const buttons = [...view.querySelectorAll("button")];
  buttons.find((button) => button.textContent.includes("تصفية السجل"))?.setAttribute("data-teacher-action", "filter-students");
  buttons.find((button) => button.textContent.includes("إضافة ملاحظة عامة"))?.setAttribute("data-teacher-action", "general-note");
  studentCards().forEach((card, index) => {
    const name = card.querySelector("h3")?.textContent.trim(); if (!name) return;
    card.dataset.studentName = name;
    const note = [...card.querySelectorAll("button")].find((button) => button.textContent.includes("الملاحظات"));
    if (note) { note.dataset.teacherAction = "student-notes"; note.dataset.studentName = name; note.textContent = "الملاحظات (0)"; }
    const record = [...card.querySelectorAll("button")].find((button) => button.textContent.includes("السجل الأكاديمي"));
    if (record) { record.dataset.teacherAction = "student-record"; record.dataset.studentName = name; }
    const more = [...card.querySelectorAll("button")].find((button) => button.querySelector(".material-symbols-outlined")?.textContent.trim() === "more_vert");
    if (more) { more.dataset.teacherAction = "student-notes"; more.dataset.studentName = name; more.setAttribute("aria-label", "ملاحظات " + name); }
  });
  createOutcomeTracker();
}async function initTeacherCalendar() {
  let config = { notice: "أدخل المواعيد بحسب تقويم مدرستك المعتمد؛ لا يتصل هذا العرض بالوزارة." };
  try { config = { ...config, ...await (await fetch("assets/data/jordan-teacher-calendar.json")).json() }; }
  catch (error) { console.warn("Calendar JSON unavailable.", error); }
  const home = document.getElementById("view-dashboard"), form = home?.querySelector("#add-assignment-form")?.closest(".bg-white");
  if (!form || document.getElementById("teacherCalendar")) return;
  const panel = document.createElement("section"); panel.id = "teacherCalendar"; panel.className = "rounded-xl border bg-white p-5 shadow-sm";
  panel.innerHTML = '<div class="mb-3 flex flex-wrap justify-between gap-2"><div><h3 class="font-bold">مواعيد الصف والمدرسة</h3><p class="mt-1 text-xs text-slate-500">' + esc(config.notice) + '</p></div><span class="rounded-full bg-amber-50 px-3 py-1 text-xs">تقويم تجريبي محلي</span></div><form id="teacherCalendarForm" class="grid grid-cols-1 gap-3 md:grid-cols-4"><input name="title" required class="rounded-lg border p-2 text-sm" placeholder="امتحان، اجتماع، فعالية..."><input name="date" required type="date" class="rounded-lg border p-2 text-sm"><select name="type" class="rounded-lg border p-2 text-sm"><option>امتحان</option><option>اجتماع</option><option>فعالية مدرسية</option><option>موعد آخر</option></select><button class="rounded-lg bg-primary p-2 text-sm font-bold text-white">إضافة موعد</button></form><div id="teacherCalendarEvents" class="mt-3 space-y-2"></div>';
  panel.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault(); if (!requireDemoMode()) return;
    const formData = new FormData(event.currentTarget), items = teacherRead("calendar-events", []);
    items.push({ title: formData.get("title").trim(), date: formData.get("date"), type: formData.get("type") });
    items.sort((a, b) => a.date.localeCompare(b.date));
    if (teacherWrite("calendar-events", items)) { event.currentTarget.reset(); renderCalendarEvents(); }
  });
  form.after(panel); renderCalendarEvents();
}
function renderCalendarEvents() {
  const target = document.getElementById("teacherCalendarEvents"); if (!target) return;
  const items = teacherRead("calendar-events", []).filter((item) => item.date >= todayISO("Asia/Amman")).slice(0, 5);
  target.innerHTML = items.length ? items.map((item) => '<div class="flex justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm"><span>' + esc(item.title) + ' <small>(' + esc(item.type) + ')</small></span><time>' + esc(item.date) + "</time></div>").join("") : '<p class="text-xs text-slate-500">أضف مواعيد مدرستك؛ لا توجد تواريخ رسمية مضمّنة.</p>';
}
function showParentMessage(student) {
  const names = studentCards().map((card) => card.dataset.studentName).filter(Boolean);
  window.AwnUI.dialog({ title: "مسودة رسالة لولي الأمر", input: "textarea", inputPlaceholder: "اكتب رسالة متابعة أو إشادة...", html: '<label class="block pb-2 text-right text-sm">الطالب</label><select id="parentMessageStudent" class="swal2-select">' + names.map((name) => '<option value="' + esc(name) + '"' + (name === student ? " selected" : "") + ">" + esc(name) + "</option>").join("") + "</select>", showCancelButton: true, confirmButtonText: "حفظ كمسودة محلية", cancelButtonText: "إلغاء", preConfirm: (message) => ({ message, student: document.getElementById("parentMessageStudent")?.value || "" }) }).then((result) => {
    if (!result.isConfirmed || !result.value?.message?.trim() || !requireDemoMode()) return;
    const drafts = teacherRead("parent-message-drafts", []);
    drafts.unshift({ student: result.value.student, message: result.value.message.trim(), date: todayISO("Asia/Amman"), status: "مسودة غير مرسلة" });
    if (teacherWrite("parent-message-drafts", drafts)) window.AwnUI.dialog({ icon: "success", title: "حُفظت المسودة ولم تُرسل", timer: 1500, showConfirmButton: false });
  });
}
function quickAbsence() {
  const rows = [...document.querySelectorAll("#studentAttendanceList .student-item")];
  const names = rows.map((row) => row.querySelector(".text-sm.font-bold")?.textContent.trim() || "");
  window.AwnUI.dialog({ title: "تسجيل غياب سريع", input: "select", inputOptions: Object.fromEntries(names.map((name) => [name, name])), inputPlaceholder: "اختر الطالب", showCancelButton: true, confirmButtonText: "تسجيل الغياب", cancelButtonText: "إلغاء" }).then((result) => {
    if (!result.isConfirmed || !result.value || !requireDemoMode()) return;
    const row = rows.find((item) => item.querySelector(".text-sm.font-bold")?.textContent.trim() === result.value);
    if (row) setRowStatus(row, "absent");
    updateAttendanceSummary(); saveAttendanceUI(); navigateTo("view-attendance");
  });
}
function showTeacherNotifications() {
  const events = teacherRead("calendar-events", []).filter((item) => item.date >= todayISO("Asia/Amman")).slice(0, 4);
  const drafts = teacherRead("parent-message-drafts", []).length;
  const list = events.length ? "<ul>" + events.map((item) => "<li>" + esc(item.date + " — " + item.title) + "</li>").join("") + "</ul>" : "<p>لا توجد مواعيد قادمة محفوظة.</p>";
  window.AwnUI.dialog({ title: "تذكيرات المعلم", html: list + '<p class="mt-3 text-xs">مسودات رسائل غير مرسلة: ' + drafts + "</p>", confirmButtonText: "إغلاق" });
}
function handleTeacherAction(action, element) {
  if (action === "save-grades") return saveGrades();
  if (action === "export-grades") return exportGrades();
  if (action === "export-attendance") return exportAttendance();
  if (action === "parent-message") return showParentMessage();
  if (action === "quick-absence") return quickAbsence();
  if (action === "notifications") return showTeacherNotifications();
  if (action === "student-notes") return showStudentNotes(element.dataset.studentName);
  if (action === "student-record") return showStudentRecord(element.dataset.studentName);
  if (action === "general-note") return window.AwnUI.dialog({ title: "اختر طالبًا لإضافة ملاحظة", input: "select", inputOptions: Object.fromEntries(studentCards().map((card) => [card.dataset.studentName, card.dataset.studentName])), inputPlaceholder: "اختر الطالب", showCancelButton: true, confirmButtonText: "متابعة", cancelButtonText: "إلغاء" }).then((result) => { if (result.isConfirmed) showStudentNotes(result.value); });
  if (action === "toggle-quick-actions") { const menu = document.getElementById("quickActionsMenu"); if (menu) { const open = menu.classList.contains("hidden"); menu.classList.toggle("hidden", !open); menu.hidden = !open; element.setAttribute("aria-expanded", String(open)); } return; }
  if (action === "filter-students") return window.AwnUI.dialog({ title: "تصفية سجل الطلاب", input: "select", inputOptions: { all: "كل الطلاب", absence: "بحاجة لمتابعة الحضور", notes: "لديهم ملاحظات محفوظة" }, inputValue: "all", showCancelButton: true, confirmButtonText: "تطبيق", cancelButtonText: "إلغاء" }).then((result) => {
    if (!result.isConfirmed) return;
    studentCards().forEach((card) => { card.hidden = result.value === "absence" ? !card.textContent.includes("كثرة الغياب") : result.value === "notes" ? notesFor(card.dataset.studentName).length === 0 : false; });
  });
}
function handleTeacherStudentAction(button) {
  if (button?.querySelector(".material-symbols-outlined")?.textContent.trim() === "notifications") { showTeacherNotifications(); return true; }
  return false;
}
function runTeacherSearch() {
  const query = document.getElementById("globalTeacherSearch")?.value.trim(); if (!query) return;
  const link = [...document.querySelectorAll("[data-path]")].find((item) => item.textContent.includes(query));
  if (link) return navigateTo(link.dataset.path);
  navigateTo("view-students");
  const search = document.getElementById("studentSearch");
  if (search) { search.value = query; filterStudentCards(); }
}
function setupTeacherProfessionalProfile() { window.AwnEmploymentProfile?.mount(); }
function setupTeacherEnhancements() {
  setTeacherLabels();
  setupTeacherProfessionalProfile();
  const attendance = document.getElementById("view-attendance"), selects = attendance?.querySelectorAll("select") || [];
  if (selects[0]) selects[0].dataset.attendanceClass = "true";
  if (selects[1]) selects[1].dataset.attendancePeriod = "true";
  selects.forEach((field) => field.addEventListener("change", renderAttendance));
  const list = document.getElementById("studentAttendanceList");
  if (list) {
    const wrap = document.createElement("div"); wrap.className = "border-b bg-white p-3 no-print";
    wrap.innerHTML = '<label class="sr-only" for="attendanceSearch">ابحث في كشف الصف</label><input id="attendanceSearch" type="search" class="w-full rounded-lg border px-3 py-2 text-sm" placeholder="ابحث باسم الطالب في الكشف...">';
    list.prepend(wrap); wrap.querySelector("input").addEventListener("input", (event) => {
      const query = event.target.value.trim().toLocaleLowerCase("ar");
      list.querySelectorAll(".student-item").forEach((row) => { row.hidden = !row.textContent.toLocaleLowerCase("ar").includes(query); });
    });
  }
  const save = document.getElementById("saveAttendanceBtn"); if (save) save.textContent = "حفظ محلي لهذا الصف والحصة";
  setupGrades(); setupStudents();
  const global = document.querySelector('header input[type="search"]');
  if (global) { global.id = "globalTeacherSearch"; global.setAttribute("aria-label", "ابحث عن طالب أو صفحة"); global.addEventListener("keydown", (event) => { if (event.key === "Enter" && ![...document.querySelectorAll("#sidebar [data-path]")].some((link) => link.textContent.includes(global.value.trim()))) runTeacherSearch(); }); }
  const icon = [...document.querySelectorAll("header .material-symbols-outlined")].find((node) => node.textContent.trim() === "notifications");
  icon?.closest("button")?.setAttribute("data-teacher-action", "notifications");
  const exportButton = [...document.querySelectorAll("#view-attendance button")].find((button) => button.textContent.includes("تصدير CSV"));
  exportButton?.setAttribute("data-teacher-action", "export-attendance");
  const quick = document.getElementById("teacherQuickActions");
  if (quick) {
    const panel = quick.querySelector("div"), buttons = [...quick.querySelectorAll("button")];
    if (panel) { panel.id = "quickActionsMenu"; panel.hidden = true; panel.classList.add("hidden"); panel.classList.remove("opacity-0", "pointer-events-none", "group-hover:opacity-100", "group-hover:pointer-events-auto", "translate-y-2", "group-hover:translate-y-0"); }
    buttons[buttons.length - 1]?.setAttribute("data-teacher-action", "toggle-quick-actions");
    buttons.find((button) => button.textContent.includes("رسالة لولي الأمر"))?.setAttribute("data-teacher-action", "parent-message");
    buttons.find((button) => button.textContent.includes("إضافة غياب سريع"))?.setAttribute("data-teacher-action", "quick-absence");
  }
  renderAttendance(); updateNoteCounts(); initTeacherCalendar();
  if (typeof ensureAccessibleNames === "function") ensureAccessibleNames(document);
}
document.addEventListener("DOMContentLoaded", setupTeacherEnhancements);
document.addEventListener("change", (event) => {
  if (event.target.type === "checkbox" && event.target.closest("#view-lesson-plans")) schedulePlanAutosave("quarterly", autosaveQuarterly);
});