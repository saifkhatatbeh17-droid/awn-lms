/**
 * Awn LMS - Centralized Dynamic Navigation Component
 * Handles multi-view switching, active indicator highlighting, user profile display,
 * mobile drawer management, and universal logout across all dashboards.
 */

const ROLE_DISPLAY_NAMES = {
  admin: "مسؤول المنظومة",
  principal: "مدير مدرسة",
  supervisor: "مشرف تربوي",
  teacher: "معلم",
  student: "طالب",
  parent: "ولي أمر",
};

/**
 * Shows one view and hides all others. Highlights the matching sidebar link.
 */
function navigateTo(viewId) {
  if (!viewId) return;
  const targetView = document.getElementById(viewId);
  if (!targetView) return;

  // Toggle all role-based view panels
  const viewPanels = document.querySelectorAll('[id^="view-"], .principal-view, .supervisor-view, .app-view');
  viewPanels.forEach((v) => {
    if (v.id.startsWith("view-") || v.classList.contains("principal-view") || v.classList.contains("supervisor-view") || v.classList.contains("app-view")) {
      v.classList.toggle("hidden", v.id !== viewId);
    }
  });

  // Update sidebar active link states
  document.querySelectorAll("[data-path]").forEach((link) => {
    const active = link.getAttribute("data-path") === viewId;
    link.classList.toggle("bg-primary-50", active);
    link.classList.toggle("text-primary", active);
    link.classList.toggle("font-bold", active);
    link.classList.toggle("text-slate-500", !active);

    const indicator = link.querySelector(".active-indicator");
    if (indicator) indicator.remove();

    if (active) {
      const bar = document.createElement("div");
      bar.className = "active-indicator absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-l-full";
      link.appendChild(bar);
    }
  });

  // Teacher quick actions widget adjustment
  const teacherQuickActions = document.getElementById("teacherQuickActions");
  if (teacherQuickActions) {
    const attendanceIsActive = viewId === "view-attendance";
    teacherQuickActions.classList.toggle("hidden", attendanceIsActive);
    if (attendanceIsActive) {
      const menu = teacherQuickActions.querySelector("#quickActionsMenu");
      if (menu) {
        menu.classList.add("hidden");
        menu.hidden = true;
      }
      teacherQuickActions.querySelector('[data-teacher-action="toggle-quick-actions"]')?.setAttribute("aria-expanded", "false");
    }
  }

  // Update address bar hash smoothly
  try {
    history.replaceState(null, "", "#" + viewId);
  } catch {
    // ignore
  }

  // Auto-close mobile sidebar if open
  closeMobileSidebar();
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && window.matchMedia("(max-width: 1023px)").matches) {
    sidebar.classList.add("translate-x-full");
    overlay?.classList.add("hidden");
  }
}

function openMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar) {
    sidebar.classList.remove("translate-x-full");
    overlay?.classList.remove("hidden");
  }
}

/**
 * Populate current user profile details dynamically
 */
function renderUserProfile() {
  const user = typeof currentUser === "function" ? currentUser() : {};
  if (!user.username) return;

  const displayName = user.name || user.fullName || user.username;
  const roleName = ROLE_DISPLAY_NAMES[user.role] || user.role || "";

  // Update names in headers/sidebars
  document.querySelectorAll("[data-user-name], [data-admin-name]").forEach((el) => {
    el.textContent = displayName;
  });

  // Update role labels
  document.querySelectorAll("[data-user-role]").forEach((el) => {
    el.textContent = roleName;
  });

  // Update user initials avatar if element exists
  document.querySelectorAll("[data-user-initials]").forEach((el) => {
    const parts = displayName.trim().split(/\s+/);
    const initials = parts.slice(0, 2).map((p) => p.charAt(0)).join(".");
    el.textContent = initials || "ع";
  });
}

/**
 * Global logout handler
 */
function handleLogout(e) {
  e?.preventDefault();
  try {
    localStorage.removeItem("awn_session");
  } catch (error) {
    console.warn("Could not clear session storage", error);
  }
  window.location.assign("index.html");
}

/**
 * Initialize dynamic navigation bindings
 */
function initNavigation() {
  renderUserProfile();

  // Attach logout listener
  document.querySelectorAll("[data-logout], [data-admin-logout]").forEach((btn) => {
    btn.removeEventListener("click", handleLogout);
    btn.addEventListener("click", handleLogout);
  });

  // Attach mobile sidebar toggle listener
  document.querySelectorAll('[data-sidebar-toggle], [data-mobile-menu-toggle]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar && sidebar.classList.contains("translate-x-full")) {
        openMobileSidebar();
      } else {
        closeMobileSidebar();
      }
    });
  });

  // Overlay click to close
  document.getElementById("sidebar-overlay")?.addEventListener("click", closeMobileSidebar);

  // Restore view from URL hash on load
  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById(hash)) {
    navigateTo(hash);
  }
}

// Keep existing global aliases working
window.switchView = navigateTo;
window.navigateTo = navigateTo;
window.initNavigation = initNavigation;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  initNavigation();
}
