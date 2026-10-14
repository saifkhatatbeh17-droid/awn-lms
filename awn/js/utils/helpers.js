
// Returns the logged-in user saved by the login page.
function currentUser() {
  try {
    const user = JSON.parse(localStorage.getItem("awn_session")) || {};
    return user && typeof user === "object" && !Array.isArray(user) ? user : {};
  } catch {
    return {};
  }
}

// Escapes text before inserting it into HTML, so typed text can't break the markup.
function esc(text) {
  const d = document.createElement("div");
  d.textContent = text == null ? "" : String(text);
  return d.innerHTML;
}

// Returns the local date as YYYY-MM-DD. Avoids the UTC day shift near midnight in Amman.
function todayISO(timeZone = "Asia/Amman") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return values.year + "-" + values.month + "-" + values.day;
}


function requireDashboardRole() {
  const pageName = window.location.pathname.split("/").pop()?.toLowerCase();
  const rolesByPage = {
    "teacher-dashboard.html": "teacher",
    "principal-dashboard.html": "principal",
    "supervisor-dashboard.html": "supervisor",
    "student-dashboard.html": "student",
    "parent-dashboard.html": "parent",
  };
  const expectedRole = rolesByPage[pageName];
  if (!expectedRole) return true;
  const user = currentUser();
  return Boolean(user.username && user.role === expectedRole);
}
// Supplies meaningful accessible names for legacy controls that predate labeled markup.
function ensureAccessibleNames(root = document) {
  const controls = root.querySelectorAll('input:not([type="hidden"]), select, textarea');
  controls.forEach((control) => {
    if (control.labels?.length || control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return;

    const placeholder = control.getAttribute('placeholder')?.trim();
    if (placeholder && !/^[.\s…_-]+$/.test(placeholder)) {
      control.setAttribute('aria-label', placeholder);
      return;
    }

    const nearbyText = (element) => element?.textContent?.replace(/\s+/g, ' ').trim();
    let label = nearbyText(control.previousElementSibling);
    if (!label) {
      const groupLabel = control.parentElement?.querySelector(':scope > label, :scope > span');
      label = nearbyText(groupLabel);
    }
    if (!label) {
      const cell = control.closest('td, th');
      const table = cell?.closest('table');
      if (cell && table) {
        const headerRow = Array.from(table.rows).find((row) => row.querySelector("th"));
        const columnLabel = nearbyText(headerRow?.cells[cell.cellIndex]);
        const row = cell.parentElement;
        const rowLabel = row?.cells?.[0] === cell ? "" : nearbyText(row?.cells?.[0]);
        const viewHeading = nearbyText(table.closest('[id^="view-"]')?.querySelector("h1, h2, h3"));
        label = [rowLabel, columnLabel].filter(Boolean).join(" — ");
        if (!label) label = (viewHeading || "جدول البيانات") + "، الصف " + ((row?.rowIndex ?? 0) + 1) + "، الحقل " + (cell.cellIndex + 1);
      }
    }
    if (!label) {
      const fieldsetLegend = nearbyText(control.closest('fieldset')?.querySelector('legend'));
      label = fieldsetLegend;
    }
    if (!label) {
      const knownNames = { dueDate: "تاريخ تسليم الواجب", category: "تصنيف الملاحظة" };
      const type = control.type === "date" ? "التاريخ" : control.type === "number" ? "القيمة الرقمية" : "حقل إدخال";
      label = knownNames[control.name] || control.name || control.id || type;
    }
    control.setAttribute('aria-label', label);
  });
}
// Prevent demo-only workflows from appearing to save data in a connected deployment.
function requireDemoMode() {
  if (window.AWN_CONFIG?.demoMode === true && !window.AWN_CONFIG?.apiBaseUrl) return true;
  const message = "هذه الوظيفة لم تُربط بالخادم بعد، ولم يتم حفظ أي بيانات.";
  if (window.Swal?.fire) window.Swal.fire({ icon: "info", title: "الوظيفة غير متاحة", text: message });
  else window.alert(message);
  return false;
}
function disableDemoOnlyControls() {
  if (window.AWN_CONFIG?.demoMode === true && !window.AWN_CONFIG?.apiBaseUrl) return;
  const selectors = [
    "#feedback-form", "#feedback-list", "#about-form", "#about-edit-btn",
    "#view-daily-plans", "#view-quarterly-plans", "#markAllPresentBtn",
    "#saveAttendanceBtn", ".status-btn",
  ];
  document.querySelectorAll(selectors.join(", ")).forEach((region) => {
    if (region.matches("button, input, select, textarea")) region.disabled = true;
    region.querySelectorAll("button, input, select, textarea").forEach((control) => { control.disabled = true; });
  });
  document.querySelectorAll(".group button").forEach((button) => {
    if (["+1", "-1"].includes(button.textContent.trim())) button.disabled = true;
  });
  const main = document.querySelector("main");
  if (main && !document.getElementById("demo-mode-notice")) {
    const notice = document.createElement("p");
    notice.id = "demo-mode-notice";
    notice.setAttribute("role", "status");
    notice.className = "mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-slate-900";
    notice.textContent = "وضع الربط بالخادم مفعّل. بعض الوظائف التي لم تُربط بعد معطّلة ولن تحفظ بيانات محلية.";
    main.prepend(notice);
  }
}