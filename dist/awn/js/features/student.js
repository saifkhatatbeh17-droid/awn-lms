// Draws assignment data in both student views.
async function renderStudentAssignments() {
  const containers = ["student-assignments-container", "student-assignments-page-container"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!containers.length) return;

  try {
    const items = await AssignmentService.list();
    const markup = items.length
      ? items.map((assignment) => {
          const done = assignment.status === "completed";
          return `
            <label class="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer ${done ? "opacity-50" : ""}">
              <input type="checkbox" class="mt-1 w-4 h-4" data-assignment-id="${esc(assignment.id)}" ${done ? "checked" : ""}>
              <span class="flex flex-col">
                <span class="text-sm font-bold ${done ? "line-through text-slate-500" : "text-slate-800"}">${esc(assignment.title)}</span>
                <span class="text-xs text-slate-500">${esc(assignment.subject)} • تسليم: ${esc(assignment.dueDate)}</span>
              </span>
            </label>`;
        }).join("")
      : '<p class="text-sm text-slate-500 p-3">لا توجد واجبات حالياً.</p>';
    containers.forEach((container) => { container.innerHTML = markup; });
  } catch (error) {
    console.error("Could not load assignments", error);
    containers.forEach((container) => {
      container.textContent = "تعذر تحميل الواجبات. حدّث الصفحة أو أعد المحاولة.";
    });
  }
}