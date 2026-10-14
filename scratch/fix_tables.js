const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'user', 'Desktop', 'project', 'awn', 'teacher-dashboard.html');
let html = fs.readFileSync(file, 'utf8');

// 1. Remove all divide-* from thead, tbody, tr
html = html.replace(/divide-x-2/g, '');
html = html.replace(/divide-x-reverse/g, '');
html = html.replace(/divide-y-2/g, '');
html = html.replace(/divide-black/g, '');
html = html.replace(/divide-x/g, '');
html = html.replace(/divide-y/g, '');

// 2. Add border border-black to all th and td in the document
// To be safe, we only want to target th and td inside the teacher-dashboard that don't already have borders.
// Actually, it's easier to just do a global replace for <th class=" and <td class="
html = html.replace(/<th\s+([^>]*)class="([^"]*)"/g, (match, beforeClass, classList) => {
    if (!classList.includes('border')) {
        return `<th ${beforeClass}class="${classList} border border-black"`;
    }
    return match;
});

html = html.replace(/<th\s*>/g, '<th class="border border-black">');
html = html.replace(/<th\s+rowspan="([^"]*)"\s+class="([^"]*)"/g, (match, rowspan, classList) => {
    if (!classList.includes('border')) {
        return `<th rowspan="${rowspan}" class="${classList} border border-black"`;
    }
    return match;
});
html = html.replace(/<th\s+colspan="([^"]*)"\s+class="([^"]*)"/g, (match, colspan, classList) => {
    if (!classList.includes('border')) {
        return `<th colspan="${colspan}" class="${classList} border border-black"`;
    }
    return match;
});

html = html.replace(/<td\s+([^>]*)class="([^"]*)"/g, (match, beforeClass, classList) => {
    if (!classList.includes('border')) {
        return `<td ${beforeClass}class="${classList} border border-black"`;
    }
    return match;
});

html = html.replace(/<td\s*>/g, '<td class="border border-black">');

// 3. One edge case: In standard Tailwind, `border-collapse` requires `border` on cells. 
// The tables have `border-collapse`, so adding `border border-black` to `th` and `td` will perfectly render a solid grid without overlaps.

// 4. The user also said "الخطة الفصلة أو اليومة مداخلة". Maybe the inputs are overlapping because they have fixed widths?
// Let's ensure inputs inside the tables have `w-full` and `min-w-[50px]` so they don't force overlap.
html = html.replace(/<input\s+class="w-full text-center font-bold border-0 bg-transparent p-0 focus:ring-0"/g, 
                   '<input class="w-full min-w-[50px] text-center font-bold border-0 bg-transparent p-0 focus:ring-0"');

fs.writeFileSync(file, html, 'utf8');
console.log("Table borders fixed in teacher dashboard.");
