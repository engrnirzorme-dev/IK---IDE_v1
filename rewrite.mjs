import fs from 'fs';

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(/export default function App\(\) \{/, 
`export interface ProjectContainer {
  projectId: string;
  projectName: string;
  isContainerOpen: boolean;
  isActive: boolean;
  fileTree: Record<string, FileNode>;
}

export default function App() {`);

appCode = appCode.replace(
  `const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, FileNode>>({});`,
  `const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectContainer[]>([]);`
);

appCode = appCode.replace(
  `const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);`,
  `const [activeFile, setActiveFile] = useState<{projectId: string, path: string} | null>(null);`
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('App.tsx partial rewrite done');
