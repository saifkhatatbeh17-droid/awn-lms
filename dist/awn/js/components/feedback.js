
const CATEGORY_LABELS = {
  employee: "ملاحظة موظف",
  hr: "موارد بشرية",
  complaint: "شكوى",
};

// Creates the feedback view inside <main> if the page doesn't already have it.
function ensureFeedbackView() {
  if (document.getElementById("view-feedback")) return;
  const main = document.querySelector("main");
  if (!main) return;
  const section = document.createElement("div");
  section.id = "view-feedback";
  section.className = "app-view hidden flex flex-col gap-6 w-full";
  section.innerHTML = `
    <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 mb-4">إرسال ملاحظة / شكوى</h2>
      <form id="feedback-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select name="category" class="p-2.5 border border-slate-200 rounded-lg text-sm">
          <option value="employee">ملاحظة من الموظف</option>
          <option value="hr">ملاحظة للموارد البشرية</option>
          <option value="complaint">شكوى</option>
        </select>
        <input name="subject" required placeholder="عنوان الملاحظة" class="p-2.5 border border-slate-200 rounded-lg text-sm">
        <textarea name="message" required rows="4" placeholder="اكتب التفاصيل..." class="md:col-span-2 p-2.5 border border-slate-200 rounded-lg text-sm"></textarea>
        <button type="submit" class="md:col-span-2 w-max px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm">إرسال</button>
      </form>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100 font-bold text-sm">سجل الملاحظات</div>
      <div id="feedback-list" class="divide-y divide-slate-100"></div>
    </div>`;
  main.appendChild(section);
}

// Draws the feedback list with reply and delete buttons.
function renderFeedback() {
  const list = document.getElementById("feedback-list");
  if (!list) return;
  const items = ApiService.getFeedback();
  if (!items.length) {
    list.innerHTML =
      '<p class="p-4 text-sm text-slate-500">لا توجد ملاحظات بعد.</p>';
    return;
  }
  list.innerHTML = items
    .map(
      (f) => `
    <div class="p-4 flex flex-col gap-2" data-feedback-id="${esc(f.id)}">
      <div class="flex items-center justify-between gap-3">
        <div>
          <span class="font-bold text-sm text-slate-800">${esc(f.subject)}</span>
          <span class="text-[10px] mr-2 px-2 py-0.5 rounded bg-slate-100">${esc(CATEGORY_LABELS[f.category] || f.category)}</span>
        </div>
        <span class="text-[10px] font-bold ${f.status === "closed" ? "text-emerald-600" : "text-amber-600"}">
          ${f.status === "closed" ? "مغلقة" : "مفتوحة"}
        </span>
      </div>
      <p class="text-xs text-slate-600">${esc(f.message)}</p>
      ${f.reply ? `<p class="text-xs bg-emerald-50 text-emerald-800 p-2 rounded">الرد: ${esc(f.reply)}</p>` : ""}
      <div class="flex gap-2">
        ${f.status !== "closed" ? '<button type="button" data-action="reply-feedback" class="text-xs px-3 py-1 rounded border">رد</button>' : ""}
        <button type="button" data-action="delete-feedback" class="text-xs px-3 py-1 rounded border text-red-600">حذف</button>
      </div>
    </div>`,
    )
    .join("");
}

