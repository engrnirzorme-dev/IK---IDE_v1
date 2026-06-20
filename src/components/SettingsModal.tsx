import { X, Download, HelpCircle, CheckSquare, UploadCloud } from 'lucide-react';
import { AISettings, defaultSettings } from '../lib/aiLogic';
import { useState, useEffect } from 'react';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (s: AISettings) => void;
  onDownloadInternalBlueprint: () => void;
  onDownloadUIUXBlueprint: () => void;
};

export default function SettingsModal({ isOpen, onClose, settings, onSave, onDownloadInternalBlueprint, onDownloadUIUXBlueprint }: SettingsModalProps) {
  const [local, setLocal] = useState<AISettings>(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <h2 className="text-xl font-bold text-white">API Vault</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto min-h-0 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Provider</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
              value={local.provider}
              onChange={e => setLocal({...local, provider: e.target.value as 'gemini' | 'custom'})}
            >
              <option value="gemini">Gemini (Free)</option>
              <option value="custom">Custom (OpenAI/Groq)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
            <input 
              type="password"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
              value={local.apiKey}
              onChange={e => setLocal({...local, apiKey: e.target.value})}
              placeholder="Enter your API Key..."
            />
          </div>

          {local.provider === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Custom Endpoint URL</label>
                <input 
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                  value={local.customUrl}
                  onChange={e => setLocal({...local, customUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Model Name</label>
                <input 
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                  value={local.customModel}
                  onChange={e => setLocal({...local, customModel: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">CORS Proxy URL (Optional)</label>
                <input 
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                  value={local.corsProxy}
                  onChange={e => setLocal({...local, corsProxy: e.target.value})}
                  placeholder="https://cors-anywhere.herokuapp.com/"
                />
              </div>
            </>
          )}

          <div className="pt-6 mt-4 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center">
              <HelpCircle size={14} className="mr-1" /> Help & Data
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Note: The IDE relies on your browser's IndexedDB. Clearing browser site data will delete your local workspace.
            </p>
            <div className="flex flex-col space-y-2 mb-4">
              <p className="text-xs text-slate-400">
                <strong>AI Exclusion:</strong> Click the <CheckSquare size={12} className="inline mx-1" /> icon in the workspace sidebar to hide items from AI context, depicted by <span className="line-through decoration-slate-500">strikeout</span>.
              </p>
              <p className="text-xs text-slate-400">
                <strong>Sub-Projects:</strong> Upload files into folders via the <UploadCloud size={12} className="inline mx-1" /> icon to organize multiple projects.
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <button 
                className="w-full flex items-center justify-center p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 focus:outline-none transition-colors"
                onClick={onDownloadInternalBlueprint}
              >
                <Download size={16} className="mr-2" />
                <span className="text-sm font-medium">Download Internal Mechanism Blueprint (TXT)</span>
              </button>
              
              <button 
                className="w-full flex items-center justify-center p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 focus:outline-none transition-colors"
                onClick={onDownloadUIUXBlueprint}
              >
                <Download size={16} className="mr-2" />
                <span className="text-sm font-medium">Download UI/UX Mechanism Blueprint (TXT)</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end">
          <button 
            className="px-4 py-2 bg-slate-700 text-white rounded-lg mr-2 hover:bg-slate-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            onClick={() => {
              onSave(local);
              onClose();
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
