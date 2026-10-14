// Each listener is attached once to document, so buttons created later still work.

document.addEventListener("click", async (e) => {
  const t = e.target;
  if (!t || t.closest(".swal2-container")) return;

  const logoutLink = t.closest("[data-logout]");
  if (logoutLink) {
    try {
      localStorage.removeItem("awn_session");
    } catch (error) {
      console.warn("Could not clear the local session.", error);
    }
    return;
  }

  // Sidebar navigation (every role)
  const link = t.closest("[data-path]");
  if (link) {
    e.preventDefault();
    if (typeof navigateTo === "function") {
      return navigateTo(link.getAttribute("data-path"));
    }
    return;
  }

  // Administrative mock actions (Principal/Supervisor)
  const text = t.textContent?.trim() || "";
  if (
    text === "اعتماد" ||
    text === "مراجعة" ||
    text.includes("إضافة زيارة") ||
    text.includes("تعميم داخلي")
  ) {
    if (window.Swal?.fire) {
      window.Swal.fire({
        icon: "info",
        title: "وظيفة تجريبية",
        text: "هذا الإجراء غير مرتبط بخادم ولا يتم تسجيله فعليًا حتى الآن.",
        timer: 2000,
        showConfirmButton: false,
      });
    }
    return;
  }

  // Feedback: reply or delete
  const action = t.closest("[data-action]");
  if (action) {
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    const id = action.closest("[data-feedback-id]")?.dataset.feedbackId;
    if (!id) return;
    if (action.dataset.action === "delete-feedback") {
      if (window.Swal?.fire) {
        return window.Swal.fire({
          title: "حذف هذه الملاحظة؟",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "حذف",
          cancelButtonText: "إلغاء",
        }).then(async (r) => {
          if (r.isConfirmed) {
            await ApiService.deleteFeedback(id);
            if (typeof renderFeedback === "function") await renderFeedback();
          }
        });
      }
    }
    if (action.dataset.action === "reply-feedback") {
      if (window.Swal?.fire) {
        return window.Swal.fire({
          title: "الرد على الملاحظة",
          input: "textarea",
          showCancelButton: true,
          confirmButtonText: "إرسال الرد",
          cancelButtonText: "إلغاء",
        }).then(async (r) => {
          if (r.isConfirmed && r.value) {
            await ApiService.updateFeedback(id, { reply: r.value, status: "closed" });
            if (typeof renderFeedback === "function") await renderFeedback();
          }
        });
      }
    }
  }

  // About: edit and cancel
  if (t.closest("#about-edit-btn")) {
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    if (typeof openAboutForm === "function") return openAboutForm(true);
  }
  if (t.closest("#about-cancel-btn")) {
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    if (typeof openAboutForm === "function") return openAboutForm(false);
  }

  // Attendance: status buttons, mark-all, save
  const statusBtn = t.closest(".status-btn");
  if (statusBtn) {
    if (typeof setRowStatus === "function") {
      setRowStatus(statusBtn.closest(".student-item"), statusBtn.dataset.status);
    }
    if (typeof updateAttendanceSummary === "function") updateAttendanceSummary();
    return;
  }
  if (t.closest("#markAllPresentBtn")) {
    if (typeof markAllAttendance === "function") {
      return markAllAttendance("present");
    } else {
      document.querySelectorAll(".student-item").forEach((r) => {
        if (typeof setRowStatus === "function") setRowStatus(r, "present");
      });
      return;
    }
  }
  if (t.closest("#saveAttendanceBtn")) {
    if (typeof saveAttendanceUI === "function") return saveAttendanceUI();
  }

  // Behavior: +1 / -1 buttons inside a student row
  const sign = t.closest("button")?.textContent?.trim();
  if (sign === "+1" || sign === "-1") {
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    const row = t.closest(".group");
    const nameEl = row && row.querySelector(".text-sm.font-bold");
    if (nameEl) {
      const points = sign === "+1" ? 1 : -1;
      await ApiService.addBehavior(
        nameEl.textContent.trim(),
        points,
        points > 0 ? "مشاركة إيجابية" : "ملاحظة سلوكية",
      );
      if (window.Swal?.fire) {
        window.Swal.fire({
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 1500,
          icon: points > 0 ? "success" : "error",
          title: points > 0 ? "تمت إضافة نقطة إيجابية" : "تم تسجيل ملاحظة سلبية",
        });
      }
    }
    return;
  }

  // Daily plan: sample and empty-template buttons
  if (t.closest("#loadArabicSampleBtn")) {
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    if (typeof fillDailyPlan === "function" && typeof SAMPLE_PLAN !== "undefined") {
      fillDailyPlan(SAMPLE_PLAN);
    }
    if (typeof autosaveDaily === "function") return autosaveDaily();
  }
  if (t.closest("#loadEmptyTemplateBtn")) {
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    if (typeof fillDailyPlan === "function") fillDailyPlan({});
    if (typeof autosaveDaily === "function") return autosaveDaily();
  }

  // Prompt helper modal
  if (t.closest("#addPromptHelperBtn")) {
    const modal = document.getElementById("promptsModal");
    if (modal) modal.classList.remove("hidden");
    return;
  }
  if (t.closest("#closeModalBtn, #closeModalBtn2") || t.id === "promptsModal") {
    const modal = document.getElementById("promptsModal");
    if (modal) modal.classList.add("hidden");
    return;
  }

  const teacherAction = t.closest("[data-teacher-action]");
  if (teacherAction && typeof handleTeacherAction === "function") {
    e.preventDefault();
    return handleTeacherAction(teacherAction.dataset.teacherAction, teacherAction);
  }
  if (
    typeof handleTeacherStudentAction === "function" &&
    handleTeacherStudentAction(t.closest("button"), t)
  ) {
    return;
  }

  // Never leave a visible dashboard button silently inactive.
  const button = t.closest("button");
  if (!button || button.hasAttribute("onclick") || button.getAttribute("type") === "submit") return;
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
  if (!e.target || !e.target.matches('input[type="checkbox"][data-assignment-id]')) return;
  try {
    await AssignmentService.setStatus(
      e.target.dataset.assignmentId,
      e.target.checked ? "completed" : "pending",
    );
    if (typeof renderStudentAssignments === "function") {
      await renderStudentAssignments();
    }
  } catch (error) {
    console.error("Could not update assignment status", error);
    if (window.Swal?.fire) {
      window.Swal.fire({ icon: "error", title: "تعذر تحديث حالة الواجب." });
    }
    if (typeof renderStudentAssignments === "function") {
      await renderStudentAssignments();
    }
  }
});

