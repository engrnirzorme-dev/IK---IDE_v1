import { useEffect } from 'react';
import { marked } from 'marked';
import Prism from 'prismjs';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatProps = {
  messages: Message[];
};

export default function ChatMessageList({ messages }: ChatProps) {
  // We filter out system messages from UI
  const displayMessages = messages.filter(m => m.role !== 'system');

  useEffect(() => {
    // Only run highlight if we have messages
    if (displayMessages.length > 0) {
      Prism.highlightAll();
    }
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {displayMessages.map((msg, i) => {
        const isUser = msg.role === 'user';

        return (
          <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-5 py-3 ${
                isUser ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700 markdown-body'
              }`}
              dangerouslySetInnerHTML={{ __html: isUser ? msg.content : marked.parse(msg.content) as string }}
            />
          </div>
        );
      })}
    </div>
  );
}
