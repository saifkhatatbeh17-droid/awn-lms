const fs = require('fs');
const html = fs.readFileSync('c:/Users/user/Desktop/project/awn/teacher-dashboard.html', 'utf8');

const i1 = html.indexOf('id="view-dashboard"');
const i2 = html.indexOf('id="view-lesson-plans"');
const between = html.substring(i1, i2);

const lines = between.split('\n');
let depth = 0;
for(let i=0; i<lines.length; i++) {
    const d = (lines[i].match(/<div/g) || []).length;
    const e = (lines[i].match(/<\/div/g) || []).length;
    depth += d;
    depth -= e;
    if (depth < 0) {
        console.log(`Depth went negative (-${depth}) at line ${i}:`);
        console.log(lines[i-2]);
        console.log(lines[i-1]);
        console.log(lines[i]);
        break;
    }
}
console.log("Final depth:", depth);
