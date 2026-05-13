const fs = require('fs');
const content = fs.readFileSync('apps/worker/.env', 'utf8');
console.log('Raw Content:', JSON.stringify(content));
const match = content.match(/GEMINI_API_KEY=(.+)/);
if (match) {
  console.log('Match:', JSON.stringify(match[1]));
}
