const fs = require('fs');
const html = fs.readFileSync('c:/Users/user/Desktop/project/awn/teacher-dashboard.html', 'utf8');

const { JSDOM } = require('jsdom');
const dom = new JSDOM(html);
const doc = dom.window.document;

console.log("Main exists:", !!doc.querySelector('main'));
console.log("Main children:");
Array.from(doc.querySelector('main').children).forEach(child => {
    console.log(` - ${child.tagName} id=${child.id} class=${child.className}`);
});

console.log("Views:");
doc.querySelectorAll('[id^="view-"]').forEach(v => {
    console.log(` - ${v.id} (display: ${v.style.display}, hidden: ${v.classList.contains('hidden')}, parent: ${v.parentElement.tagName})`);
});
