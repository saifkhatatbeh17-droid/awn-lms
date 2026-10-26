/**
 * Awn LMS - Assignment Service
 * Standardized with async/await and unified response contract: { success: boolean, data: any, message: string }
 */
(() => {
  const STORAGE_KEY = "awn_assignments";
  const config = () => window.AWN_CONFIG || { apiBaseUrl: "", demoMode: false };


  const response = AwnUtils.response;

  async function apiRequest(path, options = {}) { return AwnHttp.data(path, options); }

  async function readDemoAssignments() { return AwnDemo.collection(STORAGE_KEY, "assignments.json"); }

  function persistDemo(items) {
    AwnDemo.write(STORAGE_KEY, items);
  }

  function createId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  async function list() {
    try {
      AwnRoles.requirePermission("assignments:read");
      if (config().apiBaseUrl) {
        const payload = await apiRequest("/api/assignments");
        const items = Array.isArray(payload) ? payload : (payload?.items || payload?.data || []);
        if (!Array.isArray(items)) throw new Error("ASSIGNMENTS_RESPONSE_INVALID");
        return response(true, items, "تم جلب الواجبات بنجاح");
      }
      if (!config().demoMode) throw new Error("ASSIGNMENTS_API_NOT_CONFIGURED");
      const items = await readDemoAssignments();
      return response(true, items, "تم جلب الواجبات بنجاح");
    } catch (err) {
      console.error("AssignmentService.list error:", err);
      return response(false, [], err.message || "تعذر جلب الواجبات");
    }
  }

  async function create(input = {}) {
    try {
      AwnRoles.requirePermission("assignments:create");
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
        const created = payload?.assignment ?? payload?.data ?? payload;
        return response(true, created, "تم حفظ الواجب بنجاح");
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
          if (window.SchoolService?.addNotification) {
            window.SchoolService.addNotification(role, notificationTitle, message);
          }
        } catch (error) {
          console.warn("Assignment was saved, but a demo notification could not be stored.", error);
        }
      }
      return response(true, assignment, "تم حفظ الواجب بنجاح");
    } catch (err) {
      console.error("AssignmentService.create error:", err);
      return response(false, null, err.message || "تعذر حفظ الواجب");
    }
  }

  async function setStatus(id, status) {
    try {
      AwnRoles.requirePermission("assignments:complete");
      if (!new Set(["pending", "completed"]).has(status)) throw new Error("ASSIGNMENT_STATUS_INVALID");
      if (config().apiBaseUrl) {
        await apiRequest(`/api/assignments/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        return response(true, { id, status }, "تم تحديث حالة الواجب بنجاح");
      }
      if (!config().demoMode) throw new Error("ASSIGNMENTS_API_NOT_CONFIGURED");
      const items = await readDemoAssignments();
      if (!items.some((item) => item.id === id)) throw new Error("ASSIGNMENT_NOT_FOUND");
      persistDemo(items.map((item) => (item.id === id ? { ...item, status } : item)));
      return response(true, { id, status }, "تم تحديث حالة الواجب بنجاح");
    } catch (err) {
      console.error("AssignmentService.setStatus error:", err);
      return response(false, null, err.message || "تعذر تحديث حالة الواجب");
    }
  }

  // API contract: GET/POST /api/assignments and PATCH /api/assignments/{id}/status.
  window.AssignmentService = Object.freeze({ list, create, setStatus });
})();
