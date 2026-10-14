const DEMO_USERS_URL = "assets/data/users.json";
const DASHBOARDS_BY_ROLE = Object.freeze({
  admin: "admin-dashboard.html",
  teacher: "teacher-dashboard.html",
  principal: "principal-dashboard.html",
  supervisor: "supervisor-dashboard.html",
  student: "student-dashboard.html",
  parent: "parent-dashboard.html",
});

/** API adapter. The host supplies POST /api/auth/login and an HttpOnly session cookie. */
export async function authenticate(username, password, { signal } = {}) {
  const config = window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };
  let user;

  if (config.apiBaseUrl) {
    const response = await fetch(`${config.apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
      signal,
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("AUTH_SERVICE_UNAVAILABLE");
    const payload = await response.json();
    user = payload.user ?? payload;
  } else if (config.demoMode) {
    const response = await fetch(DEMO_USERS_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!response.ok) throw new Error("AUTH_SERVICE_UNAVAILABLE");
    const users = await response.json();
    if (!Array.isArray(users)) throw new Error("AUTH_DATA_INVALID");
    user = users.find((entry) => entry.username === username && entry.password === password);
    if (!user) return null;
  } else {
    throw new Error("AUTH_API_NOT_CONFIGURED");
  }

  const role = user?.role;
  const redirect = DASHBOARDS_BY_ROLE[role];
  if (!user?.username || !redirect) throw new Error("AUTH_RESPONSE_INVALID");
  return { username: user.username, name: user.name || "", role, redirect };
}