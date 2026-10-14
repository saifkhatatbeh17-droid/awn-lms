(() => {
  const SEED_URL = "assets/data/assignments.json";
  const STORAGE_KEY = "awn_assignments";
  const config = () => window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };
  let seedRequest;

  async function apiRequest(path, options = {}) {
    const settings = config();
    if (!settings.apiBaseUrl) throw new Error("ASSIGNMENTS_API_NOT_CONFIGURED");
    const response = await fetch(`${settings.apiBaseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    if (!response.ok) throw new Error(`ASSIGNMENTS_API_${response.status}`);
    if (response.status === 204) return null;
    return response.json();
  }

  async function readDemoAssignments() {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error("ASSIGNMENTS_DATA_INVALID");
      return parsed;
    }
    seedRequest ??= fetch(SEED_URL, { headers: { Accept: "application/json" } }).then((response) => {
      if (!response.ok) throw new Error("ASSIGNMENTS_SEED_UNAVAILABLE");
      return response.json();
    });
    let seed;
    try { seed = await seedRequest; } catch (error) { seedRequest = undefined; throw error; }
    if (!seed || !Array.isArray(seed.items)) throw new Error("ASSIGNMENTS_SEED_INVALID");
    return seed.items;
  }

  function persistDemo(items) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function createId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  async function list() {
    if (config().apiBaseUrl) {
      const payload = await apiRequest("/api/assignments");
      const items = Array.isArray(payload) ? payload : payload?.items;
      if (!Array.isArray(items)) throw new Error("ASSIGNMENTS_RESPONSE_INVALID");
      return items;
    }
    if (!config().demoMode) throw new Error("ASSIGNMENTS_API_NOT_CONFIGURED");
    return readDemoAssignments();
  }

  async function create(input = {}) {
    const title = String(input?.title ?? "").trim();
    const subject = String(input?.subject ?? "").trim();
    const dueDate = String(input?.dueDate ?? "").trim();
    const validDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);
    const parsedDate = validDateFormat ? new Date(dueDate + "T00:00:00.000Z") : null;
    if (
      !title ||
      !subject ||
      !parsedDate ||
      Number.isNaN(parsedDate.valueOf()) ||
      parsedDate.toISOString().slice(0, 10) !== dueDate
    ) {
      throw new Error("ASSIGNMENT_VALIDATION_FAILED");
    }

    const assignmentInput = { title, subject, dueDate };
    if (config().apiBaseUrl) {
      const payload = await apiRequest("/api/assignments", {
        method: "POST",
        body: JSON.stringify(assignmentInput),
      });
      return payload?.assignment ?? payload;
    }
    if (!config().demoMode) throw new Error("ASSIGNMENTS_API_NOT_CONFIGURED");

    const items = await readDemoAssignments();
    const assignment = {
      id: createId(),
      ...assignmentInput,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    persistDemo([assignment, ...items]);

    const notifications = [
      ["student", "واجب جديد: " + assignment.title, "مادة " + assignment.subject + ". التسليم: " + assignment.dueDate],
      ["parent", "واجب جديد لابنك", "مادة " + assignment.subject + ". التسليم: " + assignment.dueDate],
    ];
    for (const [role, notificationTitle, message] of notifications) {
      try {
        ApiService.addNotification(role, notificationTitle, message);
      } catch (error) {
        console.warn("Assignment was saved, but a demo notification could not be stored.", error);
      }
    }
    return assignment;
  }

  async function setStatus(id, status) {
    if (!new Set(["pending", "completed"]).has(status)) throw new Error("ASSIGNMENT_STATUS_INVALID");
    if (config().apiBaseUrl) {
      await apiRequest(`/api/assignments/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      return;
    }
    if (!config().demoMode) throw new Error("ASSIGNMENTS_API_NOT_CONFIGURED");
    const items = await readDemoAssignments();
    if (!items.some((item) => item.id === id)) throw new Error("ASSIGNMENT_NOT_FOUND");
    persistDemo(items.map((item) => item.id === id ? { ...item, status } : item));
  }

  // API contract: GET/POST /api/assignments and PATCH /api/assignments/{id}/status.
  window.AssignmentService = Object.freeze({ list, create, setStatus });
})();