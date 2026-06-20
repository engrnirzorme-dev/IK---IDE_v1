import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will write a custom replace logic for setFiles using projects.
// Instead of messing with AST, let me rewrite the functions entirely using string matching of their bodies.

// 1. handleFileChange
content = content.replace(
  /const handleFileChange = \(path: string, newContent: string\) => \{([\s\S]*?)^\s*\};\n/m,
  `const handleFileChange = (path: string, newContent: string) => {
    if (!activeProjectId) return;
    setProjects(prev => {
      const updated = [...prev];
      const pIdx = updated.findIndex(p => p.id === activeProjectId);
      if (pIdx > -1) {
        updated[pIdx] = { ...updated[pIdx] };
        updated[pIdx].files = { ...updated[pIdx].files, [path]: { ...updated[pIdx].files[path], content: newContent }};
        saveCurrentProject(updated);
      }
      return updated;
    });
  };
`
);

// 2. handleFileRename
content = content.replace(
  /const handleFileRename = \(oldPath: string, newPath: string\) => \{([\s\S]*?)^\s*\};\n/m,
  `const handleFileRename = (oldPath: string, newPath: string) => {
    if (!activeProjectId) return;
    if (activeProjectFiles[newPath]) {
      addToast('A file/folder with that name already exists', 'error');
      return;
    }
    setProjects(prev => {
      const updated = [...prev];
      const pIdx = updated.findIndex(p => p.id === activeProjectId);
      if (pIdx > -1) {
        updated[pIdx] = { ...updated[pIdx] };
        const newFiles = { ...updated[pIdx].files };
        for (const key of Object.keys(newFiles)) {
           if (key === oldPath) {
              const node = newFiles[oldPath];
              delete newFiles[oldPath];
              newFiles[newPath] = { ...node, path: newPath, name: newPath.split('/').pop() || '' };
           } else if (key.startsWith(oldPath + '/')) {
              const newChildPath = newPath + key.substring(oldPath.length);
              const childNode = newFiles[key];
              delete newFiles[key];
              newFiles[newChildPath] = { ...childNode, path: newChildPath, name: newChildPath.split('/').pop() || '' };
           }
        }
        updated[pIdx].files = newFiles;
        saveCurrentProject(updated);
      }
      return updated;
    });
    if (activeFile && (activeFile.path === oldPath || activeFile.path.startsWith(oldPath + '/'))) {
       setActiveFile({ projectId: activeProjectId, path: activeFile.path.replace(oldPath, newPath) });
    }
  };
`
);

// 3. handleFileDelete
content = content.replace(
  /const handleFileDelete = \(path: string\) => \{([\s\S]*?)^\s*\};\n/m,
  `const handleFileDelete = (path: string) => {
    if (!activeProjectId) return;
    if (!confirm(\`Are you sure you want to delete \${path}?\`)) return;
    setProjects(prev => {
      const updated = [...prev];
      const pIdx = updated.findIndex(p => p.id === activeProjectId);
      if (pIdx > -1) {
        updated[pIdx] = { ...updated[pIdx] };
        const newFiles = { ...updated[pIdx].files };
        for (const key of Object.keys(newFiles)) {
           if (key === path || key.startsWith(path + '/')) {
              delete newFiles[key];
           }
        }
        updated[pIdx].files = newFiles;
        saveCurrentProject(updated);
      }
      return updated;
    });
    if (activeFile && (activeFile.path === path || activeFile.path.startsWith(path + '/'))) setActiveFile(null);
  };
`
);

// 4. handleNewProject
content = content.replace(
  /const handleNewProject = \(name: string\) => \{([\s\S]*?)^\s*\};\n/m,
  `const handleNewProject = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z0-9_\\-\\s]/g, '').trim();
    if (!cleanName) return;

    setProjects(prev => {
      const updated = [...prev];
      // Deselect others
      updated.forEach(p => p.isActive = false);
      updated.push({
        id: \`proj_\${Date.now()}\`,
        name: cleanName,
        isOpen: true,
        isActive: true,
        files: {}
      });
      saveCurrentProject(updated);
      return updated;
    });
    addToast(\`Project \${cleanName} created.\`, 'success');
  };
`
);

// 5. handleToggleAIExclusion
content = content.replace(
  /const handleToggleAIExclusion = \(path: string, exclude: boolean, isFolder: boolean\) => \{([\s\S]*?)^\s*\};\n/m,
  `const handleToggleAIExclusion = (path: string, exclude: boolean, isFolder: boolean) => {
    if (!activeProjectId) return;
    setProjects(prev => {
      const updated = [...prev];
      const pIdx = updated.findIndex(p => p.id === activeProjectId);
      if (pIdx > -1) {
        updated[pIdx] = { ...updated[pIdx] };
        const newFiles = { ...updated[pIdx].files };
        if (isFolder) {
          for (const key of Object.keys(newFiles)) {
            if (key.startsWith(path + '/') || key === path) {
              newFiles[key] = { ...newFiles[key], isAIExcluded: exclude };
            }
          }
        } else {
          if (newFiles[path]) newFiles[path] = { ...newFiles[path], isAIExcluded: exclude };
        }
        updated[pIdx].files = newFiles;
        saveCurrentProject(updated);
      }
      return updated;
    });
  };
`
);

// 6. handleBulkToggleAIExclusion
content = content.replace(
  /const handleBulkToggleAIExclusion = \(exclude: boolean\) => \{([\s\S]*?)^\s*\};\n/m,
  `const handleBulkToggleAIExclusion = (exclude: boolean) => {
    if (!activeProjectId) return;
    setProjects(prev => {
      const updated = [...prev];
      const pIdx = updated.findIndex(p => p.id === activeProjectId);
      if (pIdx > -1) {
        updated[pIdx] = { ...updated[pIdx] };
        const newFiles = { ...updated[pIdx].files };
        for (const key of Object.keys(newFiles)) {
           newFiles[key] = { ...newFiles[key], isAIExcluded: exclude };
        }
        updated[pIdx].files = newFiles;
        saveCurrentProject(updated);
      }
      return updated;
    });
  };
`
);


// 7. Change Sidebar rendering
content = content.replace(
  /<Sidebar([\s\S]*?)\/>/,
  `<Sidebar 
          projects={projects}
          onSelectProject={(id) => {
            setProjects(prev => prev.map(p => ({ ...p, isActive: p.id === id, isOpen: p.id === id ? true : p.isOpen })));
          }}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          onSelect={(path) => {
            if(activeProjectId) setActiveFile({ projectId: activeProjectId, path });
            if (window.innerWidth < 768) setSidebarOpen(false);
          }}
          onRename={handleFileRename}
          onDelete={handleFileDelete}
          onToggleAIExclusion={handleToggleAIExclusion}
          onBulkToggleAIExclusion={handleBulkToggleAIExclusion}
          activePath={activeFile?.path || null}
          activeProject={activeProjectId}
          onNewProject={() => setShowNewProjectModal(true)}
          onUploadToFolder={(path) => {
            setUploadTarget(path);
            setShowUploadModal(true);
          }}
        />`
);

// Change `files` to `activeProjectFiles` in the main UI
content = content.replace(/Object\.keys\(files\)\.length === 0/g, 'projects.length === 0');
content = content.replace(/files\[activeFile\]/g, 'activeProjectFiles[activeFile?.path || ""]');
content = content.replace(/Object\.keys\(files\)\.reduce/g, 'Object.keys(activeProjectFiles).reduce');

fs.writeFileSync('src/App.tsx', content);
console.log('Refactor 3 applied');
