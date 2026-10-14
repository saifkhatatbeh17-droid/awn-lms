const DEMO_USERS_URL = "assets/data/users.json";
const STORAGE_KEY = "awn_admin_users";
const ROLE_LABELS = Object.freeze({ admin: "آدمن النظام", principal: "مدير مدرسة", supervisor: "مشرف تربوي", teacher: "معلم", student: "طالب", parent: "ولي أمر" });
const config = () => window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };
let seedRequest;

async function request(path, options = {}) {
  const response = await fetch(`${config().apiBaseUrl}${path}`, {
    ...options, credentials: "include",
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  if (!response.ok) throw new Error(`ADMIN_API_${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}
async function readDemoUsers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    const users = JSON.parse(saved);
    if (!Array.isArray(users)) throw new Error("ADMIN_USERS_INVALID");
    return users;
  }
  seedRequest ??= fetch(DEMO_USERS_URL, { headers: { Accept: "application/json" } }).then((response) => {
    if (!response.ok) throw new Error("ADMIN_SEED_UNAVAILABLE");
    return response.json();
  });
  let raw;
  try { raw = await seedRequest; } catch (error) { seedRequest = undefined; throw error; }
  if (!Array.isArray(raw)) throw new Error("ADMIN_SEED_INVALID");
  return raw.map((item, index) => ({ id: `demo-${index + 1}`, username: item.username, name: item.name, role: item.role, organization: item.organization || "وزارة التربية والتعليم", isActive: true }));
}
function saveDemoUsers(users) {
  if (!config().demoMode) throw new Error("ADMIN_DEMO_DISABLED");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}
async function listUsers() {
  const settings = config();
  if (settings.apiBaseUrl) {
    const payload = await request("/api/admin/users");
    const users = Array.isArray(payload) ? payload : payload?.items;
    if (!Array.isArray(users)) throw new Error("ADMIN_RESPONSE_INVALID");
    return users;
  }
  if (!settings.demoMode) throw new Error("ADMIN_API_NOT_CONFIGURED");
  return readDemoUsers();
}
async function createUser(input) {
  const user = { name: String(input.name || "").trim(), username: String(input.username || "").trim(), role: input.role, organization: String(input.organization || "").trim() };
  if (user.name.length < 2 || user.username.length < 3 || !ROLE_LABELS[user.role]) throw new Error("ADMIN_USER_VALIDATION_FAILED");
  if (config().apiBaseUrl) {
    const payload = await request("/api/admin/users", { method: "POST", body: JSON.stringify(user) });
    return payload?.user ?? payload;
  }
  if (!config().demoMode) throw new Error("ADMIN_API_NOT_CONFIGURED");
  const users = await readDemoUsers();
  if (users.some((item) => item.username.toLowerCase() === user.username.toLowerCase())) throw new Error("ADMIN_USERNAME_EXISTS");
  const created = { id: `demo-${Date.now().toString(36)}`, ...user, organization: user.organization || "غير محدد", isActive: true };
  saveDemoUsers([created, ...users]);
  return created;
}
async function setUserStatus(id, isActive) {
  if (config().apiBaseUrl) {
    await request(`/api/admin/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ isActive: Boolean(isActive) }) });
    return;
  }
  if (!config().demoMode) throw new Error("ADMIN_API_NOT_CONFIGURED");
  const users = await readDemoUsers();
  if (!users.some((user) => user.id === id)) throw new Error("ADMIN_USER_NOT_FOUND");
  saveDemoUsers(users.map((user) => user.id === id ? { ...user, isActive: Boolean(isActive) } : user));
}
window.AdminService = Object.freeze({ listUsers, createUser, setUserStatus, roleLabels: ROLE_LABELS });