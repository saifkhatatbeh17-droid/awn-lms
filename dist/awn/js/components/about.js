/**
 * Awn LMS - About View Component
 * Supports reading and editing institutional info with null-safe DOM access and XSS prevention.
 */

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
      <button type="button" id="about-edit-btn" class="mt-4 w-max px-5 py-2 rounded-lg border text-sm font-bold hover:bg-slate-50 transition-colors">تعديل البيانات</button>
    </div>
    <form id="about-form" class="hidden bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 gap-4">
      <input name="schoolName" placeholder="اسم المدرسة / الجهة" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="اسم المدرسة">
      <input name="contactEmail" type="email" placeholder="البريد الإلكتروني" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="البريد الإلكتروني">
      <input name="phone" placeholder="رقم الهاتف" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="رقم الهاتف">
      <textarea name="description" rows="4" placeholder="نبذة عن المدرسة / النظام" class="p-2.5 border border-slate-200 rounded-lg text-sm" aria-label="نبذة عن المدرسة"></textarea>
      <div class="flex gap-2">
        <button type="submit" class="px-5 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">حفظ</button>
        <button type="button" id="about-cancel-btn" class="px-5 py-2 border rounded-lg text-sm hover:bg-slate-50 transition-colors">إلغاء</button>
      </div>
    </form>`;
  main.appendChild(section);
}

// Draws the saved About info using safe DOM construction.
async function renderAbout() {
  const box = document.getElementById("about-view");
  if (!box) return;

  const res = typeof ApiService?.getAbout === "function" ? await ApiService.getAbout() : null;
  const a = { ...ABOUT_DEFAULTS, ...((res && res.success ? res.data : res) || {}) };

  box.innerHTML = "";

  const heading = document.createElement("h2");
  heading.className = "text-lg font-bold text-slate-900";
  heading.textContent = a.schoolName || ABOUT_DEFAULTS.schoolName;

  const desc = document.createElement("p");
  desc.className = "text-sm text-slate-600 leading-relaxed";
  desc.textContent = a.description || ABOUT_DEFAULTS.description;

  const email = document.createElement("p");
  email.className = "text-xs text-slate-500";
  email.textContent = "البريد: " + (a.contactEmail || "—");

  const phone = document.createElement("p");
  phone.className = "text-xs text-slate-500";
  phone.textContent = "الهاتف: " + (a.phone || "—");

  box.appendChild(heading);
  box.appendChild(desc);
  box.appendChild(email);
  box.appendChild(phone);
}

// Switches between read mode and edit mode.
async function openAboutForm(show) {
  const form = document.getElementById("about-form");
  if (!form) return;

  if (show) {
    const res = typeof ApiService?.getAbout === "function" ? await ApiService.getAbout() : null;
    const a = { ...ABOUT_DEFAULTS, ...((res && res.success ? res.data : res) || {}) };
    if (form.schoolName) form.schoolName.value = a.schoolName || "";
    if (form.contactEmail) form.contactEmail.value = a.contactEmail || "";
    if (form.phone) form.phone.value = a.phone || "";
    if (form.description) form.description.value = a.description || "";
  }

  form.classList.toggle("hidden", !show);
  document.getElementById("about-view")?.classList.toggle("hidden", show);
  document.getElementById("about-edit-btn")?.classList.toggle("hidden", show);
}
