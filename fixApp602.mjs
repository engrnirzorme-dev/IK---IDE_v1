import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/await saveCurrentProject\(nextFiles\);/g, `
        if (activeProjectId) {
           setProjects(prev => {
              const updated = [...prev];
              const pIdx = updated.findIndex(p => p.id === activeProjectId);
              if (pIdx > -1) {
                 updated[pIdx] = { ...updated[pIdx], files: nextFiles };
                 saveCurrentProject(updated).catch(console.error);
              }
              return updated;
           });
        }
`);

fs.writeFileSync('src/App.tsx', content);
