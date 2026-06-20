import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Line 60: setFiles(Object.fromEntries(Object.entries(files).filter( ...
content = content.replace(/setFiles\(/g, '// setFiles(');

// Chat attachments and references to `files`
content = content.replace(/let count = 0;\n\s*for \(const file of attachments\) \{[\s\S]*?\}\n/m, 
`let count = 0;
    for (const file of attachments) {
      if (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.webp')) continue;
      if (!activeProjectFiles[file.name]) {
         const content = await file.text();
         // we won't mutate state here just parse it
      }
    }
`);

content = content.replace(/const isFileAttached = \(name: string\) => !!files\[name\];/g, 'const isFileAttached = (name: string) => !!activeProjectFiles[name];');
content = content.replace(/files\[name\]/g, 'activeProjectFiles[name]');

// Any remaining generic `files`
content = content.replace(/Object\.keys\(files\)/g, 'Object.keys(activeProjectFiles)');
content = content.replace(/files\[/g, 'activeProjectFiles[');

// `files` passed to extractFileUpdates? No, we don't pass files
// `files` passed in UI
content = content.replace(/\{Object\.keys\(activeProjectFiles\)\.length === 0/g, '{projects.length === 0');
content = content.replace(/activeProjectFiles=\{(.*?)\}/g, ''); // just in case it generated a bad prop

fs.writeFileSync('src/App.tsx', content);
