
// Shows one view and hides all others. Highlights the matching sidebar link.
function navigateTo(viewId) {
  if (!document.getElementById(viewId)) return;
  document.querySelectorAll('[id^="view-"]').forEach((v) => {
    v.classList.toggle("hidden", v.id !== viewId);
  });
  document.querySelectorAll("[data-path]").forEach((link) => {
    const active = link.getAttribute("data-path") === viewId;
    link.classList.toggle("bg-primary-50", active);
    link.classList.toggle("text-primary", active);
    link.classList.toggle("font-semibold", active);
  });
  history.replaceState(null, "", "#" + viewId);
}
// Keeps existing onclick="switchView(...)" attributes working.
window.switchView = navigateTo;

