import fs from 'fs';

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// handleZipUpload
appCode = appCode.replace(
  /const newFiles = \{ \.\.\.files \};/g,
  `const targetProjectId = activeProjectId || \`proj_\${Date.now()}\`;\n      const projIdx = projects.findIndex(p => p.id === targetProjectId);\n      let updatedProjects = [...projects];\n      let targetProject = projIdx > -1 ? updatedProjects[projIdx] : { id: targetProjectId, name: uploadTarget || 'New Project', isOpen: true, isActive: true, files: {} };\n      if (projIdx === -1) updatedProjects.push(targetProject);\n      \n      const newFiles = { ...targetProject.files };`
);

appCode = appCode.replace(
  /setFiles\(newFiles\);\n\s*saveCurrentProject\(newFiles\);\n\s*addToast\(\`Project \$\{cleanName\} created\.\`, 'success'\);\n\s*setShowNewProjectModal\(false\);/g,
  `// Replaced`
);

appCode = appCode.replace(
  /const newFiles: Record<string, FileNode> = \{ \.\.\.files \};/g,
  `const targetProjectId = activeProjectId || \`proj_\${Date.now()}\`;\n      const projIdx = projects.findIndex(p => p.id === targetProjectId);\n      let updatedProjects = [...projects];\n      let targetProject = projIdx > -1 ? updatedProjects[projIdx] : { id: targetProjectId, name: uploadTarget || 'New Project', isOpen: true, isActive: true, files: {} };\n      if (projIdx === -1) updatedProjects.push(targetProject);\n      \n      const newFiles = { ...targetProject.files };`
);

appCode = appCode.replace(
  /const addedFiles: Record<string, FileNode> = \{ \.\.\.files \};/g,
  `const targetProjectId = activeProjectId || \`proj_\${Date.now()}\`;\n      const projIdx = projects.findIndex(p => p.id === targetProjectId);\n      let updatedProjects = [...projects];\n      let targetProject = projIdx > -1 ? updatedProjects[projIdx] : { id: targetProjectId, name: uploadTarget || 'New Project', isOpen: true, isActive: true, files: {} };\n      if (projIdx === -1) updatedProjects.push(targetProject);\n      \n      const addedFiles = { ...targetProject.files };`
);

appCode = appCode.replace(
  /setFiles\(newFiles\);\n\s*saveCurrentProject\(newFiles\);/g,
  `targetProject.files = newFiles;\n      setProjects(updatedProjects);\n      saveCurrentProject(updatedProjects);`
);

appCode = appCode.replace(
  /setFiles\(addedFiles\);\n\s*saveCurrentProject\(addedFiles\);/g,
  `targetProject.files = addedFiles;\n      setProjects(updatedProjects);\n      saveCurrentProject(updatedProjects);`
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('Phase 2 done');
