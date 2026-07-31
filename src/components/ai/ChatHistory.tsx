import { useRef, useEffect } from 'react';
import { useAI } from '../../contexts/AIContext';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

export const ChatHistory = () => {
  const { messages, isThinking } = useAI();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[var(--panel-bg)]">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
          <Bot size={48} className="opacity-20" />
          <p>How can I help you code today?</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#333] text-gray-300'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className={`max-w-[85%] text-sm rounded-lg p-3 ${
              msg.role === 'user' ? 'bg-[#2a2a2a] text-gray-200' : 'text-gray-300'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <ReactMarkdown
                  components={{
                    code({node: _node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="relative group rounded bg-black my-2 overflow-hidden border border-[var(--border-color)]">
                          <div className="flex justify-between items-center px-3 py-1 bg-[#1a1a1a] text-xs text-gray-400 border-b border-[var(--border-color)]">
                            <span>{match[1]}</span>
                            <button className="hover:text-white transition-ui">Copy</button>
                          </div>
                          <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className="bg-[#111] px-1 py-0.5 rounded text-[13px] text-pink-400" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))
      )}
      
      {isThinking && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded bg-[#333] text-gray-300 flex items-center justify-center shrink-0">
            <Bot size={16} />
          </div>
          <div className="flex items-center text-sm text-gray-500 gap-1 h-8">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};
