/**
 * Awn LMS - Principal Dashboard Feature Module
 * Handles school overview, teacher performance tracking, attendance stats, and principal actions.
 */

function switchPrincipalView(viewId) {
  const views = document.querySelectorAll(".principal-view");
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
window.switchPrincipalView = switchPrincipalView;

/**
 * Handle adding a new teacher in Principal dashboard
 */
function handleAddTeacher() {
  if (window.Swal?.fire) {
    window.Swal.fire({
      title: "إضافة معلم جديد",
      html: `
        <div class="flex flex-col gap-3 text-right" dir="rtl">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">اسم المعلم</label>
            <input id="swal-teacher-name" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="أ. الاسم الكامل">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">المبحث الدراسي</label>
            <input id="swal-teacher-subject" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: الرياضيات">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">الصفوف المسندة</label>
            <input id="swal-teacher-grades" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: السابع، الثامن">
          </div>
        </div>
      `,
      confirmButtonText: "إضافة المعلم",
      cancelButtonText: "إلغاء",
      showCancelButton: true,
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById("swal-teacher-name")?.value.trim();
        const subject = document.getElementById("swal-teacher-subject")?.value.trim();
        const grades = document.getElementById("swal-teacher-grades")?.value.trim();
        if (!name || !subject) {
          window.Swal.showValidationMessage("يرجى إدخال اسم المعلم والمبحث");
          return false;
        }
        return { name, subject, grades: grades || "غير محدد" };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const tbody = document.querySelector("#view-teachers tbody");
        if (tbody) {
          const row = document.createElement("tr");
          row.className = "hover:bg-slate-50 transition-colors";
          const safeName = typeof esc === "function" ? esc(result.value.name) : result.value.name;
          const safeSubject = typeof esc === "function" ? esc(result.value.subject) : result.value.subject;
          const safeGrades = typeof esc === "function" ? esc(result.value.grades) : result.value.grades;
          row.innerHTML = `
            <td class="p-3 font-bold text-slate-800">${safeName}</td>
            <td class="p-3 text-slate-600">${safeSubject}</td>
            <td class="p-3 text-slate-600">${safeGrades}</td>
            <td class="p-3"><button type="button" class="text-primary font-bold hover:underline" data-action="view-teacher-profile">عرض الملف</button></td>
          `;
          tbody.appendChild(row);
        }
        window.Swal.fire({
          icon: "success",
          title: "تمت إضافة المعلم بنجاح",
          timer: 1800,
          showConfirmButton: false
        });
      }
    });
  }
}

/**
 * Handle viewing a teacher's file/profile
 */
function handleViewTeacherProfile(teacherName, subject) {
  if (window.Swal?.fire) {
    window.Swal.fire({
      icon: "info",
      title: teacherName || "ملف المعلم",
      html: `
        <div class="text-right text-sm space-y-2 mt-2" dir="rtl">
          <p><strong>المبحث:</strong> ${subject || "اللغة العربية"}</p>
          <p><strong>الحالة الأكاديمية:</strong> نشط ومثبّت</p>
          <p><strong>نسبة اكتمال الخطط:</strong> 95%</p>
          <p><strong>التقييم الإشرافي الأخير:</strong> ممتاز (94/100)</p>
        </div>
      `,
      confirmButtonText: "إغلاق"
    });
  }
}

/**
 * Initialize principal dashboard interactions
 */
function initPrincipal() {
  const teachersView = document.getElementById("view-teachers");
  if (teachersView) {
    // Add teacher button
    const addBtn = teachersView.querySelector("button:not([data-action])");
    if (addBtn && addBtn.textContent.includes("إضافة معلم")) {
      addBtn.addEventListener("click", handleAddTeacher);
    }

    // Teacher profile view buttons (delegated)
    teachersView.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (target && target.textContent.includes("عرض الملف")) {
        const row = target.closest("tr");
        const name = row?.querySelector("td:first-child")?.textContent.trim();
        const subject = row?.querySelector("td:nth-child(2)")?.textContent.trim();
        handleViewTeacherProfile(name, subject);
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPrincipal);
} else {
  initPrincipal();
}
