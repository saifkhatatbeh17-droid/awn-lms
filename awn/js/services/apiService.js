const ApiService = (() => {
  const KEYS = {
    assignments: "awn_assignments",
    notifications: "awn_notifications",
    behavior: "awn_behavior",
    attendance: "awn_attendance",
    feedback: "awn_feedback",
    about: "awn_about",
    daily: "awn_daily_plan",
    quarterly: "awn_quarterly_plan",
  };

  function demoModeEnabled() {
    return window.AWN_CONFIG?.demoMode === true && !window.AWN_CONFIG?.apiBaseUrl;
  }

  function assertDemoMode() {
    if (!demoModeEnabled()) throw new Error("DEMO_STORAGE_DISABLED");
  }

  // Reads an array collection; returns [] if missing or corrupt.
  function read(key) {
    if (!demoModeEnabled()) return [];
    try {
      const value = JSON.parse(localStorage.getItem(key)) || [];
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  // Writes a whole array back to localStorage.
  function write(key, data) {
    assertDemoMode();
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Creates a unique id from the timestamp and a random suffix.
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Notifications ----------
  function addNotification(toRole, title, message) {
    const list = read(KEYS.notifications);
    list.push({
      id: uid(),
      toRole,
      title,
      message,
      date: new Date().toISOString(),
    });
    write(KEYS.notifications, list);
  }

  function getNotifications(role) {
    return read(KEYS.notifications)
      .filter((item) => item && typeof item === "object" && item.toRole === role)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }

  // ---------- Behavior ----------
  function addBehavior(student, points, note) {
    const list = read(KEYS.behavior);
    const normalizedPoints = Number(points) || 0;
    const normalizedNote = String(note || "");
    list.push({
      id: uid(),
      student,
      points: normalizedPoints,
      note: normalizedNote,
      date: new Date().toISOString(),
    });
    write(KEYS.behavior, list);

    const kind = normalizedPoints > 0 ? "نقطة إيجابية" : "ملاحظة سلبية";
    const notifications = [
      ["parent", "تحديث سلوك: " + student, kind + " بمقدار " + normalizedPoints + ". السبب: " + normalizedNote],
      ["student", "تحديث سلوك", kind + " بمقدار " + normalizedPoints + ". السبب: " + normalizedNote],
    ];
    for (const [role, title, message] of notifications) {
      try {
        addNotification(role, title, message);
      } catch (error) {
        console.warn("Behavior was saved, but a demo notification could not be stored.", error);
      }
    }
  }

  // ---------- Attendance (one record per date; re-saving replaces it) ----------
  function saveAttendance(date, records) {
    assertDemoMode();
    if (typeof date !== "string" || !Array.isArray(records)) {
      throw new Error("ATTENDANCE_DATA_INVALID");
    }
    const validStatuses = new Set(["present", "absent", "late"]);
    if (!records.every((record) =>
      record &&
      typeof record.name === "string" &&
      validStatuses.has(record.status)
    )) {
      throw new Error("ATTENDANCE_RECORD_INVALID");
    }

    const all = read(KEYS.attendance);
    const previous = all.find((record) => record && record.date === date);
    const previouslyAbsent = new Set(
      Array.isArray(previous?.records)
        ? previous.records
            .filter((record) => record?.status === "absent")
            .map((record) => record.name)
        : [],
    );
    const updated = all.filter((record) => record && record.date !== date);
    updated.push({ id: uid(), date, records });
    write(KEYS.attendance, updated);

    for (const record of records) {
      if (record.status !== "absent" || previouslyAbsent.has(record.name)) continue;
      try {
        addNotification(
          "parent",
          "تسجيل غياب",
          "تم تسجيل غياب " + record.name + " بتاريخ " + date + ".",
        );
      } catch (error) {
        console.warn("Attendance was saved, but a demo notification could not be stored.", error);
      }
    }
  }

  function getAttendance(date) {
    const record = read(KEYS.attendance).find((item) => item && item.date === date);
    if (!record || !Array.isArray(record.records)) return null;
    return {
      ...record,
      records: record.records.filter((item) => item && typeof item === "object"),
    };
  }

  // ---------- Feedback ----------
  function addFeedback(author, category, subject, message) {
    const list = read(KEYS.feedback);
    const item = {
      id: uid(),
      author,
      category,
      subject,
      message,
      status: "open",
      reply: "",
      date: new Date().toISOString(),
    };
    list.unshift(item);
    write(KEYS.feedback, list);
    return item;
  }

  function getFeedback() {
    return read(KEYS.feedback).filter((item) => item && typeof item === "object");
  }

  function updateFeedback(id, changes) {
    const allowedChanges = {};
    if (typeof changes?.reply === "string") allowedChanges.reply = changes.reply;
    if (changes?.status === "open" || changes?.status === "closed") allowedChanges.status = changes.status;
    const list = read(KEYS.feedback);
    const item = list.find((feedback) => feedback && feedback.id === id);
    if (!item) return false;
    Object.assign(item, allowedChanges);
    write(KEYS.feedback, list);
    return true;
  }

  function deleteFeedback(id) {
    write(
      KEYS.feedback,
      read(KEYS.feedback).filter((item) => item && item.id !== id),
    );
  }

  // ---------- About (single editable record) ----------
  function getAbout() {
    if (!demoModeEnabled()) return null;
    try {
      const value = JSON.parse(localStorage.getItem(KEYS.about));
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  function saveAbout(data) {
    assertDemoMode();
    localStorage.setItem(
      KEYS.about,
      JSON.stringify({ ...data, updated: new Date().toISOString() }),
    );
  }

  // ---------- Daily plan (one draft per teacher browser) ----------
  function saveDailyPlan(plan) {
    assertDemoMode();
    localStorage.setItem(KEYS.daily, JSON.stringify(plan));
  }

  function getDailyPlan() {
    if (!demoModeEnabled()) return null;
    try {
      const value = JSON.parse(localStorage.getItem(KEYS.daily));
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  // ---------- Quarterly plan (one draft per teacher browser) ----------
  function saveQuarterlyPlan(plan) {
    assertDemoMode();
    localStorage.setItem(KEYS.quarterly, JSON.stringify(plan));
  }

  function getQuarterlyPlan() {
    if (!demoModeEnabled()) return null;
    try {
      const value = JSON.parse(localStorage.getItem(KEYS.quarterly));
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  
  function getAllAttendance() {
    return read(KEYS.attendance).filter((item) => item && typeof item === "object");
  }

  function getAllBehavior() {
    return read(KEYS.behavior).filter((item) => item && typeof item === "object");
  }

  return {
    addNotification,
    getNotifications,
    addBehavior,
    saveAttendance,
    getAttendance,
    getAllAttendance,
    getAllBehavior,
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
    clearAll() {
      assertDemoMode();
      Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    },
  };
})();