/**
 * Awn LMS - Admin Service
 * Standardized with async/await and unified response contract: { success: boolean, data: any, message: string }
 */

const STORAGE_KEY = "awn_admin_users";
const MAIN_USERS_KEY = "awn_users";
const AUDIT_STORAGE_KEY = "awn_admin_audit";
const AUDIT_LIMIT = 300;
const ROLE_LABELS = Object.freeze(Object.fromEntries(Object.entries(AwnRoles.definitions).map(([key, role]) => [key, role.label])));

const config = () => window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };


const response = AwnUtils.response;

async function request(path, options = {}) { return AwnHttp.data(path, options); }

function readLocalArray(key) {
  const saved = localStorage.getItem(key);
  if (saved === null) return null;
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("ADMIN_LOCAL_DATA_INVALID");
    return parsed;
  } catch {
    return null;
  }
}

async function readDemoUsers() {
  const saved = readLocalArray(STORAGE_KEY);
  if (saved !== null) return saved;

  const raw = await AwnDemo.collection(MAIN_USERS_KEY, "users.json");

  const formatted = raw.map((item, index) => ({
    id: "demo-" + (index + 1),
    username: item.username,
    name: item.name,
    role: item.role,
    organization: item.organization || "مدرستك",
    isActive: true,
  }));

  saveDemoUsers(formatted);
  return formatted;
}

function saveDemoUsers(users) {
  if (!config().demoMode || config().apiBaseUrl) throw new Error("ADMIN_DEMO_DISABLED");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

  // Sync back to main awn_users for login compatibility
  try {
    const mainUsers = (readLocalArray(MAIN_USERS_KEY) || []).slice();
    users.forEach((adminUser) => {
      const existing = mainUsers.find(
        (u) => String(u.username).trim().toLowerCase() === String(adminUser.username).trim().toLowerCase()
      );
      if (existing) {
        existing.name = adminUser.name;
        existing.role = adminUser.role;
        existing.organization = adminUser.organization;
        existing.isActive = adminUser.isActive;
      } else {
        mainUsers.push({
          username: adminUser.username,
          password: "123",
          role: adminUser.role,
          name: adminUser.name,
          organization: adminUser.organization,
          isActive: adminUser.isActive,
        });
      }
    });
    localStorage.setItem(MAIN_USERS_KEY, JSON.stringify(mainUsers));
  } catch (err) {
    console.warn("Could not sync users to awn_users", err);
  }
}

function readAuditEvents() {
  try {
    return readLocalArray(AUDIT_STORAGE_KEY) || [];
  } catch (error) {
    console.warn("The local activity log could not be read.", error);
    return [];
  }
}

