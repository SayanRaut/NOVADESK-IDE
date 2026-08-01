import { useState } from 'react';
import { Send, SquareTerminal } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';
import { useEditor } from '../../contexts/EditorContext';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

export const ChatInput = () => {
  const [input, setInput] = useState('');
  const { messages, setMessages, isThinking, setIsThinking, wsRef, selectedModel, agentMode, connection } = useAI();
  const { activeFile, fileContents, openFiles } = useEditor();
  const { setActiveBottomPanel } = useUI();
  const { accessToken: authToken } = useAuth();

  const handleSend = () => {
    if (!input.trim() || isThinking) return;

    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: input, timestamp: Date.now() }];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    if (connection.provider === 'openai-compatible' && connection.hasApiKey && window.electronAPI) {
      void window.electronAPI.chatWithAI({
        messages: newMessages.map(m => ({ role: m.role as 'user' | 'model', content: m.content })),
        context: {
          activeFile: activeFile ?? '',
          activeFileContent: activeFile ? fileContents[activeFile] ?? '' : '',
        },
      }).then(({ content }) => {
        setMessages((previous) => [...previous, { id: Date.now().toString(), role: 'model', content, timestamp: Date.now() }]);
      }).catch((reason) => {
        const message = reason instanceof Error ? reason.message : 'The AI service request failed.';
        setMessages((previous) => [...previous, { id: Date.now().toString(), role: 'model', content: `⚠ ${message}`, timestamp: Date.now() }]);
      }).finally(() => setIsThinking(false));
    } else if (authToken === 'local') {
      setMessages((previous) => [...previous, { id: Date.now().toString(), role: 'model', content: 'Local workspace mode is active. Sign in with Google to use NovaDesk Cloud AI; the editor, files, terminal, Git, and extensions are available locally.', timestamp: Date.now() }]);
      setIsThinking(false);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        message: input, 
        model_id: selectedModel,
        mode: agentMode,
        context: {
          active_file: activeFile ?? '',
          active_file_content: activeFile ? fileContents[activeFile] ?? '' : '',
          open_files: openFiles,
        },
      }));
    } else {
      // Fallback or error state
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: '⚠ The authenticated AI connection is not ready. Start the backend and sign in again.', timestamp: Date.now() }]);
        setIsThinking(false);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-[var(--panel-bg)] border-t border-[var(--border-color)]">
      <div className="relative rounded-lg bg-[#111111] border border-[var(--border-color)] focus-within:border-[var(--accent)] transition-ui flex flex-col">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask NovaDesk to code..."
          className="w-full bg-transparent text-gray-200 text-sm p-3 outline-none resize-none no-scrollbar min-h-[80px] max-h-[200px]"
          rows={3}
        />
        <div className="flex justify-between items-center px-2 pb-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => setActiveBottomPanel('terminal')} title="Open terminal" className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-slate-900 transition-ui">
              <SquareTerminal size={14} />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className={`p-1.5 rounded transition-ui ${
              input.trim() && !isThinking ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
      <div className="text-[10px] text-gray-500 text-center mt-2">
        AI can make mistakes. Check code carefully.
      </div>
    </div>
  );
};