// Forms: assignments, feedback, and about
document.addEventListener("submit", async (e) => {
  if (!e.target) return;

  if (e.target.id === "add-assignment-form") {
    e.preventDefault();
    const form = e.target;
    const values = new FormData(form);
    try {
      const res = await AssignmentService.create({
        title: values.get("title"),
        subject: values.get("subject"),
        dueDate: values.get("dueDate"),
      });
      if (res && res.success === false) {
        throw new Error(res.message);
      }
      form.reset();
      const demoSave = !window.AWN_CONFIG?.apiBaseUrl;
      if (window.Swal?.fire) {
        window.Swal.fire({
          icon: "success",
          title: demoSave ? "تم حفظ الواجب في النموذج التجريبي" : "تم حفظ الواجب",
          text: demoSave ? "حُفظ في التخزين التجريبي لهذا المتصفح." : "حُفظ عبر خدمة المنظومة.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Could not create assignment", error);
      if (window.Swal?.fire) {
        window.Swal.fire({
          icon: "error",
          title: window.AWN_CONFIG?.demoMode === true
            ? "تعذر حفظ الواجب في النموذج التجريبي."
            : "تعذر حفظ الواجب عبر خدمة المنظومة.",
        });
      }
    }
    return;
  }

  if (e.target.id === "feedback-form") {
    e.preventDefault();
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    const form = e.target;
    const alertBox = document.getElementById("feedback-form-alert");
    if (alertBox) alertBox.classList.add("hidden");

    const f = new FormData(form);
    const category = String(f.get("category") || "").trim();
    const subject = String(f.get("subject") || "").trim();
    const message = String(f.get("message") || "").trim();

    // Form validation
    if (!subject || subject.length < 3) {
      if (alertBox) {
        alertBox.textContent = "يرجى كتابة عنوان للملاحظة لا يقل عن 3 أحرف.";
        alertBox.classList.remove("hidden");
      } else if (window.Swal?.fire) {
        window.Swal.fire({ icon: "warning", title: "تنبيه", text: "يرجى كتابة عنوان للملاحظة لا يقل عن 3 أحرف." });
      }
      return;
    }

    if (!message || message.length < 5) {
      if (alertBox) {
        alertBox.textContent = "يرجى كتابة تفاصيل الملاحظة (5 أحرف على الأقل).";
        alertBox.classList.remove("hidden");
      } else if (window.Swal?.fire) {
        window.Swal.fire({ icon: "warning", title: "تنبيه", text: "يرجى كتابة تفاصيل الملاحظة (5 أحرف على الأقل)." });
      }
      return;
    }

    const author = typeof currentUser === "function" ? (currentUser().username || "unknown") : "unknown";
    const res = await ApiService.addFeedback(author, category, subject, message);

    form.reset();
    if (typeof renderFeedback === "function") await renderFeedback();

    if (window.Swal?.fire) {
      window.Swal.fire({
        icon: "success",
        title: "تم إرسال الملاحظة بنجاح",
        text: res?.message || "تم تسجيل الملاحظة في السجل التجريبي.",
        timer: 1800,
        showConfirmButton: false,
      });
    }
    return;
  }

  if (e.target.id === "about-form") {
    e.preventDefault();
    if (typeof requireDemoMode === "function" && !requireDemoMode()) return;
    const f = new FormData(e.target);
    await ApiService.saveAbout({
      schoolName: f.get("schoolName"),
      contactEmail: f.get("contactEmail"),
      phone: f.get("phone"),
      description: f.get("description"),
    });
    if (typeof renderAbout === "function") await renderAbout();
    if (typeof openAboutForm === "function") await openAboutForm(false);

    if (window.Swal?.fire) {
      window.Swal.fire({
        icon: "success",
        title: "تم حفظ بيانات المؤسسة بنجاح",
        timer: 1500,
        showConfirmButton: false,
      });
    }
    return;
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
    ["daily", typeof autosaveDaily === "function" ? autosaveDaily : null],
    ["quarterly", typeof autosaveQuarterly === "function" ? autosaveQuarterly : null],
  ]) {
    if (!save || !planAutosaveTimers.has(key)) continue;
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
    if (typeof autosaveDaily === "function") schedulePlanAutosave("daily", autosaveDaily);
  } else if (event.target.closest("#view-lesson-plans")) {
    if (typeof autosaveQuarterly === "function") schedulePlanAutosave("quarterly", autosaveQuarterly);
  }
});