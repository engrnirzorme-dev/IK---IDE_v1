import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Line 588 and 599: Replace remaining 'files' variable usage in AI patching block
content = content.replace(/await saveBackup\(files\);/g, 'await saveBackup(activeProjectFiles);');
content = content.replace(/applyAIUpdatesUsingJSZip\(files,/g, 'applyAIUpdatesUsingJSZip(activeProjectFiles,');

// Line 380: activeProjectFiles
content = content.replace(/updated\[pIdx\]\.activeProjectFiles\[path\]/g, 'updated[pIdx].files[path]');

// I will also fix applyAIUpdatesUsingJSZip returning `nextFiles`
// Let's see how setProjects was generated around 600
content = content.replace(/saveCurrentProject\(\{ \.\.\.activeProjectFiles \}\)/g, ''); // just in case I messed it up somewhere?

fs.writeFileSync('src/App.tsx', content);
