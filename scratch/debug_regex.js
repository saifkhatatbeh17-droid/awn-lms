const fs = require('fs');
const html = fs.readFileSync('c:/Users/user/Desktop/project/awn/teacher-dashboard.html', 'utf8');
const mainStr = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
if (mainStr) {
    const mainContent = mainStr[1];
    const views = mainContent.match(/id="view-[^"]+"/g);
    console.log("Found views in main:", views);
} else {
    console.log("No main tag found!");
}
