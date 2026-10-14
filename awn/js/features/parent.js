/**
 * Awn LMS - Parent Feature Module
 * Standardized with async API consumption and null-safe rendering.
 */

// Draws the parent's notifications from localStorage.
async function renderParentNotifications() {
  const box = document.getElementById("parent-notifications-container");
  if (!box) return;
  if (window.AWN_CONFIG?.demoMode === false) {
    box.textContent = "خدمة الإشعارات غير مربوطة بالخادم بعد.";
    return;
  }
  const res = typeof ApiService?.getNotifications === "function" ? await ApiService.getNotifications("parent") : null;
  const items = res?.success ? res.data : (Array.isArray(res) ? res : []);
  if (!items.length) {
    box.innerHTML = '<p class="p-4 text-sm text-slate-500">لا توجد إشعارات حالياً.</p>';
    return;
  }
  box.innerHTML = items
    .map(
      (n) => `
    <div class="p-4 bg-purple-50/50 flex items-start gap-4">
      <div class="flex flex-col flex-1">
        <span class="text-sm font-bold text-slate-800">${esc(n.title)}</span>
        <p class="text-xs text-slate-700 mt-1">${esc(n.message)}</p>
      </div>
    </div>`,
    )
    .join("");
}

async function renderParentAttendance() {
  const container = document.getElementById("parent-attendance-container");
  if (!container) return;
  if (window.AWN_CONFIG?.demoMode === false) {
    container.textContent = "خدمة الحضور والسلوك غير مربوطة بالخادم بعد.";
    return;
  }
  const attRes = typeof ApiService?.getAllAttendance === "function" ? await ApiService.getAllAttendance() : null;
  const behRes = typeof ApiService?.getAllBehavior === "function" ? await ApiService.getAllBehavior() : null;

  const attendance = (attRes?.success ? attRes.data : (Array.isArray(attRes) ? attRes : [])).filter((r) => r && typeof r === "object");
  const behaviors = (behRes?.success ? behRes.data : (Array.isArray(behRes) ? behRes : [])).filter((r) => r && typeof r === "object");

  if (attendance.length === 0 && behaviors.length === 0) {
    container.innerHTML = `<div class="flex flex-col items-center justify-center py-10 text-center">
        <span class="material-symbols-outlined text-[50px] text-emerald-400 mb-3 block">verified</span>
        <p class="text-slate-600 font-semibold text-sm">لا توجد سجلات حضور أو سلوك مسجلة حاليًا.</p>
      </div>`;
    return;
  }

  let html = '<div class="divide-y divide-slate-100">';

  behaviors.forEach((b) => {
    const kind = b.points > 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100";
    const icon = b.points > 0 ? "star" : "warning";
    html += `<div class="p-4 hover:bg-slate-50 flex items-start gap-4">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-1 ${kind}">
            <span class="material-symbols-outlined text-[20px]">${icon}</span>
        </div>
        <div class="flex flex-col flex-1">
            <span class="text-sm font-bold text-slate-800">سلوك: ${esc(b.student)}</span>
            <p class="text-xs text-slate-600 mt-1">${esc(b.note)} (${b.points > 0 ? "+" : ""}${b.points} نقاط)</p>
        </div>
    </div>`;
  });

  attendance.forEach((a) => {
    (Array.isArray(a?.records) ? a.records : []).filter((r) => r && r.status !== "present").forEach((r) => {
      html += `<div class="p-4 hover:bg-slate-50 flex items-start gap-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border mt-1 text-red-600 bg-red-50 border-red-100">
              <span class="material-symbols-outlined text-[20px]">person_off</span>
          </div>
          <div class="flex flex-col flex-1">
              <span class="text-sm font-bold text-slate-800">${r.status === "late" ? "تأخر" : "غياب"}: ${esc(r.name)}</span>
              <p class="text-xs text-slate-600 mt-1">تاريخ: ${esc(a.date)}</p>
          </div>
      </div>`;
    });
  });

  html += "</div>";
  container.innerHTML = html;
}

// Hook both parent components together
const origParentInit = renderParentNotifications;
renderParentNotifications = async function () {
  await origParentInit();
  await renderParentAttendance();
};
