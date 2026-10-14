// Each listener is attached once to document, so buttons created later still work.

document.addEventListener("click", (e) => {
  const t = e.target;

  // Sidebar navigation (every role)
  const link = t.closest("[data-path]");
  if (link) {
    e.preventDefault();
    return navigateTo(link.getAttribute("data-path"));
  }

  // Administrative mock actions (Principal/Supervisor)
  const text = t.textContent.trim();
  if (
    text === "اعتماد" ||
    text === "مراجعة" ||
    text.includes("إضافة زيارة") ||
    text.includes("تعميم داخلي")
  ) {
    Swal.fire({
      icon: "info",
      title: "وظيفة تجريبية",
      text: "هذا الإجراء غير مرتبط بخادم ولا يتم تسجيله فعليًا حتى الآن.",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  // Feedback: reply or delete
  const action = t.closest("[data-action]");
  if (action) {
    if (!requireDemoMode()) return;
    const id = action.closest("[data-feedback-id]")?.dataset.feedbackId;
    if (!id) return;
    if (action.dataset.action === "delete-feedback") {
      return Swal.fire({
        title: "حذف هذه الملاحظة؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "حذف",
        cancelButtonText: "إلغاء",
      }).then((r) => {
        if (r.isConfirmed) {
          ApiService.deleteFeedback(id);
          renderFeedback();
        }
      });
    }
    if (action.dataset.action === "reply-feedback") {
      return Swal.fire({
        title: "الرد على الملاحظة",
        input: "textarea",
        showCancelButton: true,
        confirmButtonText: "إرسال الرد",
        cancelButtonText: "إلغاء",
      }).then((r) => {
        if (r.isConfirmed && r.value) {
          ApiService.updateFeedback(id, { reply: r.value, status: "closed" });
          renderFeedback();
        }
      });
    }
  }

  // About: edit and cancel
  if (t.closest("#about-edit-btn")) {
    if (!requireDemoMode()) return;
    return openAboutForm(true);
  }
  if (t.closest("#about-cancel-btn")) {
    if (!requireDemoMode()) return;
    return openAboutForm(false);
  }

  // Attendance: status buttons, mark-all, save
  const statusBtn = t.closest(".status-btn");
  if (statusBtn)
    return setRowStatus(
      statusBtn.closest(".student-item"),
      statusBtn.dataset.status,
    );
  if (t.closest("#markAllPresentBtn"))
    return document
      .querySelectorAll(".student-item")
      .forEach((r) => setRowStatus(r, "present"));
  if (t.closest("#saveAttendanceBtn")) return saveAttendanceUI();

  // Behavior: +1 / -1 buttons inside a student row
  const sign = t.closest("button")?.textContent.trim();
  if (sign === "+1" || sign === "-1") {
    if (!requireDemoMode()) return;
    const row = t.closest(".group");
    const nameEl = row && row.querySelector(".text-sm.font-bold");
    if (nameEl) {
      const points = sign === "+1" ? 1 : -1;
      ApiService.addBehavior(
        nameEl.textContent.trim(),
        points,
        points > 0 ? "مشاركة إيجابية" : "ملاحظة سلوكية",
      );
      Swal.fire({
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 1500,
        icon: points > 0 ? "success" : "error",
        title: points > 0 ? "تمت إضافة نقطة إيجابية" : "تم تسجيل ملاحظة سلبية",
      });
    }
    return;
  }

  // Daily plan: sample and empty-template buttons
  if (t.closest("#loadArabicSampleBtn")) {
    if (!requireDemoMode()) return;
    fillDailyPlan(SAMPLE_PLAN);
    return autosaveDaily();
  }
  if (t.closest("#loadEmptyTemplateBtn")) {
    if (!requireDemoMode()) return;
    fillDailyPlan({});
    return autosaveDaily();
  }

  // Prompt helper modal
  if (t.closest("#addPromptHelperBtn"))
    return document.getElementById("promptsModal").classList.remove("hidden");
  if (t.closest("#closeModalBtn, #closeModalBtn2") || t.id === "promptsModal")
    return document.getElementById("promptsModal").classList.add("hidden");

  // Never leave a visible dashboard button silently inactive.
  const button = t.closest("button");
  if (!button || button.hasAttribute("onclick")) return;
  e.preventDefault();
  const notice = window.AWN_CONFIG?.demoMode === false
    ? "هذا الإجراء غير متصل بالخادم، ولم يتم حفظ أي بيانات."
    : "هذا الإجراء غير مفعّل في النموذج التجريبي، ولا تُحفظ أي بيانات منه.";
  if (window.Swal?.fire) {
    window.Swal.fire({ icon: "info", title: "إجراء غير متاح", text: notice });
  } else {
    window.alert(notice);
  }
});

// Attendance-independent checkbox: student marks an assignment done or not done.
document.addEventListener("change", async (e) => {
  if (!e.target.matches('input[type="checkbox"][data-assignment-id]')) return;
  try {
    await AssignmentService.setStatus(
      e.target.dataset.assignmentId,
      e.target.checked ? "completed" : "pending",
    );
    await renderStudentAssignments();
  } catch (error) {
    console.error("Could not update assignment status", error);
    Swal.fire({ icon: "error", title: "تعذر تحديث حالة الواجب." });
    await renderStudentAssignments();
  }
});
// Forms: feedback and about
document.addEventListener("submit", async (e) => {
  
  if (e.target.id === "add-assignment-form") {
    e.preventDefault();
    const form = e.target;
    const values = new FormData(form);
    try {
      await AssignmentService.create({
        title: values.get("title"),
        subject: values.get("subject"),
        dueDate: values.get("dueDate"),
      });
      form.reset();
      const demoSave = !window.AWN_CONFIG?.apiBaseUrl;
      Swal.fire({
        icon: "success",
        title: demoSave ? "تم حفظ الواجب في النموذج التجريبي" : "تم حفظ الواجب",
        text: demoSave ? "حُفظ في التخزين التجريبي لهذا المتصفح." : "حُفظ عبر خدمة المنظومة.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Could not create assignment", error);
      Swal.fire({ icon: "error", title: window.AWN_CONFIG?.demoMode === true ? "تعذر حفظ الواجب في النموذج التجريبي." : "تعذر حفظ الواجب عبر خدمة المنظومة." });
    }
    return;
  }
  if (e.target.id === "feedback-form") {
    e.preventDefault();
    if (!requireDemoMode()) return;
    const f = new FormData(e.target);
    ApiService.addFeedback(
      currentUser().username || "unknown",
      f.get("category"),
      f.get("subject"),
      f.get("message"),
    );
    e.target.reset();
    renderFeedback();
    Swal.fire({
      icon: "success",
      title: "تم الإرسال",
      timer: 1500,
      showConfirmButton: false,
    });
  }
  if (e.target.id === "about-form") {
    e.preventDefault();
    if (!requireDemoMode()) return;
    const f = new FormData(e.target);
    ApiService.saveAbout({
      schoolName: f.get("schoolName"),
      contactEmail: f.get("contactEmail"),
      phone: f.get("phone"),
      description: f.get("description"),
    });
    renderAbout();
    openAboutForm(false);
  }
});

const planAutosaveTimers = new Map();
const PLAN_AUTOSAVE_DELAY = 350;

function cancelPendingPlanAutosave(key) {
  const timer = planAutosaveTimers.get(key);
  if (timer !== undefined) {
    clearTimeout(timer);
    planAutosaveTimers.delete(key);
  }
}

function schedulePlanAutosave(key, save) {
  cancelPendingPlanAutosave(key);
  const timer = setTimeout(() => {
    planAutosaveTimers.delete(key);
    try {
      save();
    } catch (error) {
      console.error("Could not autosave " + key + " plan", error);
      if (window.Swal?.fire) {
        window.Swal.fire({ icon: "error", title: "تعذر حفظ التغييرات محليًا." });
      }
    }
  }, PLAN_AUTOSAVE_DELAY);
  planAutosaveTimers.set(key, timer);
}

function flushPendingPlanAutosaves() {
  for (const [key, save] of [
    ["daily", autosaveDaily],
    ["quarterly", autosaveQuarterly],
  ]) {
    if (!planAutosaveTimers.has(key)) continue;
    cancelPendingPlanAutosave(key);
    try {
      save();
    } catch (error) {
      console.error("Could not flush " + key + " plan autosave", error);
    }
  }
}

window.addEventListener("pagehide", flushPendingPlanAutosaves);

document.addEventListener("input", (event) => {
  if (event.target.closest("#view-daily-plans")) {
    schedulePlanAutosave("daily", autosaveDaily);
  } else if (event.target.closest("#view-quarterly-plans")) {
    schedulePlanAutosave("quarterly", autosaveQuarterly);
  }
});