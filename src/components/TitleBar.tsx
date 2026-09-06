import { useState, useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { Layers, Cloud, Home, Maximize2, Minimize2, Sparkles } from 'lucide-react';

export function TitleBar() {
  const { workspaceName } = useEditor();
  const { navigateTo } = useNavigation();
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="h-10 w-full flex items-center justify-between text-xs font-medium select-none text-slate-400 glass-activity-bar border-b border-white/5 px-3 z-30">
      {/* Left: Brand & Dashboard Home Button */}
      <div className="flex items-center gap-3 h-full">
        <div 
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 text-white font-bold text-sm tracking-wide cursor-pointer hover:opacity-85 transition"
        >
          <Layers className="w-4 h-4 text-[#c4f042]" />
          <span>NovaDesk</span>
        </div>

        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition text-[11px] font-semibold cursor-pointer border border-white/5"
          title="Return to Codespaces Dashboard"
        >
          <Home size={13} className="text-[#c4f042]" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => navigateTo('create')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-lime-400/10 hover:bg-lime-400/20 text-[#c4f042] transition text-[11px] font-semibold cursor-pointer border border-lime-400/20"
          title="New AI Prototype"
        >
          <Sparkles size={12} />
          <span>New AI Project</span>
        </button>
      </div>

      {/* Center: Codespace Domain Badge */}
      <div className="flex-1 flex justify-center items-center px-4">
        <div 
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 px-6 py-1 bg-black/50 border border-white/10 rounded-full text-slate-300 cursor-pointer hover:border-white/20 transition shadow-inner"
        >
          <Cloud className="w-3 h-3 text-cyan-400" />
          <span className="text-[11px] opacity-90 font-mono truncate max-w-[240px]">
            codespace/{workspaceName || 'sandbox'}
          </span>
        </div>
      </div>

      {/* Right: Fullscreen & Status Controls */}
      <div className="flex items-center gap-3 h-full">
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden md:inline">Cloud Active</span>
        </div>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-white/10 text-slate-300">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-500 text-black font-bold text-[10px] flex items-center justify-center">
            {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </div>
  );
}
