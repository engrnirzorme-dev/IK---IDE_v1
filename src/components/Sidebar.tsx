import { FileNode } from '../lib/zipLogic';
import { Search, Folder, FolderOpen, File as FileIcon, X, Edit2, Trash2, ChevronRight, ChevronDown, CheckSquare, Square, FolderPlus, UploadCloud } from 'lucide-react';
import React, { useState, useMemo } from 'react';

// From App.tsx
export interface ProjectContainer {
  id: string;
  name: string;
  isOpen: boolean;
  isActive: boolean;
  files: Record<string, FileNode>;
}

type SidebarProps = {
  projects: ProjectContainer[];
  onClose: () => void;
  isOpen: boolean;
  onSelect: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  onToggleAIExclusion: (path: string, exclude: boolean, isFolder: boolean) => void;
  onBulkToggleAIExclusion?: (exclude: boolean) => void;
  activePath?: string | null;
  activeProject?: string | null;
  onSelectProject?: (p: string | null) => void;
  onDeleteProject?: (id: string) => void;
  onNewProject?: () => void;
  onUploadToFolder?: (path: string) => void;
  onCreateFile?: (path: string, isFolder: boolean) => void;
  onQuickAction?: (action: string) => void;
};

type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: Record<string, TreeNode>;
  isAIExcluded?: boolean;
};

type FileTreeViewProps = { 
  node: TreeNode, 
  onSelect: (p: string) => void, 
  onRename: (o: string, n: string) => void, 
  onDelete: (p: string) => void,
  onToggleAIExclusion: (path: string, exclude: boolean, isFolder: boolean) => void,
  onUploadToFolder?: (path: string) => void,
  onCreateFile?: (path: string, isFolder: boolean) => void,
  activePath?: string | null,
  activeProject?: string | null,
  onSelectProject?: (p: string | null) => void,
  depth?: number 
};

