const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'user', 'Desktop', 'project', 'awn', 'teacher-dashboard.html');
let html = fs.readFileSync(file, 'utf8');

// Completely remove ALL Assignment Creation blocks
html = html.replace(/\s*<!-- Assignment Creation -->[\s\S]*?<\/form>\s*<\/div>/g, '');

const assignmentHtml = `
          <!-- Assignment Creation -->
          <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mt-6">
            <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">assignment_add</span>
              إضافة واجب جديد
            </h3>
            <form id="add-assignment-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="title" required placeholder="عنوان الواجب (مثال: حل أسئلة الفصل)" class="p-2.5 border border-slate-200 rounded-lg text-sm">
              <input name="subject" required placeholder="المادة (مثال: رياضيات)" class="p-2.5 border border-slate-200 rounded-lg text-sm">
              <input name="dueDate" type="date" required class="p-2.5 border border-slate-200 rounded-lg text-sm text-slate-500">
              <div class="md:col-span-2 flex justify-end">
                <button type="submit" class="px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-sm hover:bg-opacity-90 transition-all">إرسال الواجب</button>
              </div>
            </form>
          </div>`;

// Insert ONE instance exactly after the Welcome Hero section inside view-dashboard
html = html.replace(/(<section[^>]*>[\s\S]*?<\/section>)/, match => {
    return match + assignmentHtml;
});

fs.writeFileSync(file, html, 'utf8');
console.log("Cleaned and injected via node.");
