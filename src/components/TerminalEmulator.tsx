import React, { useState, useRef, useEffect } from 'react';

type TerminalEmulatorProps = {
  onCommand: (cmd: string) => void;
};

export default function TerminalEmulator({ onCommand }: TerminalEmulatorProps) {
  const [history, setHistory] = useState<{type: 'in' | 'out', text: string}[]>([]);
  const [currentCmd, setCurrentCmd] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentCmd.trim()) {
        setHistory(prev => [...prev, { type: 'in', text: currentCmd }]);
        onCommand(currentCmd.trim());
        setCurrentCmd('');
      }
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono text-sm p-4 overflow-y-auto cursor-text" onClick={() => {
        document.getElementById('terminal-input')?.focus();
    }}>
      <div className="mb-4 text-emerald-500 font-bold opacity-80">
        <div>----------------------------------------</div>
        <div>CodeIgniter 4 Dev Terminal</div>
        <div>Type 'php spark' commands to auto-generate boilerplate.</div>
        <div>(Commands are mapped to the AI engine)</div>
        <div>----------------------------------------</div>
      </div>
      {history.map((cmd, i) => (
        <div key={i} className="mb-1">
          {cmd.type === 'in' ? (
            <div className="flex">
               <span className="text-blue-500 mr-2">$</span>
               <span>{cmd.text}</span>
            </div>
          ) : (
            <div className="text-slate-300 ml-4 whitespace-pre-wrap">{cmd.text}</div>
          )}
        </div>
      ))}
      <div className="flex mt-2 items-center">
        <span className="text-blue-500 mr-2">$</span>
        <input 
          id="terminal-input"
          type="text" 
          value={currentCmd}
          onChange={e => setCurrentCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-green-400 min-w-0"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