function recordDemoAudit(action, user, detail) {
  if (!config().demoMode || config().apiBaseUrl) return false;
  try {
    const session = (AwnSession.current() || {});
    const entries = readAuditEvents();
    entries.unshift({
      id: "event-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      action,
      actor: session.name || session.username || "آدمن النظام",
      actorUsername: session.username || "",
      targetId: String(user.id || ""),
      targetName: String(user.name || ""),
      targetUsername: String(user.username || ""),
      detail: detail || "",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(entries.slice(0, AUDIT_LIMIT)));
    return true;
  } catch (error) {
    console.warn("The account change was saved, but its local activity entry could not be stored.", error);
    return false;
  }
}

async function listUsers() {
  try {
    AwnRoles.requirePermission("users:read");
    const settings = config();
    if (settings.apiBaseUrl) {
      const payload = await request("/api/admin/users");
      const users = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
      if (!Array.isArray(users)) throw new Error("ADMIN_RESPONSE_INVALID");
      return response(true, users, "تم جلب المستخدمين بنجاح");
    }
    if (!settings.demoMode) throw new Error("ADMIN_API_NOT_CONFIGURED");
    const users = await readDemoUsers();
    return response(true, users, "تم جلب المستخدمين بنجاح");
  } catch (err) {
    console.error("AdminService.listUsers error:", err);
    return response(false, [], err.message || "تعذر جلب المستخدمين");
  }
}

function normalizeUser(input) {
  const user = {
    name: String(input.name || "").trim(),
    username: String(input.username || "").trim(),
    role: String(input.role || ""),
    organization: String(input.organization || "").trim(),
  };
  if (
    user.name.length < 2 ||
    user.username.length < 3 ||
    user.username.length > 50 ||
    !ROLE_LABELS[user.role] ||
    user.organization.length < 2
  ) {
    throw new Error("ADMIN_USER_VALIDATION_FAILED");
  }
  return user;
}

function assertUniqueUsername(users, username, exceptId) {
  const normalized = username.toLocaleLowerCase("ar");
  if (
    users.some(
      (item) => item.id !== exceptId && String(item.username || "").trim().toLocaleLowerCase("ar") === normalized
    )
  ) {
    throw new Error("ADMIN_USERNAME_EXISTS");
  }
}

async function createUser(input) {
  try {
    AwnRoles.requirePermission("users:write");
    const user = normalizeUser(input);
    if (config().apiBaseUrl) {
      const payload = await request("/api/admin/users", { method: "POST", body: JSON.stringify(user) });
      const created = payload?.user ?? payload?.data ?? payload;
      return response(true, created, "تم إنشاء الحساب بنجاح");
    }
    if (!config().demoMode) throw new Error("ADMIN_API_NOT_CONFIGURED");
    const users = await readDemoUsers();
    assertUniqueUsername(users, user.username);
    const created = { id: "demo-" + Date.now().toString(36), ...user, isActive: true };
    saveDemoUsers([created, ...users]);
    recordDemoAudit("create", created, "إضافة حساب جديد");
    return response(true, created, "تم إنشاء الحساب بنجاح");
  } catch (err) {
    console.error("AdminService.createUser error:", err);
    return response(false, null, err.message || "تعذر إنشاء الحساب");
  }
}

async function updateUser(id, input) {
  try {
    AwnRoles.requirePermission("users:write");
    const user = normalizeUser(input);
    if (config().apiBaseUrl) {
      const payload = await request("/api/admin/users/" + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify(user),
      });
      const updated = payload?.user ?? payload?.data ?? payload;
      return response(true, updated, "تم تعديل الحساب بنجاح");
    }
    if (!config().demoMode) throw new Error("ADMIN_API_NOT_CONFIGURED");
    const users = await readDemoUsers();
    const existing = users.find((item) => item.id === id);
    if (!existing) throw new Error("ADMIN_USER_NOT_FOUND");
    assertUniqueUsername(users, user.username, id);
    const updated = { ...existing, ...user };
    saveDemoUsers(users.map((item) => (item.id === id ? updated : item)));
    recordDemoAudit("update", updated, "تعديل بيانات الحساب");
    return response(true, updated, "تم تعديل الحساب بنجاح");
  } catch (err) {
    console.error("AdminService.updateUser error:", err);
    return response(false, null, err.message || "تعذر تعديل الحساب");
  }
}

async function setUserStatus(id, isActive) {
  try {
    AwnRoles.requirePermission("users:write");
    const nextIsActive = Boolean(isActive);
    if (config().apiBaseUrl) {
      await request("/api/admin/users/" + encodeURIComponent(id) + "/status", {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextIsActive }),
      });
      return response(true, { id, isActive: nextIsActive }, "تم تحديث حالة الحساب");
    }
    if (!config().demoMode) throw new Error("ADMIN_API_NOT_CONFIGURED");
    const users = await readDemoUsers();
    const existing = users.find((user) => user.id === id);
    if (!existing) throw new Error("ADMIN_USER_NOT_FOUND");
    const updated = { ...existing, isActive: nextIsActive };
    saveDemoUsers(users.map((user) => (user.id === id ? updated : user)));
    recordDemoAudit(nextIsActive ? "activate" : "deactivate", updated, nextIsActive ? "تفعيل الحساب" : "إيقاف الحساب");
    return response(true, updated, nextIsActive ? "تم تفعيل الحساب" : "تم إيقاف الحساب");
  } catch (err) {
    console.error("AdminService.setUserStatus error:", err);
    return response(false, null, err.message || "تعذر تحديث حالة الحساب");
  }
}

async function listAuditEvents() {
  if (!AwnRoles.can("audit:read")) return response(false, [], "FORBIDDEN");
  if (config().apiBaseUrl) {
    try { return response(true, await request("/api/admin/audit"), "تم جلب سجل النشاط"); }
    catch (error) { return response(false, [], error.message); }
  }
  if (!config().demoMode) return response(false, [], "ADMIN_API_NOT_CONFIGURED");
  const events = readAuditEvents().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return response(true, events, "تم جلب سجل النشاط");
}

window.AdminService = Object.freeze({
  listUsers,
  createUser,
  updateUser,
  setUserStatus,
  listAuditEvents,
  roleLabels: ROLE_LABELS,
});
