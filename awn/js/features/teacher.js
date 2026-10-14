
const STATUS_ON = {
  present: "bg-emerald-500 text-white shadow-sm",
  absent: "bg-red-500 text-white shadow-sm",
  late: "bg-amber-500 text-white shadow-sm",
};

// Highlights the chosen status in one student row and stores it in data-status.
function setRowStatus(row, status) {
  if (!row) return;
  if (!Object.prototype.hasOwnProperty.call(STATUS_ON, status)) return;
  row.dataset.status = status;
  row.querySelectorAll(".status-btn").forEach((b) => {
    const on = b.dataset.status === status;
    b.setAttribute("aria-pressed", String(on));
    b.className =
      "status-btn w-16 py-1.5 rounded text-xs transition-colors " +
      (on
        ? "font-bold " + STATUS_ON[status]
        : "font-medium text-slate-600 hover:bg-white");
  });
}

// Restores today's saved attendance, or marks everyone present by default.
function renderAttendance() {
  const rows = document.querySelectorAll(".student-item");
  if (!rows.length) return;
  const saved = ApiService.getAttendance(todayISO());
  rows.forEach((row) => {
    const name = row.querySelector(".text-sm.font-bold").textContent.trim();
    const rec = saved && saved.records.find((r) => r.name === name);
    setRowStatus(row, rec ? rec.status : "present");
  });
}

// Reads every row and saves today's attendance through ApiService.
function saveAttendanceUI() {
  if (!requireDemoMode()) return;
  const records = [...document.querySelectorAll(".student-item")].map((row) => ({
    name: row.querySelector(".text-sm.font-bold").textContent.trim(),
    status: row.dataset.status || "present",
  }));
  if (!savePlanSafely(() => ApiService.saveAttendance(todayISO(), records), "attendance")) return;
  window.Swal?.fire({
    icon: "success",
    title: "تم حفظ سجل الحضور",
    timer: 1500,
    showConfirmButton: false,
  });
}

// ---------- 8. TEACHER: DAILY PLAN ----------

const DAILY_FIELDS = [
  "subjectField",
  "unitTitleField",
  "lessonTopicField",
  "periodCountField",
  "priorLearningField",
  "outcomesField",
  "reflectionField",
];

const SAMPLE_PLAN = {
  subjectField: "اللغة العربية",
  unitTitleField: "معالم حضارية خالدة",
  lessonTopicField: "البترا: درّة الأردن الوردية",
  periodCountField: "حصة واحدة (45 د)",
  priorLearningField: "المعالم الأثرية",
  outcomesField:
    "1) يقرأ الطالب النص قراءة جهرية معبّرة.\n2) يفسر المعاني والمفردات الجديدة.",
  reflectionField: "",
};

// Reads the header fields and the stage rows into one object.
function collectDailyPlan(status) {
  const plan = { status, updated: new Date().toISOString(), stages: [] };
  DAILY_FIELDS.forEach((id) => {
    plan[id] = document.getElementById(id).value;
  });
  document.querySelectorAll("#view-daily-plans tbody tr").forEach((tr) => {
    const f = tr.querySelectorAll("input, textarea"); // order: time, learner, teacher
    plan.stages.push({
      time: f[0].value,
      learner: f[1].value,
      teacher: f[2].value,
    });
  });
  return plan;
}

// Writes a saved plan back into the form. Missing values become blank.
function fillDailyPlan(plan) {
  DAILY_FIELDS.forEach((id) => {
    document.getElementById(id).value = plan[id] || "";
  });
  document.querySelectorAll("#view-daily-plans tbody tr").forEach((tr, i) => {
    const s = (plan.stages && plan.stages[i]) || {
      time: "",
      learner: "",
      teacher: "",
    };
    const f = tr.querySelectorAll("input, textarea");
    f[0].value = s.time;
    f[1].value = s.learner;
    f[2].value = s.teacher;
  });
}

function savePlanSafely(save, context) {
  try {
    save();
    return true;
  } catch (error) {
    console.error("Could not save " + context, error);
    if (window.Swal?.fire) {
      window.Swal.fire({ icon: "error", title: "تعذر حفظ التغييرات محليًا." });
    } else {
      window.alert("تعذر حفظ التغييرات محليًا.");
    }
    return false;
  }
}
function autosaveDaily() {
  cancelPendingPlanAutosave("daily");
  if (window.AWN_CONFIG?.demoMode === false) return false;
  return savePlanSafely(
    () => ApiService.saveDailyPlan(collectDailyPlan("draft")),
    "daily plan",
  );
}

