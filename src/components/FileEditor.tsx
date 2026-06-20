import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { Save, History, Code, Play } from 'lucide-react';
import { loadFileBackup } from '../lib/idbLogic';

type FileEditorProps = {
  path: string;
  initialContent: string;
  onChange: (path: string, newContent: string) => void;
  onRevertAI: (path: string) => void;
};

// Map file extensions to Prism languages
const getLanguage = (path: string) => {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'php': return 'php';
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'html': return 'markup';
    case 'css': return 'css';
    case 'json': return 'javascript'; // Prism JSON usually uses JS if not loaded
    default: return 'javascript'; // fallback
  }
};

export default function FileEditor({ path, initialContent, onChange, onRevertAI }: FileEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [hasBackup, setHasBackup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'code' | 'preview'>('code');

  // When props change (like selecting a new file), reset our local state
  useEffect(() => {
    setContent(initialContent);
    setMode('code'); // Switch back to code view on file change
  }, [path, initialContent]);

  // Check if a backup exists for reverting
  useEffect(() => {
    loadFileBackup(path).then(backup => {
      setHasBackup(!!backup);
    });
  }, [path]);

  // Auto-save logic
  useEffect(() => {
    if (content === initialContent) return; // Prevent saving if it hasn't changed from original

    const timer = setTimeout(() => {
      setIsSaving(true);
      onChange(path, content);
      setTimeout(() => setIsSaving(false), 500); // UI feedback
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, path, onChange, initialContent]);

  const lang = getLanguage(path);
  const isPreviewable = path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.php') || path.toLowerCase().endsWith('.htm');

  // Rough cleanup of PHP tags for the preview sandbox
  const getPreviewContent = () => {
     if (!content) return '';
     if (path.toLowerCase().endsWith('.php')) {
         // Replace basic echo tags to avoid completely breaking html syntax
         // This is a rough preview and won't execute PHP, but helps HTML structure render
         let clean = content.replace(/<\?=\s*(.*?)\s*\?>/g, '[$1]');
         // Hide block PHP
         clean = clean.replace(/<\?php[\s\S]*?\?>/g, '<div style="display:none">[PHP BLOCK]</div>');
         return clean;
     }
     return content;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <h3 className="text-sm font-medium text-slate-300 truncate max-w-[40%]">{path}</h3>
        <div className="flex flex-1 items-center justify-end space-x-3">
          
          {isPreviewable && (
            <div className="flex bg-slate-800 rounded p-0.5">
               <button
                  onClick={() => setMode('code')}
                  className={`px-2 py-1 flex items-center text-xs rounded transition-colors ${mode === 'code' ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-300'}`}
               >
                 <Code size={12} className="mr-1" /> Code
               </button>
               <button
                  onClick={() => setMode('preview')}
                  className={`px-2 py-1 flex items-center text-xs rounded transition-colors ${mode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
               >
                 <Play size={12} className="mr-1" /> Preview
               </button>
            </div>
          )}

          {isSaving ? (
            <span className="text-xs text-blue-400 flex items-center hidden sm:flex">
              <Save size={14} className="mr-1 animate-pulse" /> Saving...
            </span>
          ) : (
            <span className="text-xs text-emerald-500 flex items-center hidden sm:flex">
              <Save size={14} className="mr-1" /> Saved
            </span>
          )}
          
          {hasBackup && (
            <button
              onClick={() => onRevertAI(path)}
              className="px-2 py-1 bg-orange-600/20 border border-orange-500/50 hover:bg-orange-600/30 text-orange-400 rounded text-xs flex items-center transition-colors"
              title="Revert to state before last AI edit"
            >
              <History size={14} className="mr-1 hidden sm:block" /> Revert
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-[#1d1f21] custom-scrollbar relative">
        {mode === 'code' ? (
          <Editor
            value={content}
            onValueChange={setContent}
            highlight={code => Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang)}
            padding={16}
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: 14,
              minHeight: '100%',
            }}
            className="editor-container text-slate-300"
            textareaClassName="focus:outline-none"
          />
        ) : (
          <div className="absolute inset-0 bg-white">
             <iframe 
                className="w-full h-full border-0" 
                srcDoc={getPreviewContent()} 
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
             />
          </div>
        )}
      </div>
    </div>
  );
}
