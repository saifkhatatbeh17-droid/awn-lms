import "../services/admin-service.js";

await AwnSession.ready;
if (!AwnSession.requireRole("admin")) throw new Error("ADMIN_ROLE_REQUIRED");
const session = AwnSession.current();

const dialog = document.querySelector("[data-user-dialog]");
const form = document.querySelector("[data-user-form]");
const errors = document.querySelector("[data-admin-error]");
const status = document.querySelector("[data-admin-status]");
const adminService = window.AdminService;
const roleLabels = adminService.roleLabels;
const actionLabels = { create: "إنشاء حساب", update: "تعديل بيانات", activate: "تفعيل حساب", deactivate: "إيقاف حساب" };
let users = [];
let query = "";
let roleFilter = "all";
let statusFilter = "all";
let organizationFilter = "all";
let auditQuery = "";
let auditActionFilter = "all";
let editingUserId = null;

function escapeHtml(value) { return AwnUtils.escapeHtml(value); }
function showError(message) { errors.textContent = message; errors.hidden = false; }
function clearError() { errors.textContent = ""; errors.hidden = true; }
function roleName(role) { return roleLabels[role] || "غير معروف"; }
function isMissingOrganization(value) {
  const organization = String(value || "").trim();
  return !organization || organization.toLocaleLowerCase("ar") === "غير محدد";
}
function userCell(user) {
  const initial = escapeHtml((user.name || user.username || "؟").trim().charAt(0));
  return '<span class="admin-user-cell__avatar" aria-hidden="true">' + initial + '</span><span><strong>' + escapeHtml(user.name) + '</strong><small>' + escapeHtml(user.id) + '</small></span>';
}
function filteredUsers() {
  const search = query.trim().toLocaleLowerCase("ar");
  return users.filter((user) => {
    const searchable = [user.name, user.username, user.organization].join(" ").toLocaleLowerCase("ar");
    const stateMatches = statusFilter === "all" || (statusFilter === "inactive" ? user.isActive === false : user.isActive !== false);
    const organizationMatches = organizationFilter === "all" || (organizationFilter === "__missing__" ? isMissingOrganization(user.organization) : user.organization === organizationFilter);
    return (roleFilter === "all" || user.role === roleFilter) && stateMatches && organizationMatches && (!search || searchable.includes(search));
  });
}
function renderOrganizationOptions() {
  const select = document.querySelector("[data-organization-filter]");
  const organizations = Array.from(new Set(users.map((user) => String(user.organization || "").trim()).filter((value) => value && value !== "غير محدد"))).sort((a, b) => a.localeCompare(b, "ar"));
  select.innerHTML = '<option value="all">كل الجهات</option><option value="__missing__">بلا جهة مسجلة</option>' + organizations.map((organization) => '<option value="' + escapeHtml(organization) + '">' + escapeHtml(organization) + '</option>').join("");
  if (organizationFilter !== "all" && organizationFilter !== "__missing__" && !organizations.includes(organizationFilter)) organizationFilter = "all";
  select.value = organizationFilter;
}
function renderSummary() {
  const active = users.filter((user) => user.isActive !== false).length;
  const inactive = users.length - active;
  const educators = users.filter((user) => ["teacher", "principal", "supervisor"].includes(user.role)).length;
  const organizations = new Set(users.map((user) => String(user.organization || "").trim()).filter((value) => value && value !== "غير محدد")).size;
  const missing = users.filter((user) => isMissingOrganization(user.organization)).length;
  document.querySelector('[data-stat="total"]').textContent = users.length;
  document.querySelector('[data-stat="active"]').textContent = active;
  document.querySelector('[data-stat="inactive"]').textContent = inactive;
  document.querySelector('[data-stat="educators"]').textContent = educators;
  document.querySelector('[data-stat="organizations"]').textContent = organizations;
  document.querySelector("[data-quality-missing]").textContent = missing;
  document.querySelector("[data-quality-message]").textContent = missing ? "حسابات بلا جهة مسجلة" : "كل الحسابات مرتبطة بجهة";
  document.querySelector("[data-quality-state]").textContent = missing ? "تحتاج مراجعة" : "مكتملة";
  const total = Math.max(users.length, 1);
  document.querySelector("[data-role-summary]").innerHTML = Object.entries(roleLabels).map(([role, label]) => {
    const count = users.filter((user) => user.role === role).length;
    return '<div class="admin-role-row"><span class="admin-role-row__label">' + escapeHtml(label) + '</span><progress class="admin-role-row__progress" max="100" value="' + Math.round(count / total * 100) + '" aria-label="' + escapeHtml(label) + ': ' + count + '"></progress><strong class="admin-role-row__count">' + count + '</strong></div>';
  }).join("");
  document.querySelector("[data-recent-users]").innerHTML = users.slice(0, 5).map((user) => '<tr><td><span class="admin-user-cell">' + userCell(user) + '</span></td><td dir="ltr">' + escapeHtml(user.username) + '</td><td>' + escapeHtml(roleName(user.role)) + '</td><td><span class="admin-badge ' + (user.isActive === false ? "admin-badge--inactive" : "admin-badge--active") + '">' + (user.isActive === false ? "موقوف" : "نشط") + '</span></td></tr>').join("") || '<tr><td colspan="4">لا توجد حسابات.</td></tr>';
}
function renderUsers() {
  renderOrganizationOptions();
  const items = filteredUsers();
  document.querySelector("[data-user-count]").textContent = items.length + " من " + users.length;
  document.querySelector("[data-users-empty]").hidden = items.length > 0;
  document.querySelector("[data-users-body]").innerHTML = items.map((user) => {
    const active = user.isActive !== false;
    return '<tr><td><span class="admin-user-cell">' + userCell(user) + '</span></td><td dir="ltr">' + escapeHtml(user.username) + '</td><td>' + escapeHtml(roleName(user.role)) + '</td><td>' + escapeHtml(user.organization || "غير محدد") + '</td><td><span class="admin-badge ' + (active ? "admin-badge--active" : "admin-badge--inactive") + '">' + (active ? "نشط" : "موقوف") + '</span></td><td><div class="admin-user-actions"><button class="admin-table-action" type="button" data-user-action="edit" data-user-id="' + escapeHtml(user.id) + '">تعديل</button><button class="admin-table-action" type="button" data-user-action="toggle" data-user-id="' + escapeHtml(user.id) + '" aria-label="' + (active ? "إيقاف" : "تفعيل") + ' حساب ' + escapeHtml(user.name) + '">' + (active ? "إيقاف" : "تفعيل") + '</button></div></td></tr>';
  }).join("");
}
function dateText(value) { return AwnUtils.formatDate(value, { dateStyle: "short", timeStyle: "short" }); }
async function filteredAuditEvents() {
  const res = await adminService.listAuditEvents();
  const rawList = res?.data || (Array.isArray(res) ? res : []);
  return rawList.filter((item) => {
    const search = auditQuery.trim().toLocaleLowerCase("ar");
    const text = [item.actor, item.targetName, item.targetUsername, item.detail, actionLabels[item.action]].join(" ").toLocaleLowerCase("ar");
    return (auditActionFilter === "all" || item.action === auditActionFilter) && (!search || text.includes(search));
  });
}
function auditRow(item, includeActor) {
  const cells = [
    '<td>' + escapeHtml(dateText(item.createdAt)) + '</td>',
    includeActor ? '<td>' + escapeHtml(item.actor || "—") + '</td>' : "",
    '<td><span class="admin-event-label">' + escapeHtml(actionLabels[item.action] || "نشاط إداري") + '</span></td>',
    '<td><strong>' + escapeHtml(item.targetName || "—") + '</strong><small class="admin-table-subtext" dir="ltr">' + escapeHtml(item.targetUsername || "") + '</small></td>',
  ];
  if (includeActor) cells.push('<td>' + escapeHtml(item.detail || "—") + '</td>');
  return "<tr>" + cells.join("") + "</tr>";
}
async function renderRecentAudit() {
  const demoMode = window.AWN_CONFIG?.demoMode === true && !window.AWN_CONFIG?.apiBaseUrl;
  let items = [];
  if (demoMode) {
    const res = await adminService.listAuditEvents();
    const rawList = res?.data || (Array.isArray(res) ? res : []);
    items = rawList.slice(0, 5);
  }
  document.querySelector("[data-recent-activity-note]").textContent = demoMode ? "تغييرات محلية تجريبية في هذا المتصفح." : "سجل التدقيق يحتاج ربطًا بالخادم.";
  document.querySelector("[data-recent-activity]").innerHTML = items.map((item) => auditRow(item, false)).join("") || '<tr><td colspan="3">' + (demoMode ? "لا توجد نشاطات بعد." : "سجل التدقيق غير مربوط بالخادم.") + '</td></tr>';
}
async function renderAudit() {
  const demoMode = window.AWN_CONFIG?.demoMode === true && !window.AWN_CONFIG?.apiBaseUrl;
  document.querySelector("[data-audit-boundary]").hidden = !demoMode;
  document.querySelector("[data-audit-unavailable]").hidden = demoMode;
  document.querySelector("[data-audit-controls]").hidden = !demoMode;
  document.querySelector("[data-audit-table-wrap]").hidden = !demoMode;
  if (!demoMode) {
    document.querySelector("[data-audit-empty]").hidden = true;
    document.querySelector("[data-audit-count]").textContent = "";
    return;
  }
  const items = await filteredAuditEvents();
  document.querySelector("[data-audit-count]").textContent = items.length + " نشاط";
  document.querySelector("[data-audit-empty]").hidden = items.length > 0;
  document.querySelector("[data-audit-body]").innerHTML = items.map((item) => auditRow(item, true)).join("");
}
function setView(view) {
  const titles = {
    overview: ["نظرة عامة", "متابعة الحسابات وجودة البيانات والأنشطة الإدارية."],
    users: ["إدارة المستخدمين", "بحث وتصفية وتحرير سجلات الحسابات."],
    activity: ["سجل النشاط", "مراجعة تغييرات الإدارة وتصديرها."],
    system: ["حالة الربط", "إعدادات تشغيل الواجهة والخدمات المرتبطة."],
  };
  if (!titles[view]) return;
  document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== view; });
  document.querySelectorAll(".admin-nav__item[data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  document.querySelector("[data-page-title]").textContent = titles[view][0];
  document.querySelector("[data-page-description]").textContent = titles[view][1];
  if (view === "activity") renderAudit();
  AwnUI.enhance();
  if (window.matchMedia("(max-width: 760px)").matches) closeSidebar();
}
function closeSidebar() {
  if (window.AwnSidebar) return window.AwnSidebar.close();
  document.querySelector("#admin-sidebar").classList.remove("is-open");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-expanded", "false");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-label", "فتح القائمة");
  document.querySelector("[data-sidebar-close]").hidden = true;
}
function openSidebar() {
  if (window.AwnSidebar) return window.AwnSidebar.open();
  document.querySelector("#admin-sidebar").classList.add("is-open");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-expanded", "true");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-label", "إغلاق القائمة");
  document.querySelector("[data-sidebar-close]").hidden = false;
}
async function refreshUsers() {
  clearError();
  try {
    const res = await adminService.listUsers();
    users = res?.success ? res.data : (Array.isArray(res) ? res : []);
    renderSummary();
    renderUsers();
    await renderRecentAudit();
    await renderAudit();
  } catch (error) {
    showError("تعذر تحميل المستخدمين. تحقق من إعداد خدمة الإدارة ثم أعد المحاولة.");
    console.error("Admin users load failed", error);
  }
}
function downloadCsv(filename, rows) { return AwnUtils.downloadCsv(filename, rows); }
function exportUsers() {
  const rows = [["الاسم", "اسم الدخول", "الدور", "الجهة", "الحالة"]];
  filteredUsers().forEach((user) => rows.push([user.name, user.username, roleName(user.role), user.organization || "غير محدد", user.isActive === false ? "موقوف" : "نشط"]));
  downloadCsv("awn-users.csv", rows);
}
async function exportAudit() {
  const rows = [["التاريخ والوقت", "منفذ الإجراء", "الإجراء", "الحساب", "اسم الدخول", "التفاصيل"]];
  (await filteredAuditEvents()).forEach((item) => rows.push([dateText(item.createdAt), item.actor, actionLabels[item.action] || "نشاط إداري", item.targetName, item.targetUsername, item.detail]));
  downloadCsv("awn-admin-activity.csv", rows);
}
function openUserDialog(user) {
  editingUserId = user ? user.id : null;
  form.reset();
  document.querySelector("[data-form-error]").hidden = true;
  document.querySelector("[data-dialog-title]").textContent = user ? "تعديل بيانات الحساب" : "إضافة مستخدم";
  document.querySelector("[data-save-user]").textContent = user ? "حفظ التعديلات" : "حفظ المستخدم";
  document.querySelector("[data-dialog-notice]").textContent = window.AWN_CONFIG?.demoMode === true
    ? "تُحفظ التغييرات محليًا لهذا العرض. لا تُنشأ كلمة مرور أو حساب دخول حقيقي."
    : "سيُرسل التعديل إلى خدمة الإدارة. يجب أن يتحقق الخادم من الصلاحيات ويسجل العملية.";
  if (user) {
    form.elements.namedItem("name").value = user.name || "";
    form.elements.namedItem("username").value = user.username || "";
    form.elements.namedItem("role").value = user.role || "";
    form.elements.namedItem("organization").value = user.organization || "";
  }
  dialog.showModal();
  form.elements.namedItem("name").focus();
}
function initializeConfiguration() {
  const config = window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };
  const demoMode = config.demoMode === true && !config.apiBaseUrl;
  const apiConfigured = Boolean(config.apiBaseUrl);
  document.querySelectorAll("[data-admin-name]").forEach((element) => { element.textContent = session.name || "آدمن النظام"; });
  document.querySelector("[data-current-date]").textContent = AwnUtils.formatDate(new Date().toISOString(), { dateStyle: "full" });
  document.querySelector("[data-mode-label]").textContent = demoMode ? "وضع تجريبي" : apiConfigured ? "وضع الربط" : "تهيئة مطلوبة";
  document.querySelector("[data-api-state]").textContent = apiConfigured ? "عنوان API مضبوط" : demoMode ? "تجريبي" : "غير مضبوط";
  document.querySelector("[data-api-heading]").textContent = apiConfigured ? "عنوان خدمة API مضبوط" : demoMode ? "الواجهة تعمل في وضع تجريبي" : "خدمة API غير مهيأة";
  document.querySelector("[data-api-description]").textContent = apiConfigured ? "تم ضبط العنوان؛ لم يُجرَ فحص اتصال بالخادم." : demoMode ? "البيانات محلية وغير معتمدة كسجلات رسمية." : "لا يمكن تحميل بيانات الإدارة حتى ضبط عنوان API.";
  document.querySelector("[data-system-mode]").textContent = demoMode ? "تجريبي — تخزين محلي" : apiConfigured ? "ربط — الوظائف غير الموصولة معطّلة" : "الإنتاج — الخادم غير مهيأ";
  document.querySelector("[data-system-api]").textContent = config.apiBaseUrl || "غير مضبوط";
  document.querySelector("[data-system-users]").textContent = apiConfigured ? "API: /api/admin/users" : demoMode ? "سجلات عرض تجريبية" : "غير متاح — يلزم ربط API";
  document.querySelector("[data-system-audit]").textContent = demoMode ? "محلي تجريبي — غير رسمي" : apiConfigured ? "غير مربوط — يلزم حفظه والتحقق منه على الخادم" : "غير متاح";
}
document.addEventListener("click", async (event) => {
  const target = event.target;
  const viewButton = target.closest("[data-view]");
  if (viewButton) return setView(viewButton.dataset.view);
  if (target.closest("[data-go-users]")) return setView("users");
  if (target.closest("[data-filter-missing-org]")) {
    organizationFilter = "__missing__";
    document.querySelector("[data-organization-filter]").value = organizationFilter;
    setView("users");
    renderUsers();
    return;
  }
  if (target.closest("[data-sidebar-toggle]")) return document.querySelector("#admin-sidebar").classList.contains("is-open") ? closeSidebar() : openSidebar();
  if (target.closest("[data-sidebar-close]")) return closeSidebar();
  if (target.closest("[data-admin-logout]")) return;
  if (target.closest("[data-dialog-close]")) return dialog.close();
  if (target.closest("[data-add-user]")) return openUserDialog(null);
  if (target.closest("[data-export-users]")) return exportUsers();
  if (target.closest("[data-export-audit]")) return exportAudit();
  const action = target.closest("[data-user-action]");
  if (!action) return;
  const user = users.find((item) => String(item.id) === action.dataset.userId);
  if (!user) return;
  if (action.dataset.userAction === "edit") return openUserDialog(user);
  if (action.dataset.userAction === "toggle") {
    const nextIsActive = user.isActive === false;
    if (!nextIsActive && user.username === session.username) {
      showError("لا يمكن إيقاف الحساب المستخدم حاليًا.");
      return;
    }
    if (!nextIsActive && !window.confirm("سيُوقف هذا الحساب ولن يستطيع الوصول. هل تريد المتابعة؟")) return;
    action.disabled = true;
    try {
      AwnUtils.unwrap(await adminService.setUserStatus(user.id, nextIsActive));
      status.textContent = nextIsActive ? "تم تفعيل الحساب." : "تم إيقاف الحساب.";
      await refreshUsers();
    } catch (error) {
      showError("تعذر تحديث الحساب. لم يتم تأكيد التغيير من الخدمة.");
      console.error("Admin status update failed", error);
    } finally { action.disabled = false; }
  }
});

