import { useWindowControls } from '../contexts/WindowContext';
import { useEditor } from '../contexts/EditorContext';
import { Minus, Square, X } from 'lucide-react';
import { IDEMenuBar } from './menubar/MenuBar';
import { cn } from '../utils/cn';

export function TitleBar() {
  const { minimize, maximize, close } = useWindowControls();
  const { workspaceName } = useEditor();

  const menuIds = [
    'menubar/file',
    'menubar/edit',
    'menubar/selection',
    'menubar/view',
    'menubar/go',
    'menubar/run',
    'menubar/terminal'
  ];

  return (
    <div 
      className={cn(
        "h-8 flex items-center justify-between text-xs font-medium select-none text-slate-400 bg-[#141414] border-b border-[#2a2a2a]",
        "[-webkit-app-region:drag]"
      )}
    >
      <div className="flex items-center h-full">
        {/* Logo */}
        <div className="px-3 flex items-center h-full text-blue-400 font-bold text-sm tracking-wide">
          NovaDesk
        </div>
        
        {/* Menus */}
        <div className="flex items-center h-full [-webkit-app-region:no-drag]">
          <IDEMenuBar menuIds={menuIds} />
        </div>
      </div>

      <div className="flex items-center absolute left-1/2 -translate-x-1/2 pointer-events-none hidden md:flex truncate">
        <span className="text-slate-300 opacity-80 truncate max-w-[200px] lg:max-w-[400px]">{workspaceName} - NovaDesk</span>
      </div>

      <div className="flex h-full [-webkit-app-region:no-drag]">
        <button 
          onClick={minimize}
          className="h-full px-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={maximize}
          className="h-full px-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button 
          onClick={close}
          className="h-full px-4 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
