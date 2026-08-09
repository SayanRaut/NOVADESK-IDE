import { useAI } from '../../contexts/AIContext';
import { Play, MessageSquareEdit } from 'lucide-react';

export function PlanToolbar() {
  const { sendMessage } = useAI();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[var(--border-color)] z-20">
      <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#c4f042] animate-pulse" />
        <span className="text-[#c4f042]">AI Architect:</span> 
        <span className="text-slate-400">Plan Review Mode</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => sendMessage('I want to make changes to the plan.')}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-slate-300 text-xs font-medium transition-colors"
        >
          <MessageSquareEdit size={14} />
          Feedback
        </button>
        <button
          onClick={() => sendMessage('/approve_plan')}
          className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#c4f042] hover:bg-[#a3cc3b] text-black text-xs font-semibold shadow-sm transition-colors"
        >
          <Play size={14} fill="currentColor" />
          Proceed (Implement)
        </button>
      </div>
    </div>
  );
}
