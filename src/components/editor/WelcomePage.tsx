import { useEditor } from '../../contexts/EditorContext';
import { FolderPlus, GitBranch, Play, Plus, Clock, MessageSquare, ExternalLink } from 'lucide-react';

export function WelcomePage() {
  const { openWorkspace, recentWorkspaces } = useEditor();

  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.openFolder();
      if (folder) openWorkspace(folder);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-300 bg-slate-950 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-light text-slate-100 mb-2 tracking-wide">NovaDesk</h1>
        <p className="text-slate-400 mb-10 text-sm">The modern, AI-powered IDE for productive developers.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Start</h2>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleOpenFolder}
                className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded transition-colors text-left"
              >
                <FolderPlus className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-medium">Open Folder...</div>
                  <div className="text-xs text-slate-500">Open a local project</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded transition-colors text-left">
                <GitBranch className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium">Clone Repository...</div>
                  <div className="text-xs text-slate-500">Clone a repo from GitHub</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded transition-colors text-left">
                <Plus className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm font-medium">New Project...</div>
                  <div className="text-xs text-slate-500">Start from a template</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded transition-colors text-left">
                <Play className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-sm font-medium">AI Quick Start...</div>
                  <div className="text-xs text-slate-500">Generate a new project with AI</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Recent</h2>
            <div className="flex flex-col gap-2">
              {recentWorkspaces.length > 0 ? (
                recentWorkspaces.map(path => (
                  <div 
                    key={path}
                    onClick={() => openWorkspace(path)}
                    className="flex flex-col gap-1 p-2 hover:bg-slate-800 rounded transition-colors cursor-pointer text-left"
                  >
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {path.split(/[\\/]/).filter(Boolean).at(-1) ?? 'Workspace'}
                    </div>
                    <div className="text-xs text-slate-500 pl-6 truncate">{path}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 italic">No recent workspaces</div>
              )}
            </div>

            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4 mt-8">Help</h2>
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" /> Documentation
              </button>
              <button className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" /> Community Forum
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
