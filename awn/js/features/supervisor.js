/**
 * Awn LMS - Supervisor Dashboard Feature Module
 * Handles educational supervision, teacher evaluations, curriculum progress, and visit logs.
 */

function switchSupervisorView(viewId) {
  const views = document.querySelectorAll(".supervisor-view");
  views.forEach((view) => {
    view.classList.add("hidden");
  });

  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.classList.remove("hidden");
  }

  const links = document.querySelectorAll("#sidebar [data-path]");
  links.forEach((link) => {
    link.className =
      "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:text-primary transition-all";
    const indicator = link.querySelector(".active-indicator");
    if (indicator) indicator.remove();

    if (link.getAttribute("data-path") === viewId) {
      link.className =
        "relative flex items-center justify-between px-4 py-3 bg-primary-50 text-primary font-bold rounded-xl";
      link.innerHTML +=
        '<div class="active-indicator absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-l-full"></div>';
    }
  });
}

// Make accessible to inline event handlers
window.switchSupervisorView = switchSupervisorView;

/**
 * Handle scheduling a new supervisory visit
 */
function handleScheduleVisit() {
  if (window.Swal?.fire) {
    window.AwnUI.dialog({
      title: "جدولة زيارة إشرافية جديدة",
      html: `
        <div class="flex flex-col gap-3 text-right" dir="rtl">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">اسم المدرسة</label>
            <input id="swal-visit-school" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: مدرسة الملك عبدالله الثاني">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">الهدف من الزيارة / المعلم المعني</label>
            <input id="swal-visit-target" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: زيارة تقييمية - أ. حسام عثمان">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">الموعد والتوقيت</label>
            <input id="swal-visit-time" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: الثلاثاء القادم 10:00 ص">
          </div>
        </div>
      `,
      confirmButtonText: "جدولة الزيارة",
      cancelButtonText: "إلغاء",
      showCancelButton: true,
      focusConfirm: false,
      preConfirm: () => {
        const school = document.getElementById("swal-visit-school")?.value.trim();
        const target = document.getElementById("swal-visit-target")?.value.trim();
        const time = document.getElementById("swal-visit-time")?.value.trim();
        if (!school || !target) {
          window.Swal.showValidationMessage("يرجى إدخال اسم المدرسة والهدف من الزيارة");
          return false;
        }
        return { school, target, time: time || "خلال الأسبوع الحالي" };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const visitsGrid = document.querySelector("#view-visits .grid");
        if (visitsGrid) {
          const card = document.createElement("div");
          card.className = "p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:shadow-sm transition-all cursor-pointer bg-amber-50/40 border-amber-200/80";
          const safeSchool = typeof esc === "function" ? esc(result.value.school) : result.value.school;
          const safeTarget = typeof esc === "function" ? esc(result.value.target) : result.value.target;
          const safeTime = typeof esc === "function" ? esc(result.value.time) : result.value.time;
          card.innerHTML = `
            <div>
              <div class="font-bold text-slate-800">${safeSchool}</div>
              <div class="text-xs text-slate-500 mt-1">${safeTarget}</div>
            </div>
            <div class="bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold rounded">${safeTime}</div>
          `;
          visitsGrid.prepend(card);
        }
        window.AwnUI.dialog({
          icon: "success",
          title: "تمت جدولة الزيارة بنجاح",
          timer: 1800,
          showConfirmButton: false
        });
      }
    });
  }
}

/**
 * Initialize supervisor dashboard interactions
 */
function initSupervisor() {
  const visitsView = document.getElementById("view-visits");
  if (visitsView) {
    const scheduleBtn = visitsView.querySelector("button");
    if (scheduleBtn && scheduleBtn.textContent.includes("جدولة زيارة")) {
      scheduleBtn.addEventListener("click", handleScheduleVisit);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSupervisor);
} else {
  initSupervisor();
}
