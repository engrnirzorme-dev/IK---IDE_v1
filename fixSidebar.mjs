import fs from 'fs';
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
content = content.replace(/\\\$/g, '$').replace(/\\`/g, '`');
fs.writeFileSync('src/components/Sidebar.tsx', content);
