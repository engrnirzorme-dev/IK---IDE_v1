import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Upload, Download, Settings, DatabaseBackup, MessageSquare, Code, FolderUp, FilePlus, ArchiveRestore, ChevronDown, X, Terminal } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessageList from './components/ChatMessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import NewProjectModal from './components/NewProjectModal';
import FileEditor from './components/FileEditor';
import TerminalEmulator from './components/TerminalEmulator';
import ToastList, { ToastMessage } from './components/Toasts';
import { FileNode, unzipProject, zipProject } from './lib/zipLogic';
import { AISettings, defaultSettings, chatCompletion } from './lib/aiLogic';
import { extractFileUpdates, generateSystemPrompt, applyAIUpdatesUsingJSZip } from './lib/patchLogic';
import { saveBackup, loadBackup, saveCurrentProject, loadCurrentProject, saveFileBackup } from './lib/idbLogic';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };
type ViewMode = 'chat' | 'editor' | 'terminal';

export interface ProjectContainer {
  id: string;
  name: string;
  isOpen: boolean;
  isActive: boolean;
  files: Record<string, FileNode>;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectContainer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [activeFile, setActiveFile] = useState<{projectId: string, path: string} | null>(null);
  
  
  const zipInputRef = useRef<HTMLInputElement>(null);
  
  const activeProject = projects.find(p => p.isActive);
  const activeProjectId = activeProject?.id || null;
  const activeProjectFiles = activeProject ? activeProject.files : {};
  
