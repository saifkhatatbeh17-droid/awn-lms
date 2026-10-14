/**
 * Awn LMS - Unified API Service
 * Standardized with async/await and unified response contract: { success: boolean, data: any, message: string }
 * Backed by localStorage state persistence and initial data seeding from JSON files.
 */
const ApiService = (() => {
  const KEYS = {
    users: "awn_users",
    assignments: "awn_assignments",
    notifications: "awn_notifications",
    behavior: "awn_behavior",
    attendance: "awn_attendance",
    feedback: "awn_feedback",
    about: "awn_about",
    daily: "awn_daily_plan",
    quarterly: "awn_quarterly_plan",
  };

  function response(success, data = null, message = "") {
    return { success, data, message };
  }

  function demoModeEnabled() {
    return window.AWN_CONFIG?.demoMode === true && !window.AWN_CONFIG?.apiBaseUrl;
  }

  function assertDemoMode() {
    if (!demoModeEnabled()) throw new Error("DEMO_STORAGE_DISABLED");
  }

  // Reads an array collection from localStorage
  function read(key) {
    if (!demoModeEnabled()) return [];
    try {
      const value = JSON.parse(localStorage.getItem(key)) || [];
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  // Writes an array back to localStorage
  function write(key, data) {
    assertDemoMode();
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Creates a unique id
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /**
   * Seed initial data into localStorage from JSON files if not present
   */
  async function seedInitialData() {
    if (!demoModeEnabled()) return;

    // Seed users if empty
    if (!localStorage.getItem(KEYS.users)) {
      try {
        const usersUrl = window.AWN_CONFIG?.getDataUrl ? window.AWN_CONFIG.getDataUrl("users.json") : "assets/data/users.json";
        const res = await fetch(usersUrl, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const users = await res.json();
          if (Array.isArray(users)) {
            localStorage.setItem(KEYS.users, JSON.stringify(users));
          }
        }
      } catch (err) {
        console.warn("Could not seed users data from JSON", err);
      }
    }

    // Seed assignments if empty
    if (!localStorage.getItem(KEYS.assignments)) {
      try {
        const assignmentsUrl = window.AWN_CONFIG?.getDataUrl ? window.AWN_CONFIG.getDataUrl("assignments.json") : "assets/data/assignments.json";
        const res = await fetch(assignmentsUrl, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data?.items || []);
          localStorage.setItem(KEYS.assignments, JSON.stringify(items));
        }
      } catch (err) {
        console.warn("Could not seed assignments data from JSON", err);
      }
    }
  }

  // Auto-seed on initialization
  seedInitialData();

  // ---------- Notifications ----------
  async function addNotification(toRole, title, message) {
    try {
      const list = read(KEYS.notifications);
      const item = {
        id: uid(),
        toRole,
        title: String(title || "").trim(),
        message: String(message || "").trim(),
        date: new Date().toISOString(),
      };
      list.push(item);
      write(KEYS.notifications, list);
      return response(true, item, "تمت إضافة الإشعار بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر حفظ الإشعار");
    }
  }

  async function getNotifications(role) {
    try {
      const items = read(KEYS.notifications)
        .filter((item) => item && typeof item === "object" && item.toRole === role)
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      return response(true, items, "تم جلب الإشعارات بنجاح");
    } catch (err) {
      return response(false, [], err.message || "تعذر جلب الإشعارات");
    }
  }

  // ---------- Behavior ----------
  async function addBehavior(student, points, note) {
    try {
      const list = read(KEYS.behavior);
      const normalizedPoints = Number(points) || 0;
      const normalizedNote = String(note || "").trim();
      const item = {
        id: uid(),
        student: String(student || "").trim(),
        points: normalizedPoints,
        note: normalizedNote,
        date: new Date().toISOString(),
      };
      list.push(item);
      write(KEYS.behavior, list);

      const kind = normalizedPoints > 0 ? "نقطة إيجابية" : "ملاحظة سلوكية";
      const notifications = [
        ["parent", "تحديث سلوك: " + item.student, kind + " بمقدار " + normalizedPoints + ". السبب: " + normalizedNote],
        ["student", "تحديث سلوك", kind + " بمقدار " + normalizedPoints + ". السبب: " + normalizedNote],
      ];
      for (const [role, title, msg] of notifications) {
        try {
          await addNotification(role, title, msg);
        } catch {
          // ignore notification failure
        }
      }
      return response(true, item, "تم تسجيل السلوك بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر تسجيل السلوك");
    }
  }

  async function getAllBehavior() {
    try {
      const items = read(KEYS.behavior).filter((item) => item && typeof item === "object");
      return response(true, items, "تم جلب سجلات السلوك");
    } catch (err) {
      return response(false, [], err.message || "تعذر جلب سجلات السلوك");
    }
  }

  // ---------- Attendance ----------
  async function saveAttendance(date, records, scope = {}) {
    try {
      assertDemoMode();
      if (typeof date !== "string" || !Array.isArray(records)) {
        throw new Error("ATTENDANCE_DATA_INVALID");
      }
      const validStatuses = new Set(["present", "absent", "late"]);
      if (!records.every((record) => record && typeof record.name === "string" && validStatuses.has(record.status))) {
        throw new Error("ATTENDANCE_RECORD_INVALID");
      }

      const className = String(scope.className || "");
      const period = String(scope.period || "");
      const sameScope = (record) => record && record.date === date &&
        String(record.className || "") === className && String(record.period || "") === period;
      const all = read(KEYS.attendance);
      const previous = all.find(sameScope);
      const previouslyAbsent = new Set(
        Array.isArray(previous?.records)
          ? previous.records.filter((r) => r?.status === "absent").map((r) => r.name)
          : []
      );
      const updated = all.filter((record) => !sameScope(record));
      const newEntry = { id: uid(), date, className, period, records };
      updated.push(newEntry);
      write(KEYS.attendance, updated);

      for (const record of records) {
        if (record.status !== "absent" || previouslyAbsent.has(record.name)) continue;
        try {
          await addNotification("parent", "تسجيل غياب", "تم تسجيل غياب " + record.name + " بتاريخ " + date + ".");
        } catch {
          // ignore notification error
        }
      }
      return response(true, newEntry, "تم حفظ سجل الحضور بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر حفظ سجل الحضور");
    }
  }

  async function getAttendance(date, scope = {}) {
    try {
      const className = String(scope.className || "");
      const period = String(scope.period || "");
      const record = read(KEYS.attendance).find((item) =>
        item && item.date === date && String(item.className || "") === className && String(item.period || "") === period
      );
      if (!record || !Array.isArray(record.records)) {
        return response(true, null, "لا يوجد سجل لهذا التاريخ");
      }
      return response(true, {
        ...record,
        records: record.records.filter((item) => item && typeof item === "object"),
      }, "تم جلب سجل الحضور بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر جلب سجل الحضور");
    }
  }

  async function getAllAttendance() {
    try {
      const items = read(KEYS.attendance).filter((item) => item && typeof item === "object");
      return response(true, items, "تم جلب جميع سجلات الحضور");
    } catch (err) {
      return response(false, [], err.message || "تعذر جلب سجلات الحضور");
    }
  }

  // ---------- Feedback ----------
  async function addFeedback(author, category, subject, message) {
    try {
      const list = read(KEYS.feedback);
      const item = {
        id: uid(),
        author: String(author || "").trim(),
        category: String(category || "employee").trim(),
        subject: String(subject || "").trim(),
        message: String(message || "").trim(),
        status: "open",
        reply: "",
        date: new Date().toISOString(),
      };
      list.unshift(item);
      write(KEYS.feedback, list);
      return response(true, item, "تم إرسال الملاحظة بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر حفظ الملاحظة");
    }
  }

  async function getFeedback() {
    try {
      const items = read(KEYS.feedback).filter((item) => item && typeof item === "object");
      return response(true, items, "تم جلب قائمة الملاحظات");
    } catch (err) {
      return response(false, [], err.message || "تعذر جلب الملاحظات");
    }
  }

  async function updateFeedback(id, changes) {
    try {
      const allowedChanges = {};
      if (typeof changes?.reply === "string") allowedChanges.reply = changes.reply;
      if (changes?.status === "open" || changes?.status === "closed") allowedChanges.status = changes.status;
      const list = read(KEYS.feedback);
      const item = list.find((feedback) => feedback && feedback.id === id);
      if (!item) return response(false, null, "الملاحظة غير موجودة");
      Object.assign(item, allowedChanges);
      write(KEYS.feedback, list);
      return response(true, item, "تم تحديث الملاحظة بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر تحديث الملاحظة");
    }
  }

  async function deleteFeedback(id) {
    try {
      write(KEYS.feedback, read(KEYS.feedback).filter((item) => item && item.id !== id));
      return response(true, { id }, "تم حذف الملاحظة بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر حذف الملاحظة");
    }
  }

  // ---------- About ----------
  async function getAbout() {
    if (!demoModeEnabled()) return response(false, null, "DEMO_MODE_DISABLED");
    try {
      const value = JSON.parse(localStorage.getItem(KEYS.about));
      const data = value && typeof value === "object" && !Array.isArray(value) ? value : null;
      return response(true, data, "تم جلب بيانات المؤسسة");
    } catch (err) {
      return response(false, null, err.message || "تعذر جلب بيانات المؤسسة");
    }
  }

  async function saveAbout(data) {
    try {
      assertDemoMode();
      const saved = { ...data, updated: new Date().toISOString() };
      localStorage.setItem(KEYS.about, JSON.stringify(saved));
      return response(true, saved, "تم حفظ بيانات المؤسسة بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر حفظ بيانات المؤسسة");
    }
  }

  // ---------- Daily Plan ----------
  async function saveDailyPlan(plan) {
    try {
      assertDemoMode();
      localStorage.setItem(KEYS.daily, JSON.stringify(plan));
      return response(true, plan, "تم حفظ الخطة اليومية بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر حفظ الخطة اليومية");
    }
  }

  async function getDailyPlan() {
    if (!demoModeEnabled()) return response(false, null, "DEMO_MODE_DISABLED");
    try {
      const value = JSON.parse(localStorage.getItem(KEYS.daily));
      const data = value && typeof value === "object" && !Array.isArray(value) ? value : null;
      return response(true, data, "تم جلب الخطة اليومية");
    } catch (err) {
      return response(false, null, err.message || "تعذر جلب الخطة اليومية");
    }
  }

  // ---------- Quarterly Plan ----------
  async function saveQuarterlyPlan(plan) {
    try {
      assertDemoMode();
      localStorage.setItem(KEYS.quarterly, JSON.stringify(plan));
      return response(true, plan, "تم حفظ الخطة الفصلية بنجاح");
    } catch (err) {
      return response(false, null, err.message || "تعذر حفظ الخطة الفصلية");
    }
  }

  async function getQuarterlyPlan() {
    if (!demoModeEnabled()) return response(false, null, "DEMO_MODE_DISABLED");
    try {
      const value = JSON.parse(localStorage.getItem(KEYS.quarterly));
      const data = value && typeof value === "object" ? value : null;
      return response(true, data, "تم جلب الخطة الفصلية");
    } catch (err) {
      return response(false, null, err.message || "تعذر جلب الخطة الفصلية");
    }
  }

  async function clearAll() {
    try {
      assertDemoMode();
      Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
      return response(true, null, "تم مسح جميع البيانات المخزنة");
    } catch (err) {
      return response(false, null, err.message || "تعذر مسح البيانات");
    }
  }

  return {
    seedInitialData,
    addNotification,
    getNotifications,
    addBehavior,
    getAllBehavior,
    saveAttendance,
    getAttendance,
    getAllAttendance,
    addFeedback,
    getFeedback,
    updateFeedback,
    deleteFeedback,
    getAbout,
    saveAbout,
    saveDailyPlan,
    getDailyPlan,
    saveQuarterlyPlan,
    getQuarterlyPlan,
    clearAll,
  };
})();