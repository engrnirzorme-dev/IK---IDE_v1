import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Code } from 'lucide-react';
import { FileNode } from '../lib/zipLogic';
import SnippetModal from './SnippetModal';

type ChatInputProps = {
  onSendMessage: (msg: string, attachments: File[]) => void;
  isLoading: boolean;
  files: Record<string, FileNode>;
};

export default function ChatInput({ onSendMessage, isLoading, files }: ChatInputProps) {
  const [text, setText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [filter, setFilter] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [snippets, setSnippets] = useState<{code: string, language: string}[]>([]);
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filePaths = Object.keys(files).filter(k => files[k].isText);

  // Simple `@` detection
  useEffect(() => {
    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1 && atIndex === text.length - 1 || (atIndex !== -1 && !text.includes(' ', atIndex))) {
      setShowOptions(true);
      setFilter(text.substring(atIndex + 1));
    } else {
      setShowOptions(false);
    }
  }, [text]);

  const insertFile = (path: string) => {
    const atIndex = text.lastIndexOf('@');
    const newText = text.substring(0, atIndex) + `@${path} ` + text.substring(atIndex + filter.length + 1);
    setText(newText);
    setShowOptions(false);
    inputRef.current?.focus();
  };

  const filteredDocs = filePaths.filter(p => p.toLowerCase().includes(filter.toLowerCase())).slice(0, 5);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0 && snippets.length === 0) || isLoading) return;
    
    let finalMsg = text;
    if (snippets.length > 0) {
      finalMsg += '\n\n';
      snippets.forEach((s, idx) => {
        finalMsg += `\`\`\`${s.language || 'text'}\n${s.code}\n\`\`\`\n\n`;
      });
    }
    
    onSendMessage(finalMsg.trim(), attachments);
    setText('');
    setAttachments([]);
    setSnippets([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeSnippet = (index: number) => {
    setSnippets(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative bg-slate-800 p-2 sm:p-4 border-t border-slate-700 flex flex-col">
      <SnippetModal 
        isOpen={showSnippetModal} 
        onClose={() => setShowSnippetModal(false)} 
        onAddSnippet={(code, language) => setSnippets(prev => [...prev, { code, language }])}
      />
      
      {showOptions && filteredDocs.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full sm:max-w-md bg-slate-700 rounded-lg shadow-xl overflow-hidden z-20 border border-slate-600">
          <div className="py-1">
            {filteredDocs.map(path => (
              <button 
                key={path}
                className="w-full text-left px-4 py-2 hover:bg-blue-600 text-white text-sm truncate"
                onClick={() => insertFile(path)}
              >
                {path}
              </button>
            ))}
          </div>
        </div>
      )}

      {(attachments.length > 0 || snippets.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, i) => (
            <div key={`att-${i}`} className="flex items-center bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-md border border-slate-600">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button onClick={() => removeAttachment(i)} className="ml-2 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          ))}
          {snippets.map((snippet, i) => (
            <div key={`snip-${i}`} className="flex items-center bg-blue-900/50 text-blue-200 text-xs px-2 py-1 rounded-md border border-blue-500/30">
              <Code size={12} className="mr-1" />
              <span className="truncate max-w-[150px]">Snippet {snippet.language ? `(${snippet.language})` : `${i + 1}`}</span>
              <button onClick={() => removeSnippet(i)} className="ml-2 hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end space-x-2">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-3 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          title="Attach Files or ZIPs"
        >
          <Paperclip size={24} />
        </button>
        <button 
          onClick={() => setShowSnippetModal(true)}
          disabled={isLoading}
          className="p-3 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-blue-400 transition-colors"
          title="Paste Code Snippet"
        >
          <Code size={24} />
        </button>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
        />
        <textarea 
          ref={inputRef}
          className="flex-1 bg-slate-900 text-white rounded-xl border border-slate-700 px-4 py-3 min-h-[50px] max-h-[150px] focus:outline-none focus:border-blue-500 resize-none"
          placeholder="Ask a question or type @ to include a file..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isLoading}
        />
        <button 
          onClick={handleSend}
          disabled={(!text.trim() && attachments.length === 0 && snippets.length === 0) || isLoading}
          className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center ${
            (!text.trim() && attachments.length === 0 && snippets.length === 0) || isLoading ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={24} />}
        </button>
      </div>
    </div>
  );
}