  const folderInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Load settings and current project on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai_settings');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
    }

    loadCurrentProject().then(savedProjects => {
      if (savedProjects && savedProjects.length > 0) {
        setProjects(savedProjects);
      }
    });

    const savedMessages = localStorage.getItem('ai_chat_history');
    if (savedMessages) {
       try { setMessages(JSON.parse(savedMessages)); } catch(e){}
    }
  }, []);

  // Save chat history
  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  const saveSettings = (s: AISettings) => {
    setSettings(s);
    localStorage.setItem('ai_settings', JSON.stringify(s));
    addToast('Settings saved successfully.', 'success');
  };

  const handleDownloadInternalBlueprint = () => {
    try {
      const content = `Local Broker IDE - Internal Mechanism Blueprint
===================================================

1. Core State and Project Architecture
-------------------------------------
- Application state is separated into ProjectContainers ('projects').
- Each ProjectContainer holds 'files' as a Record<string, FileNode>.
- FileNode holds path, name, text content, binary raw data, and 'isAIExcluded' flag boolean.
- IndexedDB handles persisting this state across reloads via 'idb-keyval'.

2. File Uploading & Parsing (ZIP/Folder)
----------------------------------------
- ZIP files are parsed locally via JSZip.
- Web folder upload is handled natively using <input type="file" webkitdirectory directory />.
- Files are parsed as text (.php, .html, .css, .js, .ts, .json, etc.) or binary (Uint8Array).

3. AI Integration & Code Generation
-------------------------------------
- We use @google/genai SDK (GoogleGenAI class) or OpenAI/Groq for custom models.
- On chat submission, a system prompt is dynamically assembled combining the active project's files.
- The prompt generator iterates over the active project's 'files', specifically skipping files where 'isAIExcluded' is true. 
- The system prompt enforces strict CI4 guidelines and a JSON contract for updating multiple files: 
  {"action": "update", "path": "...", "code": "..."}
- Users can provide external "Snippets" (code string + language), dynamically injected into the AI context.

4. Auto-Patching Mechanism
-------------------------------------
- Once the AI responds, the 'patchLogic' extracts any JSON patches.
- Extracted JSON is applied in-memory to the target files within the active project.
- The new state is saved out to IndexedDB.
- New folders or empty directories are handled seamlessly during zip exports.

5. CodeIgniter 4 Dev Terminal & Quick Actions
-------------------------------------
- Terminal Emulator captures 'php spark' commands and routes them to the AI to generate standard CI4 boilerplate.
- Quick Actions (Routes, Database, Helper) provide shortcut mechanisms to invoke AI generation or navigate to critical CodeIgniter files.

6. Project Scope & Selection
-------------------------------------
- The Sidebar logic groups files by Active Project.
- Users can switch between projects dynamically; state updates reflect the active project's files.
- Users can Bulk Toggle AI exclusion rules for an entire project at once.

7. Rollback / Backup System
-------------------------------------
- Every time a structural ZIP unzips or the system auto-patches code, a project-specific backup state is written to IndexedDB.
- Files edited manually have a file-level backup created on focus loss.
- The REVERT systems load the previous snapshot from local DB restoring the project to its pre-change state.
`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `internal-mechanism-blueprint.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Internal mechanism blueprint downloaded.', 'success');
    } catch(err) {
      console.error(err);
      addToast('Failed to download text blueprint.', 'error');
    }
  };

  const handleDownloadUIUXBlueprint = () => {
    try {
      const content = `Local Broker IDE - UI/UX Mechanism Blueprint
=================================================

1. Visual Identity & Tailwind
-------------------------------------
- The application uses a robust "dark mode only" scheme optimized for long coding sessions.
- Theme relies on specific tailwind classes: bg-slate-950, text-slate-200.
- Accent colors use 'emerald' for positive actions (Upload, Create), 'blue' for system/AI buttons, and 'indigo' for CodeIgniter tools.

2. Structural Layout
-------------------------------------
- Top Navbar: Houses secondary project actions, Settings toggle, Sidebar toggle (mobile), general actions (Backup Database).
- Sidebar Area (Left): Displays Project list, hierarchical file tree view component. Features CodeIgniter Tools + "Include All" / "Exclude All" quick filters for AI scope.
- Main Workspace (Center/Right):
   - Editor Panel: Takes focus when a file is selected. Built with a full-height \`<textarea>\`.
   - Terminal Panel: A simulated CLI for running CodeIgniter 'spark' commands mapped to the AI.
   - Chat Panel: Sits on the far right (or covers the area in chat view), displaying chat history and the AI input.

3. Views and Navigation State
-------------------------------------
- The viewMode state toggles between 'chat', 'editor', and 'terminal'.
- Small screens rely on hiding/showing panels via smooth translate-x animations.
- The UI gracefully switches contexts: selecting a file opens the 'editor', clicking the terminal icon opens 'terminal'.

4. Components Details
-------------------------------------
- App.tsx: The controller rendering the Layout and view mode routing.
- Sidebar.tsx: Builds a recursive TreeView. Manages Projects wrapper, File/Folder expansion, AI exclusion toggles, Rename/Delete triggers, creation triggers, and CodeIgniter quick actions.
- FileEditor.tsx: Simple textarea UI overlaid with action buttons (Save, Revert, Preview).
- TerminalEmulator.tsx: An interactive CLI UI specifically tailored for CodeIgniter 'spark' command interaction mapping to AI completion calls.
- ChatInput.tsx & SnippetModal.tsx: Chat input area that allows inline file attachments + dedicated modal for raw code snippet insertions.
- SettingsModal.tsx: Modal containing API key setups and configuration.

5. Responsive Strategy
-------------------------------------
- Flexboxes adapt horizontal split arrays natively based on window sizes.
- Absolute positioning + translate-x sliding hides the Editor/Terminal completely if View is flipped to 'chat' on mobile, ensuring maximal screen real-estate.
- Z-Index overlays ensure Sidebar and Option Modals capture clicks effectively on small viewports.
`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ui-ux-mechanism-blueprint.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('UI/UX mechanism blueprint downloaded.', 'success');
    } catch(err) {
      console.error(err);
      addToast('Failed to download text blueprint.', 'error');
    }
  };

  const addToast = useCallback((msg: string, type: 'error'|'success'|'info' = 'info') => {
    setToasts(prev => [...prev, { id: Date.now() + Math.random(), message: msg, type }]);
  }, []);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowUploadModal(false);

    if (file.name.toLowerCase().endsWith('.rar')) {
      addToast('RAR files are not directly supported due to browser limitations. Please extract it locally and use "Upload Folder" instead.', 'error');
      if (zipInputRef.current) zipInputRef.current.value = '';
      return;
    }

    try {
      addToast(`Unzipping project into ${uploadTarget || 'workspace'}...`, 'info');
      const unzipped = await unzipProject(file);
      
      const targetProjectId = activeProjectId || `proj_${Date.now()}`;
      const projIdx = projects.findIndex(p => p.id === targetProjectId);
      let updatedProjects = [...projects];
      let targetProject = projIdx > -1 ? updatedProjects[projIdx] : { id: targetProjectId, name: uploadTarget || 'New Project', isOpen: true, isActive: true, files: {} };
      if (projIdx === -1) updatedProjects.push(targetProject);
      
      const newFiles = { ...targetProject.files };
      let count = 0;
      for (const [key, node] of Object.entries(unzipped)) {
        const targetPath = uploadTarget ? `${uploadTarget}/${key}` : key;
        newFiles[targetPath] = { ...node, path: targetPath };
        count++;
      }
      
      targetProject.files = newFiles;
      setProjects(updatedProjects);
      await saveCurrentProject(updatedProjects);
      addToast(`Extracted ${count} files.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to read zip file.', 'error');
    }
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setShowUploadModal(false);
    addToast(`Reading folder into ${uploadTarget || 'workspace'}...`, 'info');
    
    try {
      const targetProjectId = activeProjectId || `proj_${Date.now()}`;
      const projIdx = projects.findIndex(p => p.id === targetProjectId);
      let updatedProjects = [...projects];
      let targetProject = projIdx > -1 ? updatedProjects[projIdx] : { id: targetProjectId, name: uploadTarget || 'New Project', isOpen: true, isActive: true, files: {} };
      if (projIdx === -1) updatedProjects.push(targetProject);
      
      const newFiles = { ...targetProject.files };
      const textExtensions = ['php', 'html', 'css', 'js', 'ts', 'json', 'md', 'xml', 'csv', 'txt', 'env', 'htaccess'];
      
      let count = 0;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        let relativePath = file.webkitRelativePath; 
        
        // Remove the root folder name from relativePath to make it cleaner
        const parts = relativePath.split('/');
        if (parts.length > 1) {
           parts.shift(); // remove root folder
           relativePath = parts.join('/');
        } else {
           relativePath = file.name;
        }

        const targetPath = uploadTarget ? `${uploadTarget}/${relativePath}` : relativePath;
        const ext = relativePath.split('.').pop()?.toLowerCase() || '';
        const isText = textExtensions.includes(ext);

        if (isText) {
          const content = await file.text();
          newFiles[targetPath] = { path: targetPath, name: file.name, content, isText: true, isAIExcluded: targetPath.includes('node_modules/') || targetPath.includes('vendor/') || targetPath.includes('.git/') || targetPath.includes('build/') || targetPath.includes('dist/') };
        } else {
          const arrayBuffer = await file.arrayBuffer();
          newFiles[targetPath] = { path: targetPath, name: file.name, isText: false, raw: new Uint8Array(arrayBuffer), isAIExcluded: true };
        }
        count++;
      }
      
      targetProject.files = newFiles;
      setProjects(updatedProjects);
      await saveCurrentProject(updatedProjects);
      addToast(`Loaded ${count} files from folder.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to read folder.', 'error');
    }
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setShowUploadModal(false);
    addToast('Adding files...', 'info');
    
    try {
      const targetProjectId = activeProjectId || `proj_${Date.now()}`;
      const projIdx = projects.findIndex(p => p.id === targetProjectId);
      let updatedProjects = [...projects];
      let targetProject = projIdx > -1 ? updatedProjects[projIdx] : { id: targetProjectId, name: uploadTarget || 'New Project', isOpen: true, isActive: true, files: {} };
      if (projIdx === -1) updatedProjects.push(targetProject);
      
      const addedFiles = { ...targetProject.files }; 
      const textExtensions = ['php', 'html', 'css', 'js', 'ts', 'json', 'md', 'xml', 'csv', 'txt', 'env', 'htaccess'];
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const targetPath = uploadTarget ? `${uploadTarget}/${file.name}` : file.name;
        
        const ext = targetPath.split('.').pop()?.toLowerCase() || '';
        const isText = textExtensions.includes(ext);

        if (isText) {
          const content = await file.text();
          addedFiles[targetPath] = { path: targetPath, name: file.name, content, isText: true, isAIExcluded: targetPath.includes('node_modules/') || targetPath.includes('vendor/') || targetPath.includes('.git/') || targetPath.includes('build/') || targetPath.includes('dist/') };
        } else {
          const arrayBuffer = await file.arrayBuffer();
          addedFiles[targetPath] = { path: targetPath, name: file.name, isText: false, raw: new Uint8Array(arrayBuffer), isAIExcluded: true };
        }
      }
      
      targetProject.files = addedFiles;
      setProjects(updatedProjects);
      await saveCurrentProject(updatedProjects);
      addToast(`Added ${fileList.length} files.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve files.', 'error');
    }
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (projects.length === 0) return;
    addToast('Generating zip...', 'info');
    zipProject(activeProjectFiles).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_patched_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Download started.', 'success');
    }).catch(e => addToast('Download failed.', 'error'));
  };

  const handleRevert = async () => {
    const backup = await loadBackup();
    if (backup && Object.keys(backup).length > 0) {
      if (activeProjectId) {
  setProjects(prev => {
     const updated = [...prev];
     const pIdx = updated.findIndex(p => p.id === activeProjectId);
     if (pIdx > -1) {
       updated[pIdx] = { ...updated[pIdx], files: backup };
       saveCurrentProject(updated);
     }
     return updated;
  });
}
      addToast('Reverted to last global backup state.', 'success');
    } else {
      addToast('No global backup found to revert.', 'error');
    }
  };

  const handleFileSelect = (path: string) => {
    setActiveFile(path);
    setViewMode('editor');
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleFileChange = (path: string, newContent: string) => {
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

  const handleFileRename = (oldPath: string, newPath: string) => {
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

  const handleFileDelete = (path: string) => {
    if (!activeProjectId) return;
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
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

  const handleProjectDelete = (id: string) => {
    if (!confirm(`Are you sure you want to delete this entire project workspace?`)) return;
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (updated.length > 0 && !updated.some(p => p.isActive)) {
        updated[0].isActive = true;
        updated[0].isOpen = true;
      }
      saveCurrentProject(updated);
      return updated;
    });
    if (activeFile && activeFile.projectId === id) {
       setActiveFile(null);
    }
  };

  const handleCreateFile = (targetPath: string, isFolder: boolean) => {
    if (!activeProjectId) return;
    const itemName = prompt(`Enter name for new ${isFolder ? 'folder' : 'file'}:`);
    if (!itemName) return;
    const newPath = targetPath ? `${targetPath}/${itemName}` : itemName;
    if (activeProjectFiles[newPath]) {
      addToast('A file or folder with that name already exists.', 'error');
      return;
    }

    setProjects(prev => {
      const updated = [...prev];
      const pIdx = updated.findIndex(p => p.id === activeProjectId);
      if (pIdx > -1) {
         updated[pIdx] = { ...updated[pIdx] };
         updated[pIdx].files = { 
            ...updated[pIdx].files, 
            [newPath]: {
               path: newPath,
               name: itemName,
               content: isFolder ? undefined : '',
               isText: !isFolder,
               isAIExcluded: false
            }
         };
         saveCurrentProject(updated).catch(console.error);
      }
      return updated;
    });

    if (!isFolder) {
       setActiveFile({ projectId: activeProjectId, path: newPath });
       setViewMode('editor');
       if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  const handleNewProject = (name: string) => {
    const cleanName = name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
    if (!cleanName) return;

    setProjects(prev => {
      const updated = [...prev];
      // Deselect others
      updated.forEach(p => p.isActive = false);
      updated.push({
        id: `proj_${Date.now()}`,
        name: cleanName,
        isOpen: true,
        isActive: true,
        files: {}
      });
      saveCurrentProject(updated);
      return updated;
    });
    addToast(`Project ${cleanName} created.`, 'success');
    setShowNewProjectModal(false);
  };

  const handleToggleAIExclusion = (path: string, exclude: boolean, isFolder: boolean) => {
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

  const handleBulkToggleAIExclusion = (exclude: boolean) => {
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

  const handleSendMessage = async (text: string, attachments: File[] = []) => {
    if (!text.trim() && attachments.length === 0) return;
    setIsLoading(true);

    const activeFilesForAI = Object.keys(activeProjectFiles).reduce((acc, path) => {
      if (!activeProjectFiles[path].isAIExcluded) {
        acc[path] = activeProjectFiles[path];
      }
      return acc;
    }, {} as Record<string, FileNode>);

    let currentSystemPrompt = generateSystemPrompt(activeFilesForAI);
    const mentions = text.match(/@([^\s]+)/g) || [];
    let injectedContext = '';
    
    for (const mention of mentions) {
      const path = mention.substring(1);
      const fileNode = activeProjectFiles[path];
      if (fileNode && fileNode.isText && fileNode.content) {
        if (injectedContext.length > 300000) {
           injectedContext += `\n--- [WARNING: Context limit reached, remaining attachments omitted] ---\n`;
           break;
        }
        injectedContext += `\n--- Workspace File: ${path} ---\n${fileNode.content}\n---------------------\n`;
      }
    }

    let limitReached = false;
    for (const file of attachments) {
      if (limitReached) break;
      if (file.name.toLowerCase().endsWith('.zip')) {
        try {
          const unzippedFiles = await unzipProject(file);
          for (const [path, node] of Object.entries(unzippedFiles)) {
             if (injectedContext.length > 300000) {
                limitReached = true;
                injectedContext += `\n--- [WARNING: Context limit reached, remaining attachments omitted] ---\n`;
                break;
             }
             if (node.isText && node.content) {
               injectedContext += `\n--- Attached ZIP (${file.name}) -> ${path} ---\n${node.content}\n---------------------\n`;
             }
          }
        } catch (err) {
          console.error("Failed to unzip attached file:", err);
          injectedContext += `\n--- [Failed to read attached ZIP: ${file.name}] ---\n`;
        }
      } else {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const textExtensions = ['php', 'html', 'css', 'js', 'ts', 'json', 'md', 'xml', 'csv', 'txt', 'env', 'htaccess'];
        if (textExtensions.includes(ext) || file.type.startsWith('text/')) {
          try {
            if (injectedContext.length > 300000) {
                limitReached = true;
                injectedContext += `\n--- [WARNING: Context limit reached, remaining attachments omitted] ---\n`;
                break;
            }
            const content = await file.text();
            injectedContext += `\n--- Attached File: ${file.name} ---\n${content}\n---------------------\n`;
          } catch(err) {
            console.error("Failed to read attached text file", err);
          }
        } else {
            injectedContext += `\n--- [Attached File ${file.name} skipped because it is not recognized as a text file] ---\n`;
        }
      }
    }

    if (injectedContext) {
      currentSystemPrompt += `\n\nTHE USER EXPLICITLY INCLUDED THESE FILES FOR CONTEXT:\n${injectedContext}`;
    }

    // Show attachment names in the chat UI
    let displayMessage = text;
    if (attachments.length > 0) {
      const attNames = attachments.map(f => f.name).join(', ');
      displayMessage += displayMessage ? `\n\n[Attached: ${attNames}]` : `[Attached: ${attNames}]`;
    }

    const newUserMsg: Message = { role: 'user', content: displayMessage };
    const systemMsg: Message = { role: 'system', content: currentSystemPrompt };

    const promptMessages = [...messages, newUserMsg];
    setMessages(promptMessages);

    // Switch to chat view if we just sent a message
    setViewMode('chat');

    try {
      // Keep only last 10 messages (5 turns) to save tokens
      const recentMessages = promptMessages.slice(-10);
      const payloadMessages = [systemMsg, ...recentMessages];
      
      const response = await chatCompletion(payloadMessages, settings);
      
      const newAssistantMsg: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, newAssistantMsg]);

      // Parse JSON
      const updates = extractFileUpdates(response);
      if (updates.length > 0) {
        await saveBackup(activeProjectFiles); // Global backup before AI changes
        
        // Individual file backups first
        for (const u of updates) {
          const existing = activeProjectFiles[u.path];
          if (existing && existing.isText && existing.content !== undefined) {
             await saveFileBackup(u.path, existing.content);
          }
        }
        
        // Use JSZip memory updater
        const { nextFiles } = await applyAIUpdatesUsingJSZip(activeProjectFiles, updates);

        // setFiles(nextFiles);
        
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

        
        // Auto-set the active file to the first file AI modified
        setActiveFile(updates[0].path);
        setViewMode('editor'); // Switch to editor to see the changes

        const updatedPaths = updates.map(u => u.path).join(', ');
        addToast(`Auto-patched files: ${updatedPaths}`, 'success');
      }

    } catch (e: any) {
      console.error(e);
      const errMsg = e.message || '';
      if (errMsg.includes('429')) {
        addToast('Rate Limit Hit. Wait 60s.', 'error');
      } else if (errMsg.includes('token') || errMsg.includes('exceeds') || errMsg.includes('INVALID_ARGUMENT')) {
        addToast('Token context limit exceeded. Please use the Sidebar CheckSquare icon to exclude some files or folders.', 'error');
      } else {
        addToast(errMsg || 'Error connecting to AI API.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevertSpecificFile = async (path: string) => {
     const { loadFileBackup } = await import('./lib/idbLogic');
     const backup = await loadFileBackup(path);
     if (backup !== undefined) {
        handleFileChange(path, backup);
        addToast(`Reverted ${path} to pre-AI state.`, 'success');
     } else {
        addToast('No backup found for this file.', 'error');
     }
  };

  const handleTerminalCommand = async (cmd: string) => {
    const directive = `The user executed the following CLI command in the terminal:
\`${cmd}\`

Execute this command as the CodeIgniter 4 CLI 'spark'. Provide a brief success message, and use the JSON patch format to create/update files appropriately. Think about the standard CodeIgniter 4 boilerplate that this command would generate.`;

    await handleSendMessage(directive, []);
  };

  const handleQuickAction = async (action: string) => {
    if (!activeProjectId) return;
    if (action === 'routes') {
        const path = 'app/Config/Routes.php';
        if (activeProjectFiles[path]) {
           setActiveFile({ projectId: activeProjectId, path });
           setViewMode('editor');
        } else {
           await handleSendMessage("The user requests the app/Config/Routes.php file. Since it doesn't exist, generate standard CodeIgniter 4 boilerplate for it.");
        }
    } else if (action === 'database') {
        const path = '.env';
        if (activeProjectFiles[path]) {
           setActiveFile({ projectId: activeProjectId, path });
           setViewMode('editor');
        } else {
           await handleSendMessage("The user requests database configuration. Create a standard CodeIgniter 4 .env file with MySQL database configuration placeholder.");
        }
    } else if (action === 'helper') {
        const helperName = prompt("Enter helper name (e.g., 'format'):");
        if (!helperName) return;
        await handleSendMessage(`Create a CodeIgniter 4 helper file named app/Helpers/${helperName}_helper.php with a sample function.`);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <ToastList toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <SettingsModal 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        settings={settings}
        onSave={saveSettings}
        onDownloadInternalBlueprint={handleDownloadInternalBlueprint}
        onDownloadUIUXBlueprint={handleDownloadUIUXBlueprint}
      />
      
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={handleNewProject}
      />

      <input 
        type="file" 
        accept=".zip,.rar" 
        ref={zipInputRef} 
        onChange={handleZipUpload} 
        className="hidden" 
      />
      {/* Required for Folder Upload on webkit browsers */}
      <input 
        type="file" 
        ref={folderInputRef} 
        onChange={handleFolderUpload} 
        className="hidden" 
        {...({ webkitdirectory: "", directory: "" } as any)} 
      />
      <input 
        type="file" 
        multiple
        accept=".php,.html,.css,.js,.ts,.json,.md,.xml,.csv,.txt,.env,.htaccess"
        ref={multiFileInputRef} 
        onChange={handleMultiFileUpload} 
        className="hidden" 
      />

      {/* Header */}
      <header className="flex-shrink-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 w-full">
        <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-4">
          <button className="md:hidden text-slate-300 flex-shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent truncate hidden lg:block">
            Local Broker IDE
          </h1>
          {activeFile && (
            <div className="flex items-center space-x-2 text-sm text-slate-400 truncate border-l border-slate-700 pl-3">
              <span className="truncate max-w-[150px] sm:max-w-xs text-blue-400 font-mono tracking-tighter" title={activeFile.path}>
                {activeFile.path}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 relative">
          {/* View Toggles on Mobile/Tablet */}
          {Object.keys(activeProjectFiles).length > 0 && (
            <div className="flex bg-slate-800 rounded-lg p-1 mr-2">
              <button
                className={`p-1.5 rounded-md flex items-center ${viewMode === 'chat' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                onClick={() => setViewMode('chat')}
                title="Chat View"
              >
                <MessageSquare size={16} />
              </button>
              <button
                className={`p-1.5 rounded-md flex items-center ${viewMode === 'editor' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                onClick={() => setViewMode('editor')}
                title="Editor View"
              >
                <Code size={16} />
              </button>
              <button
                className={`p-1.5 rounded-md flex items-center ${viewMode === 'terminal' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
                onClick={() => setViewMode('terminal')}
                title="Terminal Emulator"
              >
                <Terminal size={16} />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <button 
            className="flex items-center justify-center p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            title="Upload Files"
            onClick={() => {
              if (!activeProject && Object.keys(activeProjectFiles).length > 0) {
                 addToast('Please select a project from the sidebar to upload files into.', 'error');
                 setSidebarOpen(true);
                 return;
              }
              setUploadTarget(activeProject);
              setShowUploadModal(true);
            }}
          >
            <Upload size={18} className="sm:mr-1" />
            <span className="hidden sm:inline text-sm font-medium mr-1">Upload</span>
          </button>
          
          <button 
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              projects.length === 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            title="Download Patched Zip"
            onClick={handleDownload}
            disabled={projects.length === 0}
          >
            <Download size={18} className="sm:mr-2" />
            <span className="hidden sm:inline text-sm font-medium">Download</span>
          </button>
          
          <button 
            className="flex items-center justify-center p-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors ml-1"
            title="Revert to Last Built/Uploaded ZIP state"
            onClick={handleRevert}
          >
            <DatabaseBackup size={18} />
          </button>

          <button 
            className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-1"
            title="Settings / API Vault"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          projects={projects}
          onSelectProject={(id) => {
            setProjects(prev => prev.map(p => {
               if (p.id === id) {
                 return { ...p, isActive: true, isOpen: p.isActive ? !p.isOpen : true };
               }
               return { ...p, isActive: false };
            }));
          }}
          onDeleteProject={handleProjectDelete}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          onSelect={(path) => {
            if(activeProjectId) {
               setActiveFile({ projectId: activeProjectId, path });
               setViewMode('editor');
            }
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
          onCreateFile={handleCreateFile}
          onQuickAction={handleQuickAction}
        />

        <main className="flex-1 flex bg-[#1d1f21] border-l border-slate-800 h-full overflow-hidden w-full relative">
          
          {projects.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900 absolute inset-0 z-20">
              <Upload size={48} className="text-slate-600 mb-4" />
              <h2 className="text-xl font-medium text-slate-300 mb-2">Welcome to Local Broker IDE</h2>
              <p className="text-slate-500 max-w-md">Click 'Create Project' below to create a new workspace container, or upload an existing CodeIgniter project.</p>
              <div className="flex space-x-4 mt-6">
                 <button 
                   onClick={() => setShowNewProjectModal(true)}
                   className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium"
                 >
                   Create Project
                 </button>
                 <button 
                   onClick={() => { setUploadTarget(null); setShowUploadModal(true); }}
                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium"
                 >
                   Upload Workspace
                 </button>
              </div>
            </div>
          ) : (
             <div className="flex w-full h-full relative">
                {/* Editor / Terminal Panel */}
                <div className={`flex flex-col h-full bg-slate-950 w-full lg:w-1/2 xl:w-7/12 absolute lg:relative transform transition-transform duration-300 z-10 
                   ${(viewMode === 'editor' || viewMode === 'terminal') ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                   `}
                >
                  {viewMode === 'terminal' ? (
                     <TerminalEmulator onCommand={handleTerminalCommand} />
                  ) : activeFile && activeProjectFiles[activeFile?.path || ""]?.isText ? (
                    <FileEditor 
                      path={activeFile.path} 
                      initialContent={activeProjectFiles[activeFile?.path || ""].content || ''} 
                      onChange={handleFileChange} 
                      onRevertAI={handleRevertSpecificFile}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      {activeFile ? 'Cannot edit binary file' : 'Select a file from the sidebar to edit'}
                    </div>
                  )}
                </div>

                {/* Chat Panel */}
                <div className={`flex flex-col h-full w-full lg:w-1/2 xl:w-5/12 bg-slate-900 border-l border-slate-800 absolute lg:relative transform transition-transform duration-300 z-20 lg:z-auto
                   ${viewMode === 'chat' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                  `}>
                  <ChatMessageList messages={messages} />
                  <ChatInput 
                    isLoading={isLoading} 
                    onSendMessage={handleSendMessage} 
                    files={activeProjectFiles} 
                  />
                </div>
             </div>
          )}
        </main>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h3 className="font-semibold text-lg text-white">
                {uploadTarget ? `Upload to ${uploadTarget}` : 'Upload to Workspace'}
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20}/></button>
            </div>
            <div className="p-6 flex flex-col space-y-4">
              <button 
                className="flex flex-col items-center justify-center w-full py-6 rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors group"
                onClick={() => zipInputRef.current?.click()}
              >
                <ArchiveRestore size={36} className="mb-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-emerald-100 text-lg">Upload ZIP / RAR</span>
                <span className="text-sm text-emerald-400/70 mt-1 text-center font-medium">Extracts automatically into project</span>
              </button>
              
              <div className="flex space-x-4">
                <button 
                  className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl border border-slate-600 bg-slate-700 hover:bg-slate-600 transition-colors group"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <FolderUp size={24} className="mb-2 text-blue-400 group-hover:-translate-y-1 transition-transform" />
                  <span className="font-medium text-slate-200">Folder</span>
                </button>
                <button 
                  className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl border border-slate-600 bg-slate-700 hover:bg-slate-600 transition-colors group"
                  onClick={() => multiFileInputRef.current?.click()}
                >
                  <FilePlus size={24} className="mb-2 text-orange-400 group-hover:-translate-y-1 transition-transform" />
                  <span className="font-medium text-slate-200">Files</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