// ---------- 9. TEACHER: QUARTERLY PLAN ----------

function collectQuarterlyPlan() {
  const plan = [];
  document.querySelectorAll("#plan-tbody tr").forEach((tr) => {
    const fields = tr.querySelectorAll("textarea, input");
    if (fields.length) {
      plan.push(Array.from(fields).map((f) => f.value));
    }
  });
  return plan;
}

let isFillingQuarterlyPlan = false;

function fillQuarterlyPlan(plan) {
  if (!Array.isArray(plan) || !plan.length) return;
  const tbody = document.getElementById("plan-tbody");
  if (!tbody) return;

  isFillingQuarterlyPlan = true;
  try {
    tbody.replaceChildren();
    for (const rowValues of plan) {
      addNewRow();
      const fields = tbody.lastElementChild.querySelectorAll("textarea, input");
      (Array.isArray(rowValues) ? rowValues : []).forEach((value, index) => {
        if (fields[index]) fields[index].value = String(value ?? "");
      });
    }
  } finally {
    isFillingQuarterlyPlan = false;
    renumberRows();
  }
}

function autosaveQuarterly() {
  cancelPendingPlanAutosave("quarterly");
  if (window.AWN_CONFIG?.demoMode === false) return false;
  return savePlanSafely(
    () => ApiService.saveQuarterlyPlan(collectQuarterlyPlan()),
    "quarterly plan",
  );
}

function renumberRows() {
  if (isFillingQuarterlyPlan) return;
  document.querySelectorAll("#plan-tbody tr").forEach((tr, i) => {
    tr.cells[0].textContent = i + 1;
  });
}

function deleteRow(btn) {
  const tbody = document.getElementById("plan-tbody");
  if (tbody.rows.length > 1) {
    btn.closest("tr").remove();
    autosaveQuarterly();
    renumberRows();
  } else
    Swal.fire({
      icon: "warning",
      title: "يجب أن تحتوي الخطة على نتاج واحد على الأقل.",
    });
}

function addNewRow() {
  const tbody = document.getElementById("plan-tbody");
  const tr = document.createElement("tr");
  tr.className = "hover:bg-slate-50 align-top";
  const area = (p) =>
    `<textarea class="w-full bg-slate-50 p-2 rounded outline-none" rows="4" placeholder="${p}"></textarea>`;
  tr.innerHTML = `
    <td class="p-3 text-center font-bold text-primary bg-slate-50/50"></td>
    <td class="p-3">${area("النتاجات الخاصة...")}</td>
    <td class="p-3">${area("مصادر التعلم...")}</td>
    <td class="p-3">${area("الاستراتيجيات...")}</td>
    <td class="p-3">${area("التقويم...")}</td>
    <td class="p-3">${area("الأنشطة...")}</td>
    <td class="p-3">${area("التأمل الذاتي...")}</td>
    <td class="p-3 text-center no-print"><button type="button" aria-label="حذف النتاج" class="p-1 rounded text-red-500 hover:bg-red-50" onclick="deleteRow(this)"><span class="material-symbols-outlined text-[18px]">delete</span></button></td>`;
  tbody.appendChild(tr);
  renumberRows();
}

function saveDraftNotification() {
  if (!requireDemoMode() || !autosaveQuarterly()) return;
  window.Swal?.fire({
    icon: "success",
    title: "تم حفظ مسودة الخطة الفصلية",
    timer: 1500,
    showConfirmButton: false,
  });
}

// Used by both plan views. In the daily view it saves the plan. In the quarterly view it only confirms.
function submitForReview() {
  cancelPendingPlanAutosave("daily");
  cancelPendingPlanAutosave("quarterly");
  if (!requireDemoMode()) return;

  const daily = document.getElementById("view-daily-plans");
  if (daily && !daily.classList.contains("hidden")) {
    const saved = savePlanSafely(
      () => ApiService.saveDailyPlan(collectDailyPlan("submitted")),
      "daily plan",
    );
    if (!saved) return;
    window.Swal?.fire({
      icon: "success",
      title: "حُفظت الخطة محليًا؛ الإرسال للاعتماد يحتاج ربط الخادم",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  const saved = savePlanSafely(
    () => ApiService.saveQuarterlyPlan(collectQuarterlyPlan()),
    "quarterly plan",
  );
  if (!saved) return;
  window.Swal?.fire({
    icon: "success",
    title: "تم حفظ الخطة الفصلية محليًا؛ الإرسال للاعتماد يحتاج ربط الخادم",
    timer: 2000,
    showConfirmButton: false,
  });
}
