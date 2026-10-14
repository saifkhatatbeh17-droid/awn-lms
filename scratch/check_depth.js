const fs = require('fs');
const file = 'c:/Users/user/Desktop/project/awn/teacher-dashboard.html';
const html = fs.readFileSync(file, 'utf8');

const i1 = html.indexOf('id="view-dashboard"');
const i2 = html.indexOf('id="view-lesson-plans"');
const between = html.substring(i1, i2);

const divs = (between.match(/<div/g) || []).length;
const endDivs = (between.match(/<\/div/g) || []).length;
console.log('Depth:', divs - endDivs);
