import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. setFiles({ ...files, ... }); -> replace to push into activeProject
// Line 60: setFiles(Object.fromEntries(Object.entries(files).filter(k => k... 
content = content.replace(
  /setFiles\(Object\.fromEntries\(Object\.entries\(files\)\.filter\(\(\[k\]\) => !k\.startsWith\('\.'\)\)\)\);/,
  `if (activeProjectId) {
      setProjects(prev => {
         const updated = [...prev];
         const pIdx = updated.findIndex(p => p.id === activeProjectId);
         if (pIdx > -1) {
            updated[pIdx] = { ...updated[pIdx] };
            updated[pIdx].files = Object.fromEntries(Object.entries(updated[pIdx].files).filter(([k]) => !k.startsWith('.')));
            saveCurrentProject(updated);
         }
         return updated;
      });
  }`
);

// 2. handleZipUpload, handleFolderUpload, handleMultiFileUpload had `setFiles(newFiles)` which was replaced but still left in some places?
// Let's replace setFiles(newFiles) and setFiles(addedFiles) in App.tsx
content = content.replace(/setFiles\(newFiles\);\n\s*await saveCurrentProject\(newFiles\);/g, `targetProject.files = newFiles;\n      setProjects(updatedProjects);\n      await saveCurrentProject(updatedProjects);`);
content = content.replace(/setFiles\(addedFiles\);\n\s*await saveCurrentProject\(addedFiles\);/g, `targetProject.files = addedFiles;\n      setProjects(updatedProjects);\n      await saveCurrentProject(updatedProjects);`);

// 3. handleDownload
content = content.replace(/zipProject\(files\)/g, 'zipProject(activeProjectFiles)');

// 4. handleRevert
content = content.replace(/setFiles\(backup\);\n\s*await saveCurrentProject\(backup\);/g, `if (activeProjectId) {
  setProjects(prev => {
     const updated = [...prev];
     const pIdx = updated.findIndex(p => p.id === activeProjectId);
     if (pIdx > -1) {
       updated[pIdx] = { ...updated[pIdx], files: backup };
       saveCurrentProject(updated);
     }
     return updated;
  });
}`);

content = content.replace(/files\[filePath\]/g, 'activeProjectFiles[filePath]');

content = content.replace(/setFiles\(prev => \(\{ \.\.\.prev,/g, `if (activeProjectId) {
  setProjects(prev => {
     const updated = [...prev];
     const pIdx = updated.findIndex(p => p.id === activeProjectId);
     if (pIdx > -1) {
       updated[pIdx] = { ...updated[pIdx], files: { ...updated[pIdx].files,`
);
content = content.replace(/\}\}\)\);/g, `}
         saveCurrentProject(updated);
       }
       return updated;
  });
}`);

// AI apply updates using JSZip
// "const newZip = await applyAIUpdatesUsingJSZip(files, updates);"
content = content.replace(/const newZip = await applyAIUpdatesUsingJSZip\(files, updates\);/g, 'const newZip = await applyAIUpdatesUsingJSZip(activeProjectFiles, updates);');

// "setFiles({...files})
content = content.replace(/setFiles\(prev\* =>/g, `setProjects(prev => ...`); // handled specifically
content = content.replace(/setFiles\(prevFiles => \{/g, `setProjects(prev => {
     const updated = [...prev];
     const pIdx = updated.findIndex(p => p.id === activeProjectId);
     if (pIdx > -1) {
       let prevFiles = updated[pIdx].files;
`);
content = content.replace(/return \{ \.\.\.prevFiles, \[path\]: /g, `updated[pIdx].files = { ...prevFiles, [path]: `);
content = content.replace(/\} \}\);/g, '} saveCurrentProject(updated); } return updated; });');

content = content.replace(/Object\.entries\(files\)/g, 'Object.entries(activeProjectFiles)');
content = content.replace(/const activeFileNode = files\[activeFile\.path\];/g, 'const activeFileNode = activeFile && activeProjectFiles[activeFile.path];');

content = content.replace(/<ChatInput([\s\S]*?)files=\{files\}/g, '<ChatInput$1files={activeProjectFiles}');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx refactor phase 4 applied');
