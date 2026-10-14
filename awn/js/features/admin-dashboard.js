import "../services/admin-service.js";

const session = (() => { try { return JSON.parse(localStorage.getItem("awn_session")) || {}; } catch { return {}; } })();
if (session.role !== "admin") {
  window.location.replace("index.html");
  throw new Error("ADMIN_ROLE_REQUIRED");
}

const dialog = document.querySelector("[data-user-dialog]");
const form = document.querySelector("[data-user-form]");
const errors = document.querySelector("[data-admin-error]");
const status = document.querySelector("[data-admin-status]");
const adminService = window.AdminService;
const roleLabels = adminService.roleLabels;
let users = [];
let query = "";
let roleFilter = "all";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function showError(message) { errors.textContent = message; errors.hidden = false; }
function clearError() { errors.textContent = ""; errors.hidden = true; }
function roleName(role) { return roleLabels[role] || "غير معروف"; }
function userCell(user) {
  const initial = escapeHtml((user.name || user.username || "؟").trim().charAt(0));
  return `<span class="admin-user-cell__avatar" aria-hidden="true">${initial}</span><span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.id)}</small></span>`;
}
function filteredUsers() {
  const search = query.trim().toLocaleLowerCase("ar");
  return users.filter((user) => (roleFilter === "all" || user.role === roleFilter) && (!search || `${user.name} ${user.username}`.toLocaleLowerCase("ar").includes(search)));
}
function renderSummary() {
  const active = users.filter((user) => user.isActive !== false).length;
  const educators = users.filter((user) => ["teacher", "principal", "supervisor"].includes(user.role)).length;
  document.querySelector('[data-stat="total"]').textContent = users.length;
  document.querySelector('[data-stat="active"]').textContent = active;
  document.querySelector('[data-stat="educators"]').textContent = educators;
  const total = Math.max(users.length, 1);
  document.querySelector("[data-role-summary]").innerHTML = Object.entries(roleLabels).map(([role, label]) => {
    const count = users.filter((user) => user.role === role).length;
    return `<div class="admin-role-row"><span class="admin-role-row__label">${escapeHtml(label)}</span><progress class="admin-role-row__progress" max="100" value="${Math.round(count / total * 100)}" aria-label="${escapeHtml(label)}: ${count}"></progress><strong class="admin-role-row__count">${count}</strong></div>`;
  }).join("");
  document.querySelector("[data-recent-users]").innerHTML = users.slice(0, 5).map((user) => `<tr><td><span class="admin-user-cell">${userCell(user)}</span></td><td dir="ltr">${escapeHtml(user.username)}</td><td>${escapeHtml(roleName(user.role))}</td><td><span class="admin-badge ${user.isActive === false ? "admin-badge--inactive" : "admin-badge--active"}">${user.isActive === false ? "موقوف" : "نشط"}</span></td></tr>`).join("") || '<tr><td colspan="4">لا توجد حسابات.</td></tr>';
}
function renderUsers() {
  const items = filteredUsers();
  document.querySelector("[data-user-count]").textContent = `${items.length} من ${users.length}`;
  document.querySelector("[data-users-empty]").hidden = items.length > 0;
  document.querySelector("[data-users-body]").innerHTML = items.map((user) => `<tr><td><span class="admin-user-cell">${userCell(user)}</span></td><td dir="ltr">${escapeHtml(user.username)}</td><td>${escapeHtml(roleName(user.role))}</td><td>${escapeHtml(user.organization || "—")}</td><td><span class="admin-badge ${user.isActive === false ? "admin-badge--inactive" : "admin-badge--active"}">${user.isActive === false ? "موقوف" : "نشط"}</span></td><td><button class="admin-table-action" type="button" data-user-action="toggle" data-user-id="${escapeHtml(user.id)}" aria-label="${user.isActive === false ? "تفعيل" : "إيقاف"} حساب ${escapeHtml(user.name)}">${user.isActive === false ? "تفعيل" : "إيقاف"}</button></td></tr>`).join("");
}
function setView(view) {
  const titles = { overview: ["نظرة عامة", "إدارة مركزية لحسابات المنظومة ومتابعة حالة الربط."], users: ["إدارة المستخدمين", "إدارة الحسابات والأدوار الوظيفية."], system: ["حالة الربط", "إعدادات تشغيل الواجهة والخدمات المرتبطة."] };
  document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== view; });
  document.querySelectorAll(".admin-nav__item[data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  document.querySelector("[data-page-title]").textContent = titles[view][0];
  document.querySelector("[data-page-description]").textContent = titles[view][1];
  if (window.matchMedia("(max-width: 760px)").matches) closeSidebar();
}
function closeSidebar() {
  document.querySelector("#admin-sidebar").classList.remove("is-open");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-expanded", "false");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-label", "فتح القائمة");
  document.querySelector("[data-sidebar-close]").hidden = true;
}
function openSidebar() {
  document.querySelector("#admin-sidebar").classList.add("is-open");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-expanded", "true");
  document.querySelector("[data-sidebar-toggle]").setAttribute("aria-label", "إغلاق القائمة");
  document.querySelector("[data-sidebar-close]").hidden = false;
}
async function refreshUsers() {
  clearError();
  try { users = await adminService.listUsers(); renderSummary(); renderUsers(); }
  catch (error) { showError("تعذر تحميل المستخدمين. تحقق من إعداد خدمة الإدارة ثم أعد المحاولة."); console.error("Admin users load failed", error); }
}

