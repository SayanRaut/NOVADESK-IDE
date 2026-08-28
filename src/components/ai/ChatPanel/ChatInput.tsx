import { useRef, useCallback, useState } from 'react';
import { Send, Square, Paperclip, SquareTerminal, FileCode, X } from 'lucide-react';
import { useAI } from '../../../contexts/AIContext';
import { useEditor } from '../../../contexts/EditorContext';
import { useUI } from '../../../contexts/UIContext';

interface ChatInputProps {
  compact?: boolean;
}

export const ChatInput = ({ compact = false }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const { sendMessage, isStreaming, isThinking, stopStreaming } = useAI();
  const { fileContents, openFiles, chatContextFiles, setChatContextFiles, currentPath } = useEditor();
  const { setActiveBottomPanel } = useUI();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || isThinking) return;
    setInput('');
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let promptText = text;
    if (chatContextFiles.length > 0 && window.electronAPI) {
      let appendedContext = '\n\n=== ADDITIONAL CONTEXT FILES ===\n';
      for (const file of chatContextFiles) {
        let content = fileContents[file];
        if (content === undefined) {
           try {
              content = await window.electronAPI.readFile(file);
           } catch {
              content = '<Error reading file>';
           }
        }
        appendedContext += `\n--- ${file} ---\n${content}\n`;
      }
      promptText += appendedContext;
    }

    sendMessage(promptText, {
      open_files: openFiles,
      workspace_root: currentPath,
    });
  }, [input, isStreaming, isThinking, sendMessage, fileContents, openFiles, chatContextFiles, currentPath]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-grow
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const busy = isStreaming || isThinking;

  return (
    <div className={`border-t border-[var(--border-color)] bg-[var(--activity-bar-bg)] ${compact ? 'p-2' : 'p-3'}`}>
      <div className="relative rounded-xl glass-panel border border-[#252525] focus-within:border-[#c4f042]/40 focus-within:shadow-[0_0_0_1px_rgba(196,240,66,0.15)] transition-all flex flex-col">
        {chatContextFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 pb-0 max-h-24 overflow-y-auto">
            {chatContextFiles.map(file => (
              <div key={file} className="flex items-center gap-1 bg-[#c4f042]/10 border border-[#c4f042]/20 rounded-md pl-2 pr-1 py-1 text-xs text-[#c4f042]" title={`Context: ${file}`}>
                <FileCode size={12} className="text-[#c4f042]" />
                <span className="truncate max-w-[200px]">{file.split(/[\\/]/).pop()}</span>
                <button 
                  type="button" 
                  onClick={() => setChatContextFiles(prev => prev.filter(p => p !== file))} 
                  className="hover:text-white transition-colors ml-0.5 rounded-sm hover:bg-black/20 p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask NovaDesk..."
          disabled={busy}
          rows={1}
          className="w-full bg-transparent text-slate-200 text-sm px-4 pt-2 pb-2 outline-none resize-none min-h-[44px] max-h-[180px] placeholder:text-slate-600 disabled:opacity-60"
          style={{ scrollbarWidth: 'none' }}
        />

        <div className="flex items-center justify-between px-3 pb-2 gap-2">
          {/* Left actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Attach file (coming soon)"
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-400 hover:bg-[var(--hover-bg)] transition-colors"
            >
              <Paperclip size={13} />
            </button>
            {!compact && (
              <button
                type="button"
                onClick={() => setActiveBottomPanel('terminal')}
                title="Open terminal"
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-400 hover:bg-[var(--hover-bg)] transition-colors"
              >
                <SquareTerminal size={13} />
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {busy && (
              <span className="text-[10px] text-slate-500">
                {isThinking ? 'Thinking...' : 'Streaming...'}
              </span>
            )}
            {busy ? (
              <button
                onClick={stopStreaming}
                className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 flex items-center justify-center text-red-400 transition-colors"
                title="Stop"
              >
                <Square size={12} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  input.trim()
                    ? 'bg-[#c4f042] hover:bg-[#a3cc3b] text-black shadow-md shadow-[#c4f042]/20'
                    : 'bg-[var(--hover-bg)] text-slate-600 cursor-not-allowed'
                }`}
                title="Send (Enter)"
              >
                <Send size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      )}
    </div>
  );
};
