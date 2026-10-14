 // Initializes the views present on the current role dashboard.
if (!requireDashboardRole()) {
  window.location.replace("index.html");
} else {
  document.addEventListener("DOMContentLoaded", async () => {
    ensureFeedbackView();
    ensureAboutView();

    try {
      await renderStudentAssignments();
    } catch (error) {
      console.error("Could not initialize assignments", error);
    }

    for (const [label, render] of [
      ["parent notifications", renderParentNotifications],
      ["feedback", renderFeedback],
      ["about", renderAbout],
      ["attendance", renderAttendance],
    ]) {
      try {
        render();
      } catch (error) {
        console.error("Could not initialize " + label, error);
      }
    }

    ensureAccessibleNames(document);
    disableDemoOnlyControls();

    try {
      const plan = ApiService.getDailyPlan();
      if (plan && document.getElementById("subjectField")) fillDailyPlan(plan);
      const quarterly = ApiService.getQuarterlyPlan();
      if (quarterly) fillQuarterlyPlan(quarterly);
    } catch (error) {
      console.error("Could not restore saved plans", error);
    }

    const hash = location.hash.slice(1);
    if (hash) navigateTo(hash);
  });
}