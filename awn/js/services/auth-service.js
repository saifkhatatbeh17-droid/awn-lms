const DEMO_USERS_URL = "assets/data/users.json";
export const DASHBOARDS_BY_ROLE = Object.freeze({
  admin: "admin-dashboard.html",
  teacher: "teacher-dashboard.html",
  principal: "principal-dashboard.html",
  supervisor: "supervisor-dashboard.html",
  student: "student-dashboard.html",
  parent: "parent-dashboard.html",
});

function response(success, data = null, message = "") {
  return { success, data, message };
}

/**
 * Read demo users from localStorage (seeded from users.json)
 */
async function getDemoUsers(signal) {
  const stored = localStorage.getItem("awn_users");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback to fetch
    }
  }

  const usersUrl = window.AWN_CONFIG?.getDataUrl
    ? window.AWN_CONFIG.getDataUrl("users.json")
    : DEMO_USERS_URL;

  const res = await fetch(usersUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error("AUTH_SERVICE_UNAVAILABLE");
  const users = await res.json();
  if (!Array.isArray(users)) throw new Error("AUTH_DATA_INVALID");

  // Seed into localStorage
  try {
    localStorage.setItem("awn_users", JSON.stringify(users));
  } catch {
    // ignore quota errors
  }
  return users;
}

/**
 * Standardized authentication method returning { success, data, message }
 */
export async function authenticate(username, password, { signal } = {}) {
  const config = window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };
  let rawUser = null;

  try {
    if (config.apiBaseUrl) {
      const apiRes = await fetch(`${config.apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
        signal,
      });
      if (apiRes.status === 401) {
        return response(false, null, "بيانات الدخول غير صحيحة");
      }
      if (!apiRes.ok) throw new Error("AUTH_SERVICE_UNAVAILABLE");
      const payload = await apiRes.json();
      rawUser = payload.user ?? payload.data ?? payload;
    } else if (config.demoMode) {
      const users = await getDemoUsers(signal);
      rawUser = users.find(
        (entry) =>
          String(entry.username || "").trim().toLowerCase() === String(username || "").trim().toLowerCase() &&
          String(entry.password) === String(password)
      );
      if (!rawUser) {
        return response(false, null, "بيانات الدخول غير صحيحة");
      }
    } else {
      return response(false, null, "AUTH_API_NOT_CONFIGURED");
    }

    const role = rawUser?.role;
    const redirect = DASHBOARDS_BY_ROLE[role];
    if (!rawUser?.username || !redirect) {
      return response(false, null, "AUTH_RESPONSE_INVALID");
    }

    // Sanitize session user: strip out password
    const safeData = {
      username: rawUser.username,
      name: rawUser.name || "",
      role: rawUser.role,
      redirect,
    };

    return response(true, safeData, "تم تسجيل الدخول بنجاح");
  } catch (error) {
    console.error("Authentication error:", error);
    return response(false, null, error.message || "تعذر الاتصال بخدمة الدخول");
  }
}