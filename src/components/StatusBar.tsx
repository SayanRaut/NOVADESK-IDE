import { useEffect, useState, useRef } from 'react';
import { GitBranch, XCircle, AlertTriangle, Bell, Palette, Terminal as TerminalIcon, Server, ServerOff, LogIn, Check, ZoomIn, ZoomOut, RotateCcw, MoreHorizontal, Search, Settings, Minus, Plus } from 'lucide-react';
import { useEditor } from '../contexts/EditorContext';
import { useProblems } from '../contexts/ProblemsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTerminal } from '../contexts/TerminalContext';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { usePanel } from '../contexts/PanelContext';
import { useUI } from '../contexts/UIContext';
import { http } from '../services/http';

export function StatusBar() {
  const { cursorPosition, editorGroups, activeGroupId, openFile } = useEditor();
  const { problems } = useProblems();
  const { theme, setTheme } = useTheme();
  const { terminals } = useTerminal();
  const { accessToken, logout } = useAuth();
  const { setBottomPanelOpen } = useLayout();
  const { setActiveTab } = usePanel();
  const { zoomLevel, setZoomLevel } = useUI();
  
  const activeFile = editorGroups.find(g => g.id === activeGroupId)?.activeFile;
  const [gitBranch, setGitBranch] = useState<string>('');
  const [lastCommitDate, setLastCommitDate] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline'>('offline');

  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(event.target as Node)) {
        setShowZoomMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchGit = async () => {
      if (window.electronAPI) {
        try {
          const branchesOut = await window.electronAPI.gitBranches();
          if (branchesOut) {
             const lines = branchesOut.split('\n');
             const active = lines.find(l => l.startsWith('* '));
             if (active) setGitBranch(active.substring(2));
          } else {
             setGitBranch('');
          }
          
          const logOut = await window.electronAPI.gitLog(1);
          if (logOut) {
             const parts = logOut.split('|');
             if (parts.length >= 4) {
                 setLastCommitDate(parts[3]);
             }
          } else {
             setLastCommitDate('');
          }
        } catch (e) {
          console.error('Git fetch error', e);
        }
      }
    };
    fetchGit();

    const checkBackend = async () => {
      try {
        await http.get('/health', { timeout: 5000 });
        setBackendStatus('connected');
      } catch {
        setBackendStatus('offline');
      }
    };
    checkBackend();
    
    // In a real app we'd poll this or trigger on file save/folder open
    const interval = setInterval(fetchGit, 10000);
    const backendInterval = setInterval(checkBackend, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(backendInterval);
    };
  }, []);

  let language = 'Plain Text';
  if (activeFile) {
    const ext = activeFile.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx'].includes(ext!)) language = 'TypeScript React';
    else if (['js', 'jsx'].includes(ext!)) language = 'JavaScript React';
    else if (ext === 'json') language = 'JSON';
    else if (ext === 'md') language = 'Markdown';
    else if (ext === 'css') language = 'CSS';
    else if (ext === 'html') language = 'HTML';
    else if (ext === 'py') language = 'Python';
  }

  const allProblems = Object.values(problems || {}).flat();
  const errorCount = allProblems.filter(p => p.severity >= 8).length;
  const warningCount = allProblems.filter(p => p.severity >= 4 && p.severity < 8).length;

  return (
    <div className="h-6 glass-panel bg-emerald-500/10 text-[var(--foreground)] border-t border-emerald-500/20 flex items-center justify-between px-2 text-[11px] select-none shrink-0 z-20 overflow-visible relative">
      {/* Left side */}
      <div className="flex items-center h-full gap-0.5 overflow-hidden flex-shrink min-w-0">
        {gitBranch && (
          <button 
            onClick={() => openFile('git-log://history')} 
            className="flex items-center h-full px-1.5 hover:bg-white/20 transition-colors gap-1.5 shrink-0 truncate"
            title="View Git History"
          >
            <GitBranch className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[100px] font-medium">{gitBranch}</span>
            {lastCommitDate && (
              <span className="text-slate-400 ml-1 text-[10px] hidden sm:inline">Last commit: {lastCommitDate}</span>
            )}
          </button>
        )}
        
        <button className="flex items-center h-full px-1.5 hover:bg-white/20 transition-colors gap-1.5 shrink-0" title="Backend Status">
          {backendStatus === 'connected' ? (
            <>
              <Server className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-green-400 hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <ServerOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-red-400 hidden sm:inline">Offline</span>
            </>
          )}
        </button>

        <button 
          className="flex items-center h-full px-1.5 hover:bg-white/20 transition-colors gap-1.5 shrink-0"
          onClick={() => {
            setBottomPanelOpen(true);
            setActiveTab('problems');
          }}
          title="View Problems"
        >
          {errorCount === 0 && warningCount === 0 && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorCount}</span>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{warningCount}</span>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center h-full gap-0.5 shrink-0">

        {/* Zoom Dropdown */}
        <div className="relative h-full flex items-center" ref={zoomMenuRef}>
          <button 
            className="flex items-center h-full px-1.5 hover:bg-white/20 transition-colors gap-1.5 shrink-0"
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            onMouseEnter={() => setShowZoomMenu(true)}
            title="Zoom Controls"
          >
            <Search className="w-3 h-3 shrink-0" />
            <span>{Math.round(zoomLevel * 100)}%</span>
          </button>
          
          {showZoomMenu && (
            <div 
              className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-md shadow-xl z-50 text-slate-200"
              onMouseLeave={() => setShowZoomMenu(false)}
            >
              {/* Caret arrow */}
              <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[var(--panel-bg)] border-b border-r border-[var(--border-color)] rotate-45" />
              
              <div className="flex items-center px-2 py-1.5 gap-2 relative z-10 bg-[var(--panel-bg)] rounded-md">
                <button 
                  className="p-1 hover:bg-[var(--hover-bg)] rounded transition-colors text-slate-400 hover:text-slate-200"
                  onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <span className="min-w-[1.5rem] text-center text-[13px]">{parseFloat(zoomLevel.toFixed(1))}</span>
                
                <button 
                  className="p-1 hover:bg-[var(--hover-bg)] rounded transition-colors text-slate-400 hover:text-slate-200"
                  onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.1))}
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <button 
                  className="px-2 py-1 hover:bg-[var(--hover-bg)] rounded transition-colors text-slate-400 hover:text-slate-200 text-[12px]"
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center h-full px-1.5 hidden md:flex shrink-0">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        </div>

        <button className="flex items-center h-full px-1.5 hover:bg-white/20 transition-colors gap-1.5 shrink-0 hidden sm:flex" title="Open Terminals">
          <TerminalIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{terminals.length > 0 ? `${terminals.length}` : '0'}</span>
        </button>
        
        <button className="flex items-center h-full px-1.5 hover:bg-white/20 transition-colors shrink-0 hidden md:flex">
          <span className="truncate max-w-[100px]">{language}</span>
        </button>

        {/* More Options Dropdown (3 dots) */}
        <div className="relative h-full flex items-center" ref={moreMenuRef}>
          <button 
            className="flex items-center h-full px-1.5 hover:bg-white/20 transition-colors shrink-0"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showMoreMenu && (
            <div className="absolute bottom-full right-0 mb-1 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-md shadow-xl overflow-hidden min-w-[160px] z-50 text-slate-200 py-1 flex flex-col">
              
              <div className="px-3 py-1.5 text-slate-400 flex justify-between items-center text-[10px] uppercase font-semibold">
                <span>Spaces</span>
                <span className="text-gray-200">2</span>
              </div>
              <div className="px-3 py-1.5 text-slate-400 flex justify-between items-center text-[10px] uppercase font-semibold">
                <span>Encoding</span>
                <span className="text-slate-200">UTF-8</span>
              </div>
              
              <div className="h-px bg-[var(--border-color)] my-1 mx-2" />
              
              <button 
                className="flex items-center px-3 py-1.5 hover:bg-[var(--hover-bg)] gap-2 w-full text-left transition-colors"
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setShowMoreMenu(false);
                }}
              >
                <Palette className="w-4 h-4 text-slate-400" />
                <span>Toggle Theme ({theme})</span>
              </button>
              
              <button className="flex items-center px-3 py-1.5 hover:bg-[var(--hover-bg)] gap-2 w-full text-left transition-colors">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </button>

            </div>
          )}
        </div>

        {/* Auth Button */}
        {accessToken === 'local' && (
          <button 
            onClick={() => logout()}
            className="flex items-center h-full px-2.5 hover:bg-blue-700 bg-blue-800 transition-colors gap-1.5 font-medium border-l border-white/20 shrink-0"
            title="Sign in to Cloud"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
}
