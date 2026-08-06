import { useEffect } from 'react';
import { Plus, Trash2, TerminalSquare } from 'lucide-react';
import { useTerminal } from '../../contexts/TerminalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { TerminalInstance } from './TerminalInstance';
import { cn } from '../../utils/cn';

export function TerminalPanel() {
  const { terminals, activeTerminalId, newTerminal, closeTerminal, setActiveTerminal } = useTerminal();
  const { customBackground } = useTheme();

  // Create initial terminal if none exists
  useEffect(() => {
    if (terminals.length === 0) {
      newTerminal();
    }
  }, [terminals.length, newTerminal]);

  return (
    <div className={cn("flex w-full h-full overflow-hidden", customBackground ? "bg-transparent" : "glass-surface")}>
      {/* Terminal Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {terminals.map(term => (
          <TerminalInstance 
            key={term.id} 
            id={term.id} 
            isActive={term.id === activeTerminalId} 
          />
        ))}
      </div>

      {/* Terminal Sidebar (Tabs) */}
      <div className={cn("w-48 border-l border-slate-800 flex flex-col shrink-0", customBackground ? "bg-transparent" : "glass-surface")}>
        <div className="flex items-center justify-between p-2 text-slate-300 border-b border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider">Terminals</span>
          <button 
            onClick={() => newTerminal()}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
            title="New Terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-1 space-y-1">
          {terminals.map(term => (
            <div 
              key={term.id}
              onClick={() => setActiveTerminal(term.id)}
              className={cn(
                "flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm group transition-colors",
                activeTerminalId === term.id 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <TerminalSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{term.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(term.id);
                }}
                className={cn(
                  "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                  activeTerminalId === term.id ? "hover:bg-blue-700" : "hover:bg-slate-700"
                )}
                title="Kill Terminal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
