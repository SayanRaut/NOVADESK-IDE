import { useEditor } from '../contexts/EditorContext';
import { cn } from '../utils/cn';
import { Layers, Lock } from 'lucide-react';

export function TitleBar() {
  const { workspaceName } = useEditor();

  return (
    <div 
      className="h-10 w-full flex items-center justify-between text-xs font-medium select-none text-slate-400 glass-activity-bar border-b-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center h-full">
        {/* Logo */}
        <div 
          className="px-3 flex items-center gap-2 h-full text-white font-bold text-base tracking-wide cursor-default"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Layers className="w-5 h-5 text-[#c4f042]" />
          NovaDesk
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center px-4">
        <div 
          className="flex items-center gap-2 px-32 py-1.5 bg-black/40 border border-white/5 rounded-md text-slate-300 cursor-default"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Lock className="w-3 h-3 text-slate-500" />
          <span className="opacity-80 truncate">novadesk.local/{workspaceName}</span>
        </div>
      </div>

      {/* Placeholder space for native window controls (titleBarOverlay) */}
      <div className="w-[140px] h-full shrink-0" />
    </div>
  );
}