const adminNames = document.querySelectorAll("[data-admin-name]");
adminNames.forEach((element) => { element.textContent = session.name || "آدمن النظام"; });
document.querySelector("[data-current-date]").textContent = new Intl.DateTimeFormat("ar-JO", { dateStyle: "full" }).format(new Date());
const config = window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };
const demoMode = config.demoMode === true && !config.apiBaseUrl;
const apiConfigured = Boolean(config.apiBaseUrl);
document.querySelector("[data-mode-label]").textContent = demoMode ? "وضع تجريبي" : apiConfigured ? "وضع الربط" : "تهيئة مطلوبة";
document.querySelector("[data-api-state]").textContent = apiConfigured ? "عنوان API مضبوط" : demoMode ? "تجريبي" : "غير مضبوط";
document.querySelector("[data-api-heading]").textContent = apiConfigured ? "عنوان خدمة API مضبوط" : demoMode ? "الواجهة تعمل في وضع تجريبي" : "خدمة API غير مهيأة";
document.querySelector("[data-api-description]").textContent = apiConfigured ? "تم ضبط العنوان؛ لم يُجرَ فحص اتصال بالخادم." : demoMode ? "البيانات محلية وغير معتمدة كسجلات رسمية." : "لا يمكن تحميل بيانات الإدارة حتى ضبط عنوان API.";
document.querySelector("[data-system-mode]").textContent = demoMode ? "تجريبي — تخزين محلي" : apiConfigured ? "ربط — الوظائف غير الموصولة معطّلة" : "الإنتاج — الخادم غير مهيأ";
document.querySelector("[data-system-api]").textContent = config.apiBaseUrl || "غير مضبوط";
document.querySelector("[data-system-users]").textContent = apiConfigured ? "API: /api/admin/users" : demoMode ? "سجلات عرض تجريبية" : "غير متاح — يلزم ربط API";

document.addEventListener("click", async (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) return setView(viewButton.dataset.view);
  if (event.target.closest("[data-go-users]")) return setView("users");
  if (event.target.closest("[data-sidebar-toggle]")) return document.querySelector("#admin-sidebar").classList.contains("is-open") ? closeSidebar() : openSidebar();
  if (event.target.closest("[data-sidebar-close]")) return closeSidebar();
  if (event.target.closest("[data-admin-logout]")) { localStorage.removeItem("awn_session"); return; }
  if (event.target.closest("[data-dialog-close]")) return dialog.close();
  if (event.target.closest("[data-add-user]")) {
    clearError(); form.reset(); document.querySelector("[data-form-error]").hidden = true;
    document.querySelector("[data-dialog-notice]").textContent = demoMode ? "في وضع التجربة يُضاف سجل محلي فقط. إنشاء بيانات الدخول الفعلية يتم عبر الخادم." : apiConfigured ? "سيُنشأ الحساب عبر خدمة الإدارة، ويتولى الخادم إصدار بيانات الدخول." : "يلزم ضبط خدمة الإدارة قبل إنشاء الحسابات.";
    dialog.showModal(); form.elements.name.focus(); return;
  }
  const action = event.target.closest('[data-user-action="toggle"]');
  if (action) {
    action.disabled = true;
    try { const user = users.find((item) => item.id === action.dataset.userId); await adminService.setUserStatus(user.id, user.isActive === false); status.textContent = "تم تحديث حالة الحساب."; await refreshUsers(); }
    catch (error) { showError("تعذر تحديث الحساب. لم يتم تأكيد التغيير من الخدمة."); console.error("Admin status update failed", error); }
    finally { action.disabled = false; }
  }
});

document.querySelector("[data-user-search]").addEventListener("input", (event) => { query = event.target.value; renderUsers(); });
document.querySelector("[data-role-filter]").addEventListener("change", (event) => { roleFilter = event.target.value; renderUsers(); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formError = document.querySelector("[data-form-error]"); formError.hidden = true;
  const values = Object.fromEntries(new FormData(form).entries());
  const save = document.querySelector("[data-save-user]"); save.disabled = true;
  try {
    await adminService.createUser(values); dialog.close(); status.textContent = config.demoMode ? "أضيف سجل المستخدم إلى بيانات التجربة." : "أُرسل طلب إنشاء المستخدم إلى خدمة الإدارة."; await refreshUsers();
  } catch (error) {
    formError.textContent = error.message === "ADMIN_USERNAME_EXISTS" ? "اسم الدخول مستخدم بالفعل." : error.message === "ADMIN_USER_VALIDATION_FAILED" ? "تحقق من الاسم واسم الدخول والدور." : "تعذر إنشاء المستخدم. تحقق من خدمة الإدارة.";
    formError.hidden = false;
  } finally { save.disabled = false; }
});
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && document.querySelector("#admin-sidebar").classList.contains("is-open")) closeSidebar(); });
refreshUsers();