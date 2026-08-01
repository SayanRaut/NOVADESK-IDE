import { useEffect, useState } from 'react';
import { GitBranch, XCircle, AlertTriangle, Bell, Palette, Terminal as TerminalIcon, Server, ServerOff, LogIn } from 'lucide-react';
import { useEditor } from '../contexts/EditorContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTerminal } from '../contexts/TerminalContext';
import { useAuth } from '../contexts/AuthContext';
import { http } from '../services/http';

export function StatusBar() {
  const { cursorPosition, editorGroups, activeGroupId } = useEditor();
  const { theme, setTheme } = useTheme();
  const { terminals } = useTerminal();
  const { accessToken, logout } = useAuth();
  const activeFile = editorGroups.find(g => g.id === activeGroupId)?.activeFile;
  const [gitBranch, setGitBranch] = useState<string>('main');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline'>('offline');

  useEffect(() => {
    const fetchGit = async () => {
      if (window.electronAPI) {
        try {
          const branch = await window.electronAPI.gitStatus();
          if (branch) setGitBranch(branch);
        } catch (e) {
          console.error('Git status error', e);
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

  return (
    <div className="h-6 bg-blue-600 text-white flex items-center justify-between px-2 text-[11px] select-none shrink-0 z-20">
      {/* Left side */}
      <div className="flex items-center h-full">
        <button className="flex items-center h-full px-2 hover:bg-white/20 transition-colors gap-1.5">
          <GitBranch className="w-3.5 h-3.5" />
          <span>{gitBranch}</span>
        </button>
        
        <button className="flex items-center h-full px-2 hover:bg-white/20 transition-colors gap-1.5" title="Backend Status">
          {backendStatus === 'connected' ? (
            <>
              <Server className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Connected</span>
            </>
          ) : (
            <>
              <ServerOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400">Backend Offline</span>
            </>
          )}
        </button>

        <button className="flex items-center h-full px-2 hover:bg-white/20 transition-colors gap-1.5">
          <XCircle className="w-3.5 h-3.5" />
          <span>0</span>
          <AlertTriangle className="w-3.5 h-3.5 ml-1" />
          <span>0</span>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center h-full">

        <div className="flex items-center h-full px-2">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        </div>

        <button className="flex items-center h-full px-2 hover:bg-white/20 transition-colors gap-1.5" title="Open Terminals">
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>{terminals.length > 0 ? `${terminals.length} Running` : 'Idle'}</span>
        </button>

        <div className="flex items-center h-full px-2">
          <span>Spaces: 2</span>
        </div>

        <div className="flex items-center h-full px-2">
          <span>UTF-8</span>
        </div>
        
        <button className="flex items-center h-full px-2 hover:bg-white/20 transition-colors">
          <span>{language}</span>
        </button>

        <button 
          className="flex items-center h-full px-2 hover:bg-white/20 transition-colors gap-1.5"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="capitalize">{theme}</span>
        </button>

        <button className="flex items-center h-full px-2 hover:bg-white/20 transition-colors">
          <Bell className="w-3.5 h-3.5" />
        </button>

        {accessToken === 'local' && (
          <button 
            onClick={() => logout()}
            className="flex items-center h-full px-3 hover:bg-blue-700 bg-blue-800 transition-colors gap-1.5 font-medium border-l border-white/20"
            title="Sign in to Cloud"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
}
