const fs = require('fs');
const file = 'c:/Users/user/Desktop/project/awn/teacher-dashboard.html';
let html = fs.readFileSync(file, 'utf8');

const i1 = html.indexOf('id="view-dashboard"');
let i2 = html.indexOf('<!-- ===================================== -->\n        <!-- VIEW 2: LESSON PLANS');

// If we can't find that exact string, find something close
if (i2 === -1) {
    i2 = html.indexOf('id="view-lesson-plans"');
}

let before = html.substring(0, i1);
let between = html.substring(i1, i2);
let after = html.substring(i2);

// Remove all trailing </div> from between (ignoring whitespace)
while (between.trim().endsWith('</div>')) {
    between = between.trim();
    between = between.substring(0, between.length - 6);
}

// Now count depth
const divs = (between.match(/<div/g) || []).length;
const endDivs = (between.match(/<\/div/g) || []).length;
const missing = divs - endDivs;

console.log('Needs', missing, 'closing divs');

if (missing > 0) {
    between = between + '\n' + '</div>\n'.repeat(missing);
} else if (missing < 0) {
    console.log("FATAL ERROR: missing < 0");
}

html = before + between + after;
fs.writeFileSync(file, html, 'utf8');
