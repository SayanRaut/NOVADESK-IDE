import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { useAI } from '../../../contexts/AIContext';
import { ChatMessage } from './ChatMessage';

export const MessageList = () => {
  const { messages, isThinking } = useAI();
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = (smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Auto-scroll when messages update, but only if user is near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) scrollToBottom(false);
  }, [messages]);

  // Show scroll button when user scrolls away
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(distanceFromBottom > 200);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center">
          <Sparkles size={24} className="text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-medium mb-1">NovaDesk AI</p>
          <p className="text-sm text-slate-500">Ask me anything about your code</p>
        </div>
        <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
          {['Explain this code', 'Find bugs in selection', 'Write unit tests', 'Refactor for readability'].map(hint => (
            <div key={hint} className="px-3 py-2 rounded-lg border border-slate-800 bg-[#111] text-xs text-slate-400 cursor-default hover:border-slate-800 hover:text-slate-300 transition-colors">
              {hint}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2a2a2a]"
      >
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isThinking && messages.at(-1)?.role !== 'model' && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 h-7 text-slate-400 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 shadow-lg flex items-center justify-center transition-colors z-10"
        >
          <ArrowDown size={14} className="text-white" />
        </button>
      )}
    </div>
  );
};
