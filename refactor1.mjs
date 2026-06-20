import fs from 'fs';

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/export default function App\(\) \{/, 
`export interface ProjectContainer {
  id: string;
  name: string;
  isOpen: boolean;
  isActive: boolean;
  files: Record<string, FileNode>;
}

export default function App() {`);

appCode = appCode.replace(
  `const [files, setFiles] = useState<Record<string, FileNode>>({});`,
  `const [projects, setProjects] = useState<ProjectContainer[]>([]);`
);

appCode = appCode.replace(
  `const [activeFile, setActiveFile] = useState<string | null>(null);`,
  `const [activeFile, setActiveFile] = useState<{projectId: string, path: string} | null>(null);`
);

appCode = appCode.replace(
  `const [activeProject, setActiveProject] = useState<string | null>(null);`,
  ``
);

// We need an accessor helper for active project
appCode = appCode.replace(
  `const zipInputRef = useRef<HTMLInputElement>(null);`,
  `const zipInputRef = useRef<HTMLInputElement>(null);
  
  const activeProject = projects.find(p => p.isActive);
  const activeProjectId = activeProject?.id || null;
  const activeProjectFiles = activeProject ? activeProject.files : {};
  `
);

// We need to change saveCurrentProject
appCode = appCode.replace(
  `const saveCurrentProject = (updated: Record<string, FileNode>) => {
    idbSet('workspace_files', updated);
  };`,
  `const saveCurrentProject = (updated: ProjectContainer[]) => {
    idbSet('workspace_projects', updated);
  };`
);

// and loading logic
appCode = appCode.replace(
  `idbGet('workspace_files').then(data => {
      if (data) setFiles(data as Record<string, FileNode>);
    });`,
  `idbGet('workspace_projects').then(data => {
      if (data) setProjects(data as ProjectContainer[]);
    });`
);

fs.writeFileSync('src/App.tsx', appCode);
console.log("Replaced phase 1");