// Simple Tree View visual component (handles recursively rendering regular folders and files)
const FileTreeView: React.FC<FileTreeViewProps> = ({ node, onSelect, onRename, onDelete, onToggleAIExclusion, onUploadToFolder, onCreateFile, activePath, activeProject, onSelectProject, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth < 1); // Open root level by default
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  const childNodes = useMemo(() => {
    if (!node.children) return [];
    return (Object.values(node.children) as TreeNode[]).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [node.children]);

  const handleRename = () => {
    if (editName && editName !== node.name) {
      const parentDir = node.path.substring(0, node.path.length - node.name.length);
      onRename(node.path, parentDir + editName);
    }
    setIsEditing(false);
  };

  const isActive = activePath === node.path;
  const isExcluded = !!node.isAIExcluded;

  return (
    <div className={`w-full flex flex-col`}>
      <div 
        className={`flex items-center justify-between px-2 py-1.5 rounded-md group transition-colors cursor-pointer
          ${isActive ? 'bg-slate-800 ring-1 ring-slate-700' : 'hover:bg-slate-800'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (node.type === 'folder') {
            setIsOpen(!isOpen);
          } else {
            onSelect(node.path);
          }
        }}
      >
        <div 
          className={`flex items-center space-x-2 truncate flex-1 ${isExcluded ? 'opacity-50' : ''}`}
        >
          {node.type === 'folder' ? (
            <span className={`text-slate-400`}>
              {isOpen ? <ChevronDown size={14} className="min-w-max" /> : <ChevronRight size={14} className="min-w-max" />}
            </span>
          ) : (
             <span className="w-3.5"></span>
          )}
          
          {node.type === 'folder' ? (
            isOpen ? <FolderOpen size={14} className={`text-blue-400 min-w-max`} /> : <Folder size={14} className={`text-blue-400 min-w-max`} />
          ) : (
            <FileIcon size={14} className="text-emerald-400 min-w-max" />
          )}

          {isEditing ? (
            <input 
              type="text" 
              className="bg-slate-900 border border-blue-500 text-white rounded px-1 min-w-[50px] w-full text-sm"
              value={editName}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          ) : (
            <span className={`truncate select-none text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'} ${isExcluded ? 'line-through decoration-slate-500' : ''}`}>{node.name}</span>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
           <div className={`items-center space-x-1 pl-2 ${isActive ? 'flex' : 'hidden group-hover:flex'}`}>
             <button 
               title={isExcluded ? "Include in AI Context" : "Exclude from AI Context"} 
               onClick={(e) => { e.stopPropagation(); onToggleAIExclusion(node.path, !isExcluded, node.type === 'folder'); }} 
               className={`p-1 ${isExcluded ? 'text-slate-600 hover:text-emerald-400' : 'text-emerald-500 hover:text-slate-400'}`}
             >
               {isExcluded ? <Square size={14} /> : <CheckSquare size={14} />}
             </button>
             {node.type === 'folder' && onCreateFile && (
               <>
                 <button title="New File" onClick={(e) => { e.stopPropagation(); onCreateFile(node.path, false); }} className={`p-1 text-slate-500 hover:text-emerald-400`}><FileIcon size={12} /></button>
                 <button title="New Folder" onClick={(e) => { e.stopPropagation(); onCreateFile(node.path, true); }} className={`p-1 text-slate-500 hover:text-emerald-400`}><FolderPlus size={12} /></button>
               </>
             )}
             {node.type === 'folder' && onUploadToFolder && (
               <button title="Upload to Folder" onClick={(e) => { e.stopPropagation(); onUploadToFolder(node.path); }} className={`p-1 text-slate-500 hover:text-emerald-400`}>
                 <UploadCloud size={12} />
               </button>
             )}
             <button title="Rename" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-slate-500 hover:text-blue-400 p-1"><Edit2 size={12} /></button>
             <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(node.path); }} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={12} /></button>
           </div>
        )}
      </div>

      {/* Render Children */}
      {isOpen && node.type === 'folder' && childNodes.map(child => (
        <FileTreeView key={child.path} node={child} onSelect={onSelect} onRename={onRename} onDelete={onDelete} onToggleAIExclusion={onToggleAIExclusion} onUploadToFolder={onUploadToFolder} onCreateFile={onCreateFile} activePath={activePath} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function Sidebar({ projects, onClose, isOpen, onSelect, onRename, onDelete, onToggleAIExclusion, onBulkToggleAIExclusion, activePath, activeProject, onSelectProject, onDeleteProject, onNewProject, onUploadToFolder, onCreateFile, onQuickAction }: SidebarProps) {
  const [search, setSearch] = useState('');

  // Builds a tree for a specific project
  const buildTreeForProject = (files: Record<string, FileNode>) => {
    const root: TreeNode = { name: 'Root', path: '', type: 'folder', children: {}, isAIExcluded: true };

    for (const path of Object.keys(files)) {
      if (search && !path.toLowerCase().includes(search.toLowerCase())) continue;

      const fileNode = files[path];
      const parts = path.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current.children) current.children = {};
        
        const isFile = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : {},
            isAIExcluded: true 
          };
        }
        
        if (!fileNode.isAIExcluded) {
           current.children[part].isAIExcluded = false;
        }

        current = current.children[part];
      }
    }
    return root;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 w-80 shrink-0 bg-slate-900 border-r border-slate-700 p-4 flex flex-col transition-transform z-50 md:relative md:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Workspaces</h2>
          <button className="md:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {onNewProject && (
          <button 
            onClick={onNewProject}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg mb-4 text-sm font-medium transition-colors border border-emerald-500 shadow-sm"
          >
            <FolderPlus size={16} />
            <span>Create Project</span>
          </button>
        )}

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            className="w-full bg-slate-800 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {projects.length > 0 && projects.some(p => p.isActive) && (
          <div className="mb-3 border-b border-slate-800 pb-3">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">CodeIgniter Tools</div>
             <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => onQuickAction?.('routes')} className="flex-1 text-xs bg-indigo-900/30 border border-indigo-500/50 hover:bg-indigo-500/30 text-indigo-300 py-1.5 rounded transition-colors">Routes</button>
                <button onClick={() => onQuickAction?.('database')} className="flex-1 text-xs bg-indigo-900/30 border border-indigo-500/50 hover:bg-indigo-500/30 text-indigo-300 py-1.5 rounded transition-colors">Database</button>
                <button onClick={() => onQuickAction?.('helper')} className="flex-1 text-xs bg-indigo-900/30 border border-indigo-500/50 hover:bg-indigo-500/30 text-indigo-300 py-1.5 rounded transition-colors">+ Helper</button>
             </div>
             
             {onBulkToggleAIExclusion && (
               <>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">AI Context</div>
                 <div className="flex space-x-2">
                    <button 
                       onClick={() => onBulkToggleAIExclusion(false)}
                       className="flex-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors text-center"
                    >
                       Include All
                    </button>
                    <button 
                       onClick={() => onBulkToggleAIExclusion(true)}
                       className="flex-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors text-center"
                    >
                       Exclude All
                    </button>
                 </div>
               </>
             )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-2">
          {projects.length === 0 ? (
            <p className="text-slate-500 text-sm text-center mt-4">
              {search ? 'No files found.' : 'No project loaded.'}
            </p>
          ) : (
            projects.map(project => {
              const tree = buildTreeForProject(project.files);
              const topLevelNodes = tree.children ? Object.values(tree.children).sort((a,b) => (a.type===b.type ? a.name.localeCompare(b.name) : (a.type==='folder'?-1:1))) : [];
              return (
                <div key={project.id} className={`project-container border rounded ${project.isActive ? 'border-emerald-500 bg-emerald-900/10 shadow-sm' : 'border-slate-700 bg-slate-800'}`}>
                  {/* Container Header */}
                  <div 
                    className="flex justify-between items-center p-3 cursor-pointer bg-slate-800 hover:bg-slate-700 rounded-t group"
                    onClick={() => {
                       onSelectProject?.(project.id);
                    }}
                  >
                    <div className="flex items-center space-x-2 truncate flex-1">
                      <span className="font-semibold text-emerald-400 min-w-max">📁</span>
                      <span className="text-[15px] font-semibold text-emerald-100 truncate">{project.name}</span>
                    </div>
                    
                    <div className="flex items-center pl-2 space-x-2">
                      <div className={`items-center space-x-1 ${project.isActive ? 'flex' : 'hidden group-hover:flex'}`}>
                         {onCreateFile && (
                           <>
                             <button title="New File" onClick={(e) => { e.stopPropagation(); onSelectProject?.(project.id); onCreateFile("", false); }} className="p-1 text-emerald-500 hover:text-emerald-300">
                               <FileIcon size={14} />
                             </button>
                             <button title="New Folder" onClick={(e) => { e.stopPropagation(); onSelectProject?.(project.id); onCreateFile("", true); }} className="p-1 text-emerald-500 hover:text-emerald-300">
                               <FolderPlus size={14} />
                             </button>
                           </>
                         )}
                         {onUploadToFolder && (
                           <button title="Upload to this Project Container" onClick={(e) => { e.stopPropagation(); onSelectProject?.(project.id); onUploadToFolder(""); }} className="p-1 text-emerald-500 hover:text-emerald-300">
                             <UploadCloud size={14} />
                           </button>
                         )}
                         {onDeleteProject && (
                           <button title="Delete Project" onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="p-1 text-red-500 hover:text-red-400">
                             <Trash2 size={14} />
                           </button>
                         )}
                      </div>
                      <span className="text-slate-400 text-xs ml-1 min-w-[12px] text-center">{project.isOpen ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {/* Container Body */}
                  {project.isOpen && (
                    <div className="container-body p-3 border-t border-slate-700 bg-slate-900 rounded-b">
                      {topLevelNodes.length === 0 ? (
                        <div className="text-xs text-slate-500 mb-1">Container is empty. Upload project here.</div>
                      ) : (
                        <div className="pl-2 border-l border-slate-700/50 space-y-0.5 ml-1">
                          {topLevelNodes.map(node => (
                            <FileTreeView 
                              key={node.path} 
                              node={node} 
                              onSelect={onSelect} 
                              onRename={onRename} 
                              onDelete={onDelete} 
                              onToggleAIExclusion={onToggleAIExclusion}
                              onUploadToFolder={onUploadToFolder}
                              onCreateFile={onCreateFile}
                              activePath={activePath}
                              depth={0}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
