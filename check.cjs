const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
let open = 0, close = 0;
for (let char of content) {
  if (char === '{') open++;
  if (char === '}') close++;
}
console.log('open:', open, 'close:', close);
