/**
 * Awn LMS - Feedback Component
 * Implements form validation, XSS prevention via textContent, and responsive UI feedback.
 */

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
      <div id="feedback-form-alert" class="hidden mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200" role="alert"></div>
      <form id="feedback-form" class="grid grid-cols-1 md:grid-cols-2 gap-4" novalidate>
        <select name="category" class="p-2.5 border border-slate-200 rounded-lg text-sm" required aria-label="نوع الملاحظة">
          <option value="employee">ملاحظة من الموظف</option>
          <option value="hr">ملاحظة للموارد البشرية</option>
          <option value="complaint">شكوى</option>
        </select>
        <input name="subject" required minlength="3" placeholder="عنوان الملاحظة" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="عنوان الملاحظة">
        <textarea name="message" required minlength="5" rows="4" placeholder="اكتب التفاصيل..." class="md:col-span-2 p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="تفاصيل الملاحظة"></textarea>
        <button type="submit" class="md:col-span-2 w-max px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">إرسال الملاحظة</button>
      </form>
    </div>
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100 font-bold text-sm">سجل الملاحظات</div>
      <div id="feedback-list" class="divide-y divide-slate-100"></div>
    </div>`;
  main.appendChild(section);
}

// Draws the feedback list with safe DOM elements using textContent to prevent XSS.
async function renderFeedback() {
  const list = document.getElementById("feedback-list");
  if (!list) return;

  const res = typeof ApiService?.getFeedback === "function" ? await ApiService.getFeedback() : null;
  const items = res?.success ? res.data : (Array.isArray(res) ? res : []);

  list.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "p-4 text-sm text-slate-500";
    empty.textContent = "لا توجد ملاحظات بعد.";
    list.appendChild(empty);
    return;
  }

  items.forEach((f) => {
    const card = document.createElement("div");
    card.className = "p-4 flex flex-col gap-2";
    card.dataset.feedbackId = String(f.id || "");

    const header = document.createElement("div");
    header.className = "flex items-center justify-between gap-3";

    const titleGroup = document.createElement("div");
    titleGroup.className = "flex items-center";

    const subjectSpan = document.createElement("span");
    subjectSpan.className = "font-bold text-sm text-slate-800";
    subjectSpan.textContent = String(f.subject || "");

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "text-[10px] mr-2 px-2 py-0.5 rounded bg-slate-100 text-slate-700";
    categoryBadge.textContent = CATEGORY_LABELS[f.category] || f.category || "عام";

    titleGroup.appendChild(subjectSpan);
    titleGroup.appendChild(categoryBadge);

    const statusBadge = document.createElement("span");
    const isClosed = f.status === "closed";
    statusBadge.className = `text-[10px] font-bold ${isClosed ? "text-emerald-600" : "text-amber-600"}`;
    statusBadge.textContent = isClosed ? "مغلقة" : "مفتوحة";

    header.appendChild(titleGroup);
    header.appendChild(statusBadge);

    const messageP = document.createElement("p");
    messageP.className = "text-xs text-slate-600 leading-relaxed";
    messageP.textContent = String(f.message || "");

    card.appendChild(header);
    card.appendChild(messageP);

    if (f.reply) {
      const replyBox = document.createElement("p");
      replyBox.className = "text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-100";
      replyBox.textContent = "الرد: " + String(f.reply);
      card.appendChild(replyBox);
    }

    const actions = document.createElement("div");
    actions.className = "flex gap-2 mt-1";

    if (!isClosed) {
      const replyBtn = document.createElement("button");
      replyBtn.type = "button";
      replyBtn.dataset.action = "reply-feedback";
      replyBtn.className = "text-xs px-3 py-1 rounded border hover:bg-slate-50 transition-colors";
      replyBtn.textContent = "رد";
      actions.appendChild(replyBtn);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.dataset.action = "delete-feedback";
    deleteBtn.className = "text-xs px-3 py-1 rounded border text-red-600 hover:bg-red-50 transition-colors";
    deleteBtn.textContent = "حذف";
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    list.appendChild(card);
  });
}
