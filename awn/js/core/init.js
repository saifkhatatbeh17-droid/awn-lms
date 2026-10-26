// Initializes the views present on the current role dashboard.
  document.addEventListener("DOMContentLoaded", async () => {
    await AwnSession.ready;
    if (!requireDashboardRole()) return;
    if (typeof ensureFeedbackView === "function") ensureFeedbackView();
    if (typeof ensureAboutView === "function") ensureAboutView();

    try {
      if (typeof renderStudentAssignments === "function") {
        await renderStudentAssignments();
      }
    } catch (error) {
      console.error("Could not initialize assignments", error);
    }

    const initializers = [
      ["parent notifications", typeof renderParentNotifications === "function" ? renderParentNotifications : null],
      ["feedback", typeof renderFeedback === "function" ? renderFeedback : null],
      ["about", typeof renderAbout === "function" ? renderAbout : null],
      ["attendance", typeof renderAttendance === "function" ? renderAttendance : null],
    ];

    for (const [label, render] of initializers) {
      if (typeof render === "function") {
        try {
          await render();
        } catch (error) {
          console.error("Could not initialize " + label, error);
        }
      }
    }

    AwnUI.enhance();
    if (typeof ensureAccessibleNames === "function") ensureAccessibleNames(document);
    if (typeof disableDemoOnlyControls === "function") disableDemoOnlyControls();

    try {
      if (typeof ApiService?.getDailyPlan === "function" && document.getElementById("subjectField")) {
        const planRes = await ApiService.getDailyPlan();
        const plan = planRes?.success ? planRes.data : planRes;
        if (plan && typeof fillDailyPlan === "function") fillDailyPlan(plan);
      }
      if (typeof ApiService?.getQuarterlyPlan === "function" && document.getElementById("plan-tbody")) {
        const qRes = await ApiService.getQuarterlyPlan();
        const quarterly = qRes?.success ? qRes.data : qRes;
        if (quarterly && typeof fillQuarterlyPlan === "function") fillQuarterlyPlan(quarterly);
      }
    } catch (error) {
      console.error("Could not restore saved plans", error);
    }

    const hash = location.hash.slice(1);
    if (hash && typeof navigateTo === "function") navigateTo(hash);
  });
