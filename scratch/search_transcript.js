const fs = require('fs');
const readline = require('readline');

async function search() {
    const fileStream = fs.createReadStream('C:/Users/user/.gemini/antigravity/brain/1ec7dd59-c833-411d-9b79-d46f590284f2/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let maxLen = 0;
    let bestMatch = '';

    for await (const line of rl) {
        if (line.includes('teacher-dashboard.html')) {
            const obj = JSON.parse(line);
            
            // Check tool_calls (maybe I wrote the whole file?)
            if (obj.tool_calls) {
                for (const call of obj.tool_calls) {
                    if (call.function && call.function.arguments) {
                        const args = call.function.arguments;
                        if (args.includes('teacher-dashboard.html') && args.includes('الخطة الفصلية') && !args.includes('?????')) {
                            if (args.length > maxLen) {
                                maxLen = args.length;
                                bestMatch = args;
                            }
                        }
                    }
                }
            }
            // Check content (tool responses)
            if (obj.content) {
                const content = obj.content;
                if (content.includes('teacher-dashboard.html') && content.includes('الخطة الفصلية') && !content.includes('?????')) {
                     if (content.length > maxLen) {
                         maxLen = content.length;
                         bestMatch = content;
                     }
                }
            }
        }
    }
    console.log("Max length found with Arabic:", maxLen);
    if (maxLen > 0) {
        fs.writeFileSync('c:/Users/user/Desktop/project/scratch/best_match.txt', bestMatch);
    }
}
search();
