import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { FileCode, FolderOpen, GitBranch, Sparkles } from 'lucide-react';

export const WelcomePage = () => {
  const { openWorkspace } = useEditor();
  const { logout } = useAuth();
  const { setActiveSidebar } = useUI();
  const [dialog, setDialog] = useState<'project' | 'clone' | null>(null);
  const [parentDirectory, setParentDirectory] = useState('');
  const [projectName, setProjectName] = useState('');
  const [template, setTemplate] = useState('web');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseLocation = async () => {
    const directory = await window.electronAPI?.chooseFolder();
    if (directory) setParentDirectory(directory);
  };
  const submit = async () => {
    if (!parentDirectory || !projectName.trim() || !window.electronAPI || !dialog) return;
    setIsWorking(true); setError(null);
    try {
      const workspace = dialog === 'project'
        ? await window.electronAPI.createProject(parentDirectory, projectName.trim(), template)
        : await window.electronAPI.cloneRepository(repositoryUrl, parentDirectory, projectName.trim());
      openWorkspace(workspace);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The workspace could not be created.'); }
    finally { setIsWorking(false); }
  };

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-[var(--background)] p-8 overflow-y-auto">
      <div className="max-w-3xl w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to NovaDesk</h1>
          <p className="text-gray-400 text-lg">The intelligent, production-ready development environment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Start Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Start</h2>
            <div className="space-y-2">
              <button onClick={() => { setDialog('project'); setError(null); }} className="w-full flex items-center gap-3 p-3 rounded hover:bg-[var(--hover-bg)] text-left text-blue-400 transition-ui">
                <FileCode size={20} />
                <span>New Project</span>
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const dir = await window.electronAPI?.openFolder();
                    if (dir) openWorkspace(dir);
                  } catch { /* Surface filesystem errors when a notification layer is added. */ }
                }}
                className="w-full flex items-center gap-3 p-3 rounded hover:bg-[var(--hover-bg)] text-left text-gray-300 transition-ui"
              >
                <FolderOpen size={20} />
                <span>Open Folder...</span>
              </button>

              <button onClick={() => { setDialog('clone'); setError(null); }} className="w-full flex items-center gap-3 p-3 rounded hover:bg-[var(--hover-bg)] text-left text-gray-300 transition-ui">
                <GitBranch size={20} />
                <span>Clone Git Repository...</span>
              </button>

              <button onClick={() => setActiveSidebar('ai')} className="w-full flex items-center gap-3 p-3 rounded hover:bg-[var(--hover-bg)] text-left text-purple-400 transition-ui">
                <Sparkles size={20} />
                <span>AI Quick Start</span>
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Recent</h2>
            <div className="space-y-1 text-sm">
              <p className="p-3 text-gray-500">Recent workspaces will appear here as you open folders.</p>
            </div>
          </div>

        </div>
        
        <div className="mt-16 pt-8 border-t border-[var(--border-color)]">
          <button 
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-300 transition-ui"
          >
            Sign Out
          </button>
        </div>

      </div>
      {dialog && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-6">
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="w-full max-w-lg rounded-xl border border-[#383838] bg-[#191919] p-6 shadow-2xl">
          <h2 className="text-xl font-semibold">{dialog === 'project' ? 'Create a new project' : 'Clone a Git repository'}</h2>
          <p className="mt-1 text-sm text-gray-500">{dialog === 'project' ? 'NovaDesk will create a small starter workspace.' : 'Clone a repository into a new folder.'}</p>
          {dialog === 'clone' && <label className="mt-5 block text-sm text-gray-300">Repository URL<input required value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository.git" className="mt-1 h-10 w-full rounded border border-[#3a3a3a] bg-[#101010] px-3 outline-none focus:border-blue-500" /></label>}
          <label className="mt-4 block text-sm text-gray-300">Project folder name<input required value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="my-project" className="mt-1 h-10 w-full rounded border border-[#3a3a3a] bg-[#101010] px-3 outline-none focus:border-blue-500" /></label>
          {dialog === 'project' && <label className="mt-4 block text-sm text-gray-300">Starter template<select value={template} onChange={(event) => setTemplate(event.target.value)} className="mt-1 h-10 w-full rounded border border-[#3a3a3a] bg-[#101010] px-3 outline-none focus:border-blue-500"><option value="web">Web app (Vite)</option><option value="python">Python</option><option value="html">HTML, CSS and JavaScript</option></select></label>}
          <div className="mt-4"><p className="text-sm text-gray-300">Location</p><div className="mt-1 flex gap-2"><input required value={parentDirectory} readOnly placeholder="Choose a parent folder" className="h-10 min-w-0 flex-1 rounded border border-[#3a3a3a] bg-[#101010] px-3 text-sm text-gray-400 outline-none" /><button type="button" onClick={() => void chooseLocation()} className="rounded bg-[#2a2a2a] px-3 text-sm hover:bg-[#363636]">Browse</button></div></div>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDialog(null)} className="rounded px-3 py-2 text-sm text-gray-300 hover:bg-[#292929]">Cancel</button><button disabled={isWorking || !parentDirectory || !projectName.trim() || (dialog === 'clone' && !repositoryUrl.trim())} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">{isWorking ? 'Working…' : dialog === 'project' ? 'Create Project' : 'Clone Repository'}</button></div>
        </form>
      </div>}
    </div>
  );
};
