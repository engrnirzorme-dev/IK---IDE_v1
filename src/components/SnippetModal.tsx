import { useState } from 'react';
import { X, Code } from 'lucide-react';

type SnippetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddSnippet: (code: string, language: string) => void;
};

export default function SnippetModal({ isOpen, onClose, onAddSnippet }: SnippetModalProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <h3 className="font-semibold text-white flex items-center"><Code size={18} className="mr-2"/> Insert Code Snippet</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={18}/></button>
        </div>
        <div className="p-4 flex flex-col space-y-3">
          <input 
            type="text"
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 w-full text-sm"
            placeholder="Language / Filename (optional, e.g. php or database.php)"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            autoFocus
          />
          <textarea 
            className="w-full h-64 bg-slate-900 border border-slate-700 text-slate-300 font-mono text-sm rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 custom-scrollbar"
            placeholder="Paste your code snippet here..."
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <div className="flex justify-end pt-2">
            <button 
              className="px-4 py-2 bg-slate-700 text-white rounded-lg mr-2 hover:bg-slate-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              disabled={!code.trim()}
              onClick={() => {
                onAddSnippet(code, language);
                setCode('');
                setLanguage('');
                onClose();
              }}
            >
              Add Snippet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
