const LEAVE_REQUESTS_KEY = "awn_leave_requests_v1";
const LEAVE_ATTACHMENT_DB = "awn_leave_attachments_v1";
let leaveAttachmentDbPromise;
function readLeaveRequests() {
  try { const value = JSON.parse(localStorage.getItem(LEAVE_REQUESTS_KEY) || "[]"); return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : []; }
  catch { return []; }
}
function leaveUser() {
  const user = typeof currentUser === "function" ? currentUser() : {};
  return { id: String(user.username || user.id || "demo-teacher"), name: String(user.name || user.fullName || user.username || "معلم تجريبي") };
}
function leaveEscape(value) { return typeof esc === "function" ? esc(value ?? "") : String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function leaveDateLabel(value) {
  if (!value) return "—";
  const date = new Date(String(value).length === 10 ? value + "T12:00:00Z" : value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("ar-JO", { dateStyle: "medium", timeZone: "Asia/Amman" }).format(date);
}
function leaveTypeLabel(request) { return ({ medical: "إجازة مرضية", contingent: "إجازة عرضية", departure: "مغادرة مبكرة", leave: "إجازة أخرى" })[request.type] || "إجازة"; }
function leavePeriodLabel(request) {
  if (request.type === "departure") return leaveDateLabel(request.startDate) + (request.departureTime ? " • " + leaveEscape(request.departureTime) : "");
  if (request.endDate && request.endDate !== request.startDate) return "من " + leaveDateLabel(request.startDate) + " إلى " + leaveDateLabel(request.endDate);
  return leaveDateLabel(request.startDate);
}
function leaveStatusLabel(status) { return ({ pending: "قيد المراجعة", approved: "موافق عليها", rejected: "مرفوضة" })[status] || "قيد المراجعة"; }
function leaveStatusClass(status) { return ({ pending: "bg-amber-50 text-amber-800", approved: "bg-emerald-50 text-emerald-800", rejected: "bg-red-50 text-red-800" })[status] || "bg-slate-100 text-slate-700"; }
function openLeaveAttachmentDb() {
  if (leaveAttachmentDbPromise) return leaveAttachmentDbPromise;
  leaveAttachmentDbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB غير متاح؛ افتح اللوحتين عبر خادم محلي مشترك.")); return; }
    const request = indexedDB.open(LEAVE_ATTACHMENT_DB, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files", { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("تعذر فتح مساحة المرفقات."));
    request.onblocked = () => reject(new Error("أغلق النسخ الأخرى من اللوحة ثم أعد المحاولة."));
  }).catch((error) => { leaveAttachmentDbPromise = null; throw error; });
  return leaveAttachmentDbPromise;
}
async function saveLeaveAttachment(id, file) {
  const db = await openLeaveAttachmentDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").put({ id, blob: file.slice(0, file.size, "application/pdf"), name: file.name, size: file.size, type: "application/pdf" });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("تعذر حفظ ملف PDF."));
    transaction.onabort = () => reject(transaction.error || new Error("أُوقف حفظ ملف PDF."));
  });
}
async function getLeaveAttachment(id) {
  const db = await openLeaveAttachmentDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("files", "readonly").objectStore("files").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("تعذر قراءة المرفق."));
  });
}
async function deleteLeaveAttachment(id) {
  try {
    const db = await openLeaveAttachmentDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      transaction.objectStore("files").delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch (error) { console.warn("Could not remove an unused leave attachment", error); }
}
function leaveAttachmentCell(request) {
  if (!request.attachmentId) return '<span class="text-slate-400">—</span>';
  return '<button type="button" data-leave-attachment="' + leaveEscape(request.attachmentId) + '" class="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-bold text-blue-800 hover:bg-blue-100" aria-label="فتح المرفق PDF"><span class="material-symbols-outlined text-base">picture_as_pdf</span>PDF</button>';
}
function persistLeaveRequests(items) {
  try { localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(items)); renderTeacherLeaveRequests(); renderPrincipalLeaveRequests(); return true; }
  catch (error) { console.error("Could not save leave requests locally", error); window.Swal?.fire({ icon: "error", title: "تعذر حفظ الطلب في هذا المتصفح.", text: "قد تكون مساحة التخزين المحلية ممتلئة." }); return false; }
}
function renderTeacherLeaveRequests() {
  const tbody = document.getElementById("teacherLeaveRequestRows");
  if (!tbody) return;
  const user = leaveUser(), items = readLeaveRequests().filter((item) => item.teacherId === user.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const count = document.getElementById("teacherLeaveRequestCount");
  if (count) count.textContent = new Intl.NumberFormat("ar-JO").format(items.length) + " طلب";
  tbody.innerHTML = items.length ? items.map((item) => '<tr><td class="p-3 font-bold text-slate-800">' + leaveTypeLabel(item) + '</td><td class="p-3">' + leavePeriodLabel(item) + '</td><td class="max-w-xs whitespace-normal p-3">' + leaveEscape(item.reason) + '</td><td class="p-3">' + leaveDateLabel(item.createdAt) + '</td><td class="p-3">' + leaveAttachmentCell(item) + '</td><td class="max-w-xs whitespace-normal p-3">' + leaveEscape(item.decisionNote || (item.status === "pending" ? "بانتظار مراجعة المدير" : "—")) + '</td><td class="p-3"><span class="rounded-full px-2.5 py-1 font-bold ' + leaveStatusClass(item.status) + '">' + leaveStatusLabel(item.status) + '</span></td></tr>').join("") : '<tr><td colspan="7" class="p-8 text-center text-slate-500">لا توجد طلبات بعد. سيظهر طلبك هنا بعد إرساله للمدير.</td></tr>';
}
function renderPrincipalLeaveRequests() {
  const tbody = document.getElementById("principalLeaveRequestRows");
  if (!tbody) return;
  const all = readLeaveRequests().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const countStatus = (status) => all.filter((item) => item.status === status).length;
  const pending = countStatus("pending"), approved = countStatus("approved"), rejected = countStatus("rejected");
  const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = new Intl.NumberFormat("ar-JO").format(value); };
  set("principalLeavePendingCount", pending); set("principalLeaveApprovedCount", approved); set("principalLeaveRejectedCount", rejected);
  const badge = document.getElementById("leaveRequestBadge"); if (badge) badge.textContent = new Intl.NumberFormat("ar-JO").format(pending);
  const filter = document.getElementById("principalLeaveFilter")?.value || "all", items = filter === "all" ? all : all.filter((item) => item.status === filter);
  tbody.innerHTML = items.length ? items.map((item) => '<tr><td class="p-3 font-bold text-slate-800">' + leaveEscape(item.teacherName) + '</td><td class="p-3">' + leaveTypeLabel(item) + '</td><td class="p-3">' + leavePeriodLabel(item) + '</td><td class="max-w-xs whitespace-normal p-3">' + leaveEscape(item.reason) + '</td><td class="p-3">' + leaveDateLabel(item.createdAt) + '</td><td class="p-3"><span class="rounded-full px-2.5 py-1 font-bold ' + leaveStatusClass(item.status) + '">' + leaveStatusLabel(item.status) + '</span></td><td class="p-3">' + leaveAttachmentCell(item) + '</td><td class="p-3">' + (item.status === "pending" ? '<div class="flex gap-1.5"><button type="button" data-leave-decision="approved" data-request-id="' + leaveEscape(item.id) + '" class="rounded-md bg-emerald-600 px-2.5 py-1.5 font-bold text-white hover:bg-emerald-700">موافقة</button><button type="button" data-leave-decision="rejected" data-request-id="' + leaveEscape(item.id) + '" class="rounded-md bg-red-600 px-2.5 py-1.5 font-bold text-white hover:bg-red-700">رفض</button></div>' : leaveEscape(item.decidedBy || "مدير المدرسة")) + '</td></tr>').join("") : '<tr><td colspan="8" class="p-8 text-center text-slate-500">لا توجد طلبات ضمن هذا العرض.</td></tr>';
}
function updateLeaveRequestDecision(id, status, note) {
  const items = readLeaveRequests(), request = items.find((item) => item.id === id);
  if (!request || request.status !== "pending") return;
  const user = leaveUser();
  request.status = status; request.decisionNote = String(note || "").trim(); request.decidedBy = user.name || "مدير المدرسة"; request.decidedAt = new Date().toISOString();
  persistLeaveRequests(items);
}
function showLeaveNotice(options) {
  if (window.Swal?.fire) return window.Swal.fire(options);
  window.alert([options.title, options.text].filter(Boolean).join("\n"));
}
async function validLeavePdf(file) {
  if (!file || !/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) return false;
  try { return await file.slice(0, 5).text() === "%PDF-"; } catch { return false; }
}
function initLeaveRequests() {
  const form = document.getElementById("teacherLeaveRequestForm"), type = document.getElementById("teacherLeaveType");
  const endField = document.getElementById("teacherLeaveEndField"), endInput = document.getElementById("teacherLeaveEnd");
  const timeField = document.getElementById("teacherDepartureTimeField"), timeInput = document.getElementById("teacherDepartureTime");
  const startInput = document.getElementById("teacherLeaveStart");
  const attachmentField = document.getElementById("teacherLeaveAttachmentField"), attachmentInput = document.getElementById("teacherLeaveAttachment");
  if (startInput && typeof todayISO === "function") startInput.min = todayISO("Asia/Amman");
  if (endInput && typeof todayISO === "function") endInput.min = todayISO("Asia/Amman");
  const updateTypeFields = () => {
    const isDeparture = type?.value === "departure", isMedical = type?.value === "medical";
    const supportsAttachment = isMedical || type?.value === "contingent";
    if (endField) endField.classList.toggle("hidden", isDeparture);
    if (endInput) endInput.required = !isDeparture;
    if (timeField) { timeField.classList.toggle("hidden", !isDeparture); timeField.classList.toggle("grid", isDeparture); }
    if (timeInput) timeInput.required = isDeparture;
    if (attachmentField) attachmentField.classList.toggle("hidden", !supportsAttachment);
    if (attachmentInput) { attachmentInput.required = isMedical; attachmentInput.disabled = !supportsAttachment; if (!supportsAttachment) attachmentInput.value = ""; }
  };
  startInput?.addEventListener("change", () => {
    if (!endInput || !startInput.value) return;
    endInput.min = startInput.value;
    if (endInput.value && endInput.value < startInput.value) endInput.value = startInput.value;
  });
  type?.addEventListener("change", updateTypeFields); updateTypeFields();
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton?.disabled) return;
    if (submitButton) submitButton.disabled = true;
    let savedAttachmentId = "";
    try {
      const values = Object.fromEntries(new FormData(form).entries()), isDeparture = values.type === "departure";
      const isMedical = values.type === "medical", endDate = isDeparture ? values.startDate : values.endDate;
      const reason = String(values.reason || "").trim(), file = (isMedical || values.type === "contingent") ? attachmentInput?.files?.[0] : null;
      if (!reason) { showLeaveNotice({ icon: "warning", title: "أضف سبب الطلب", text: "اكتب سببًا واضحًا قبل الإرسال." }); return; }
      if (isMedical && !file) { showLeaveNotice({ icon: "warning", title: "التقرير الطبي مطلوب", text: "أرفق تقريرًا طبيًا بصيغة PDF لإرسال طلب الإجازة المرضية." }); return; }
      if (!isDeparture && endDate < values.startDate) { showLeaveNotice({ icon: "warning", title: "تحقق من فترة الإجازة", text: "تاريخ الانتهاء يجب أن يساوي تاريخ البداية أو يأتي بعده." }); return; }
      if (file && !(await validLeavePdf(file))) { showLeaveNotice({ icon: "warning", title: "صيغة الملف غير صالحة", text: "اختر ملف PDF صالحًا، وليس ملفًا غُيّر امتداده فقط." }); return; }
      if (file && file.size > 10 * 1024 * 1024) { showLeaveNotice({ icon: "warning", title: "الملف أكبر من الحد المسموح", text: "الحد الأقصى للمرفق الواحد هو 10 ميغابايت." }); return; }
      const user = leaveUser(), items = readLeaveRequests(), id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      if (file) {
        try { await saveLeaveAttachment(id, file); savedAttachmentId = id; }
        catch (error) { console.error("Could not save leave attachment", error); showLeaveNotice({ icon: "error", title: "تعذر حفظ التقرير", text: error.message || "تحقق من مساحة المتصفح وافتح اللوحتين على الخادم المحلي نفسه." }); return; }
      }
      items.push({ id, teacherId: user.id, teacherName: user.name, type: values.type, startDate: values.startDate, endDate, departureTime: isDeparture ? values.departureTime : "", reason, status: "pending", createdAt: new Date().toISOString(), decisionNote: "", decidedBy: "", attachmentId: savedAttachmentId });
      if (persistLeaveRequests(items)) {
        savedAttachmentId = "";
        form.reset(); updateTypeFields();
        showLeaveNotice({ icon: "success", title: "أُرسل الطلب إلى المدير", text: "تم حفظه في النموذج المحلي وسيظهر في صندوق الاعتمادات.", timer: 2200, showConfirmButton: false });
      }
    } catch (error) {
      console.error("Could not submit leave request", error);
      showLeaveNotice({ icon: "error", title: "تعذر إرسال الطلب", text: "تحقق من البيانات ومساحة التخزين ثم أعد المحاولة." });
    } finally {
      if (savedAttachmentId) await deleteLeaveAttachment(savedAttachmentId);
      if (submitButton) submitButton.disabled = false;
    }
  });
  document.getElementById("principalLeaveFilter")?.addEventListener("change", renderPrincipalLeaveRequests);
  document.getElementById("principalLeaveRequestRows")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-leave-decision]"); if (!button) return;
    const id = button.dataset.requestId, status = button.dataset.leaveDecision;
    const apply = (note) => updateLeaveRequestDecision(id, status, note);
    if (window.Swal?.fire) window.Swal.fire({ icon: status === "approved" ? "question" : "warning", title: status === "approved" ? "الموافقة على الطلب؟" : "رفض الطلب؟", input: "textarea", inputLabel: "ملاحظة للمعلم (اختيارية)", inputPlaceholder: "اكتب ملاحظة القرار إن وجدت...", showCancelButton: true, confirmButtonText: status === "approved" ? "تأكيد الموافقة" : "تأكيد الرفض", cancelButtonText: "رجوع" }).then((result) => { if (result.isConfirmed) apply(result.value); });
    else if (window.confirm(status === "approved" ? "تأكيد الموافقة على الطلب؟" : "تأكيد رفض الطلب؟")) apply("");
  });
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-leave-attachment]"); if (!button) return;
    const preview = window.open("about:blank", "_blank");
    try {
      const attachment = await getLeaveAttachment(button.dataset.leaveAttachment);
      if (!attachment?.blob) throw new Error("لم يُعثر على الملف؛ تأكد من استخدام المتصفح والخادم نفسيهما اللذين حُفظ منهما الطلب.");
      const url = URL.createObjectURL(attachment.blob);
      if (preview) { preview.opener = null; preview.location.href = url; }
      else { const link = document.createElement("a"); link.href = url; link.download = attachment.name || "leave-report.pdf"; document.body.appendChild(link); link.click(); link.remove(); }
      window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    } catch (error) {
      preview?.close();
      showLeaveNotice({ icon: "error", title: "تعذر فتح المرفق", text: error.message || "تحقق من اتصال المتصفح المحلي." });
    }
  });
  renderTeacherLeaveRequests(); renderPrincipalLeaveRequests();
}
window.addEventListener("storage", (event) => { if (!event.key || event.key === LEAVE_REQUESTS_KEY) { renderTeacherLeaveRequests(); renderPrincipalLeaveRequests(); } });
document.addEventListener("DOMContentLoaded", initLeaveRequests);