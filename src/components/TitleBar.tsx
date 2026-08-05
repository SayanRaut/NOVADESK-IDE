// Window controls are handled natively via Electron's titleBarOverlay
import { useEditor } from '../contexts/EditorContext';
import { IDEMenuBar } from './menubar/MenuBar';
import { cn } from '../utils/cn';

export function TitleBar() {
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
        "h-8 flex items-center justify-between text-xs font-medium select-none text-slate-400 bg-slate-950 border-b border-slate-800",
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

      <div className="flex-1 flex justify-center items-center pointer-events-none hidden md:flex min-w-0 px-4">
        <span className="text-slate-300 opacity-80 truncate">{workspaceName} - NovaDesk</span>
      </div>

      {/* Placeholder space for native window controls (titleBarOverlay) */}
      <div className="w-[140px] shrink-0 [-webkit-app-region:no-drag]" />
    </div>
  );
}
