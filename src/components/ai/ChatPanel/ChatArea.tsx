import { Sparkles, Trash2 } from 'lucide-react';
import { useAI } from '../../../contexts/AIContext';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';


interface ChatAreaProps {
  compact?: boolean;
  showHeader?: boolean;
}

export const ChatArea = ({ compact = false, showHeader = true }: ChatAreaProps) => {
  const { activeConversation, clearMessages, activeAgent } = useAI();

  return (
    <div className="flex flex-col h-full min-h-0 glass-panel">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={14} className="text-[#c4f042] shrink-0" />
            <span className="text-xs font-medium text-slate-300 truncate">
              {activeConversation?.title ?? 'NovaDesk AI'}
            </span>
            {activeAgent && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-600/20 text-violet-400 border border-violet-500/20">
                {activeAgent}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">

            <button
              onClick={clearMessages}
              title="Clear messages"
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-300 hover:glass-panel transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}



      {/* Messages */}
      <MessageList />

      {/* Input */}
      <ChatInput compact={compact} />
    </div>
  );
};
