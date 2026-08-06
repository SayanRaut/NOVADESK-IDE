import { Bot, ChevronDown } from 'lucide-react';
import { useAI } from '../../contexts/AIContext';

export const AgentStatus = () => {
  const { agentMode, setAgentMode, selectedModel, setSelectedModel, activeAgent, isThinking } = useAI();

  return (
    <div className="px-4 py-3 bg-[var(--panel-bg)] border-b border-[var(--border-color)] flex justify-between items-center z-10">
      <div className="flex items-center gap-2">
        <Bot size={16} className="text-[var(--accent)]" />
        <select 
          value={agentMode}
          onChange={(e) => setAgentMode(e.target.value as 'chat' | 'planner' | 'coding' | 'auto')}
          className="bg-transparent text-sm font-medium text-gray-200 outline-none cursor-pointer appearance-none"
        >
          <option value="chat">Chat Mode</option>
          <option value="planner">Plan</option>
          <option value="coding">Code</option>
          <option value="auto">Auto</option>
        </select>
        <ChevronDown size={12} className="text-gray-500 pointer-events-none -ml-1" />
      </div>

      <div className="flex items-center gap-1">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="glass-panel text-xs text-gray-400 p-1 rounded outline-none border border-[var(--border-color)] cursor-pointer"
        >
          <optgroup label="Gemini">
            <option value="gemini_flash_fast">Flash - Fast</option>
            <option value="gemini_flash_balanced">Flash - Balanced</option>
            <option value="gemini_flash_thinking">Flash - Think</option>
          </optgroup>
          <optgroup label="Claude">
            <option value="claude_sonnet">Claude Sonnet</option>
            <option value="claude_opus">Claude Opus</option>
          </optgroup>
          <optgroup label="OpenAI">
            <option value="gpt_oss">GPT OSS 120B</option>
          </optgroup>
        </select>
      </div>
      {isThinking && <span className="sr-only">{activeAgent ? `${activeAgent} agent is working` : 'AI is working'}</span>}
    </div>
  );
};
