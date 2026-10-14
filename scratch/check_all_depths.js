const fs = require('fs');
const file = 'c:/Users/user/Desktop/project/awn/teacher-dashboard.html';
const html = fs.readFileSync(file, 'utf8');

const views = ['view-lesson-plans', 'view-daily-plans', 'view-attendance', 'view-grades', 'view-students', 'view-schedule'];
const i1 = html.indexOf('id="view-dashboard"');

for (const v of views) {
    const i2 = html.indexOf(`id="${v}"`);
    if (i2 === -1) {
        console.log(v, 'not found');
        continue;
    }
    const between = html.substring(i1, i2);
    const divs = (between.match(/<div/g) || []).length;
    const endDivs = (between.match(/<\/div/g) || []).length;
    console.log(v, 'Depth:', divs - endDivs);
}
