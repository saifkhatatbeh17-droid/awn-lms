const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'user', 'Desktop', 'project', 'awn', 'teacher-dashboard.html');
let html = fs.readFileSync(file, 'utf8');

// Restore divide-y where it was meant for normal lists (slate-100 or slate-200)
html = html.replace(/class="([^"]*)divide-slate-100/g, 'class="$1divide-y divide-slate-100');
html = html.replace(/class="([^"]*)divide-slate-200/g, 'class="$1divide-y divide-slate-200');

// Clean up extra spaces
html = html.replace(/class="\s+/g, 'class="');

fs.writeFileSync(file, html, 'utf8');
console.log("Restored list dividers.");
