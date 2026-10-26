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
async function renderAttendance() {
  const rows = [...document.querySelectorAll("#studentAttendanceList .student-item")];
  if (!rows.length) return;
  const scope = attendanceScope();
  const res = typeof ApiService?.getAttendance === "function" ? await ApiService.getAttendance(scope.date, { className: scope.className, period: scope.period }) : null;
  const saved = res?.success ? res.data : res;
  rows.forEach((row) => {
    const name = row.querySelector(".text-sm.font-bold")?.textContent.trim() || "";
    const rec = saved?.records?.find((item) => item.name === name);
    setRowStatus(row, rec?.status || "present");
  });
  updateAttendanceSummary();
}

// Reads every row and saves today's attendance through ApiService.
async function saveAttendanceUI() {
  if (!requireDemoMode()) return;
  const scope = attendanceScope();
  const records = [...document.querySelectorAll("#studentAttendanceList .student-item")].map((row) => ({
    name: row.querySelector(".text-sm.font-bold")?.textContent.trim() || "",
    status: row.dataset.status || "present",
  }));
  try {
    const result = await AttendanceService.save(scope.date, records, { className: scope.className, period: scope.period });
    if (!result.success) throw new Error(result.message);
    window.AwnUI.dialog({ icon: "success", title: "حُفظ الحضور محليًا لهذا الصف والحصة", timer: 1500, showConfirmButton: false });
  } catch (error) { console.error(error); window.AwnUI.dialog({ icon: "error", title: "تعذر حفظ سجل الحضور محليًا." }); }
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
  const plan = { version: 2, status, updated: new Date().toISOString(), stages: [] };
  DAILY_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) plan[id] = el.value;
  });
  document.querySelectorAll("#daily-stages tbody tr").forEach((tr) => {
    const f = tr.querySelectorAll("input, textarea"); // order: teacher, learner, time
    if (f.length >= 3) {
      plan.stages.push({
        time: f[2].value,
        learner: f[1].value,
        teacher: f[0].value,
      });
    }
  });
  plan.sessionFields = [...document.querySelectorAll('#daily-paper input')].filter(field => !field.id && !field.closest('#daily-stages')).map(field => field.value);
  return plan;
}

// Writes a saved plan back into the form. Missing values become blank.
function fillDailyPlan(plan) {
  DAILY_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = plan[id] || "";
  });
  document.querySelectorAll("#daily-stages tbody tr").forEach((tr, i) => {
    const s = (plan.stages && plan.stages[i]) || {
      time: "",
      learner: "",
      teacher: "",
    };
    const f = tr.querySelectorAll("input, textarea");
    if (f.length >= 3) {
      f[0].value = s.teacher;
      f[1].value = s.learner;
      f[2].value = s.time;
    }
  });
  const sessionFields = [...document.querySelectorAll('#daily-paper input')].filter(field => !field.id && !field.closest('#daily-stages'));
  const values = plan.sessionFields || (plan.stages || []).slice(4).flatMap(stage => [stage.teacher, stage.learner, stage.time]);
  sessionFields.forEach((field, index) => { field.value = values[index] || ''; });
}

async function savePlanSafely(save, context) {
  try {
    AwnUtils.unwrap(await save());
    return true;
  } catch (error) {
    console.error("Could not save " + context, error);
    if (window.Swal?.fire) {
      window.AwnUI.dialog({ icon: "error", title: "تعذر حفظ التغييرات محليًا." });
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
  const view = document.getElementById("view-lesson-plans");
  const metadata = [...view.querySelectorAll("input,textarea,select")].filter((field) => !field.closest("#plan-tbody")).map(planControlState);
  const rows = [...document.querySelectorAll("#plan-tbody tr")].map((row) => [...row.querySelectorAll("textarea,input,select")].map(planControlState));
  return { version: 2, metadata, rows, updated: new Date().toISOString() };
}

let isFillingQuarterlyPlan = false;

function fillQuarterlyPlan(plan) {
  const tbody = document.getElementById("plan-tbody"), template = tbody?.querySelector("tr")?.cloneNode(true);
  if (!tbody || !template || !plan) return;
  isFillingQuarterlyPlan = true;
  try {
    const meta = [...document.querySelectorAll("#view-lesson-plans input,#view-lesson-plans textarea,#view-lesson-plans select")].filter((field) => !field.closest("#plan-tbody"));
    if (plan.version === 2) (plan.metadata || []).forEach((state, index) => restorePlanControl(meta[index], state));
    const rows = Array.isArray(plan) ? plan : (plan.rows || []);
    tbody.replaceChildren();
    if (!rows.length) tbody.appendChild(template);
    rows.forEach((states) => {
      const row = template.cloneNode(true), fields = [...row.querySelectorAll("textarea,input,select")];
      fields.forEach((field) => { if (field.type !== "checkbox") field.value = ""; });
      states.forEach((state, index) => {
        const field = fields[index]; if (!field) return;
        if (typeof state === "object" && state !== null) restorePlanControl(field, state);
        else if (field.type === "checkbox") field.checked = state === "on" || state === true;
        else field.value = String(state ?? "");
      });
      tbody.appendChild(row);
    });
  } finally { isFillingQuarterlyPlan = false; renumberRows(); }
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
    if (tr.cells[0]) tr.cells[0].textContent = i + 1;
  });
}

function deleteRow(button) {
  const tbody = document.getElementById("plan-tbody");
  if (!tbody || tbody.rows.length <= 1) return window.AwnUI.dialog({ icon: "warning", title: "يجب أن تحتوي الخطة على نتاج واحد على الأقل." });
  button.closest("tr")?.remove(); renumberRows(); autosaveQuarterly();
}

function addNewRow() {
  const tbody = document.getElementById("plan-tbody"), template = tbody?.querySelector("tr");
  if (!tbody || !template) return;
  const row = template.cloneNode(true);
  row.querySelectorAll("textarea").forEach((field) => { field.value = ""; });
  row.querySelectorAll('input:not([type="checkbox"]),select').forEach((field) => { field.value = ""; });
  row.cells[0].textContent = String(tbody.rows.length + 1); tbody.appendChild(row); renumberRows(); autosaveQuarterly();
}

async function saveDraftNotification() {
  if (!requireDemoMode() || !(await autosaveQuarterly())) return;
  window.AwnUI.dialog({
    icon: "success",
    title: "تم حفظ مسودة الخطة الفصلية",
    timer: 1500,
    showConfirmButton: false,
  });
}

// Used by both plan views. In the daily view it saves the plan. In the quarterly view it only confirms.
async function submitForReview() {
  cancelPendingPlanAutosave("daily");
  cancelPendingPlanAutosave("quarterly");
  if (!requireDemoMode()) return;

  const daily = document.getElementById("view-daily-plans");
  if (daily && !daily.classList.contains("hidden")) {
    const saved = await savePlanSafely(
      () => ApiService.saveDailyPlan(collectDailyPlan("submitted")),
      "daily plan",
    );
    if (!saved) return;
    window.AwnUI.dialog({
      icon: "success",
      title: "حُفظت الخطة محليًا؛ الإرسال للاعتماد يحتاج ربط الخادم",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  const saved = await savePlanSafely(
    () => ApiService.saveQuarterlyPlan(collectQuarterlyPlan()),
    "quarterly plan",
  );
  if (!saved) return;
  window.AwnUI.dialog({
    icon: "success",
    title: "تم حفظ الخطة الفصلية محليًا؛ الإرسال للاعتماد يحتاج ربط الخادم",
    timer: 2000,
    showConfirmButton: false,
  });
}