document.querySelector("[data-user-search]").addEventListener("input", (event) => { query = event.target.value; renderUsers(); });
document.querySelector("[data-role-filter]").addEventListener("change", (event) => { roleFilter = event.target.value; renderUsers(); });
document.querySelector("[data-status-filter]").addEventListener("change", (event) => { statusFilter = event.target.value; renderUsers(); });
document.querySelector("[data-organization-filter]").addEventListener("change", (event) => { organizationFilter = event.target.value; renderUsers(); });
document.querySelector("[data-audit-search]").addEventListener("input", (event) => { auditQuery = event.target.value; renderAudit(); });
document.querySelector("[data-audit-action-filter]").addEventListener("change", (event) => { auditActionFilter = event.target.value; renderAudit(); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const formError = document.querySelector("[data-form-error]");
  formError.hidden = true;
  const values = Object.fromEntries(new FormData(form).entries());
  const save = document.querySelector("[data-save-user]");
  save.disabled = true;
  try {
    if (editingUserId) {
      AwnUtils.unwrap(await adminService.updateUser(editingUserId, values));
      status.textContent = "تم حفظ تعديلات الحساب.";
    } else {
      AwnUtils.unwrap(await adminService.createUser(values));
      status.textContent = window.AWN_CONFIG?.demoMode === true ? "أضيف سجل المستخدم إلى بيانات العرض." : "أُرسل طلب إنشاء المستخدم إلى خدمة الإدارة.";
    }
    dialog.close();
    await refreshUsers();
  } catch (error) {
    formError.textContent = error.message === "ADMIN_USERNAME_EXISTS" ? "اسم الدخول مستخدم بالفعل." : error.message === "ADMIN_USER_VALIDATION_FAILED" ? "تحقق من الاسم واسم الدخول والدور والجهة." : "تعذر حفظ الحساب. تحقق من خدمة الإدارة.";
    formError.hidden = false;
  } finally { save.disabled = false; }
});
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => { editingUserId = null; });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && document.querySelector("#admin-sidebar").classList.contains("is-open")) closeSidebar(); });
initializeConfiguration();
refreshUsers();
