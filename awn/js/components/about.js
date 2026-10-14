
const ABOUT_DEFAULTS = {
  schoolName: "منصة عون التعليمية",
  contactEmail: "",
  phone: "",
  description: "المنظومة الوطنية لإدارة التعليم في المملكة الأردنية الهاشمية.",
};

// Creates the About view (read mode + edit form) if the page doesn't have it.
function ensureAboutView() {
  if (document.getElementById("view-about")) return;
  const main = document.querySelector("main");
  if (!main) return;
  const section = document.createElement("div");
  section.id = "view-about";
  section.className = "app-view hidden flex flex-col gap-6 w-full";
  section.innerHTML = `
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div id="about-view" class="flex flex-col gap-3"></div>
      <button type="button" id="about-edit-btn" class="mt-4 w-max px-5 py-2 rounded-lg border text-sm font-bold">تعديل</button>
    </div>
    <form id="about-form" class="hidden bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 gap-4">
      <input name="schoolName" placeholder="اسم المدرسة / الجهة" class="p-2.5 border border-slate-200 rounded-lg text-sm">
      <input name="contactEmail" type="email" placeholder="البريد الإلكتروني" class="p-2.5 border border-slate-200 rounded-lg text-sm">
      <input name="phone" placeholder="رقم الهاتف" class="p-2.5 border border-slate-200 rounded-lg text-sm">
      <textarea name="description" rows="4" placeholder="نبذة عن المدرسة / النظام" class="p-2.5 border border-slate-200 rounded-lg text-sm"></textarea>
      <div class="flex gap-2">
        <button type="submit" class="px-5 py-2 bg-primary text-white rounded-lg font-bold text-sm">حفظ</button>
        <button type="button" id="about-cancel-btn" class="px-5 py-2 border rounded-lg text-sm">إلغاء</button>
      </div>
    </form>`;
  main.appendChild(section);
}

// Draws the saved About info, falling back to defaults.
function renderAbout() {
  const box = document.getElementById("about-view");
  if (!box) return;
  const a = { ...ABOUT_DEFAULTS, ...(ApiService.getAbout() || {}) };
  box.innerHTML = `
    <h2 class="text-lg font-bold text-slate-900">${esc(a.schoolName)}</h2>
    <p class="text-sm text-slate-600">${esc(a.description)}</p>
    <p class="text-xs text-slate-500">البريد: ${esc(a.contactEmail || "—")}</p>
    <p class="text-xs text-slate-500">الهاتف: ${esc(a.phone || "—")}</p>`;
}

// Switches between read mode and edit mode. Fills the form with saved values when editing.
function openAboutForm(show) {
  const form = document.getElementById("about-form");
  if (!form) return;
  if (show) {
    const a = { ...ABOUT_DEFAULTS, ...(ApiService.getAbout() || {}) };
    form.schoolName.value = a.schoolName;
    form.contactEmail.value = a.contactEmail;
    form.phone.value = a.phone;
    form.description.value = a.description;
  }
  form.classList.toggle("hidden", !show);
  document.getElementById("about-view").classList.toggle("hidden", show);
  document.getElementById("about-edit-btn").classList.toggle("hidden", show);
}

