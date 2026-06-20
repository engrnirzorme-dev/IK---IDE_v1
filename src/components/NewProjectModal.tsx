import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

type NewProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
};

export default function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl max-w-sm w-full border border-slate-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <h3 className="font-semibold text-white flex items-center"><FolderPlus size={18} className="mr-2"/> Create Project</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={18}/></button>
        </div>
        <div className="p-4 flex flex-col space-y-3">
          <input 
            type="text"
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 w-full text-sm outline-none focus:border-emerald-500 transition-colors"
            placeholder="Enter project name (e.g. my_project)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) {
                onCreate(name);
                setName('');
              }
            }}
            autoFocus
          />
          <div className="flex justify-end pt-2">
            <button 
              className="px-4 py-2 bg-slate-700 text-white rounded-lg mr-2 hover:bg-slate-600 text-sm font-medium transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name.trim()}
              onClick={() => {
                onCreate(name);
                setName('');
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
