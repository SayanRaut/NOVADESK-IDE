import { useState, useEffect } from 'react';
import { GitCommit, Clock, User, ExternalLink, Globe } from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export function GitLogViewer() {
  const { currentPath, refreshVersion } = useEditor();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      if (!window.electronAPI) return;
      setLoading(true);
      
      const remoteOut = await window.electronAPI.gitRemoteUrl();
      setRemoteUrl(remoteOut);
      
      const logOut = await window.electronAPI.gitLog(100);
      if (logOut) {
        const lines = logOut.split('\n').filter(Boolean);
        const parsed = lines.map(line => {
          const parts = line.split('|');
          return {
            hash: parts[0] || '',
            message: parts[1] || '',
            author: parts[2] || '',
            date: parts[3] || ''
          };
        });
        setCommits(parsed);
      } else {
        setCommits([]);
      }
      setLoading(false);
    };
    fetchLog();
  }, [currentPath, refreshVersion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#1e1e1e] text-slate-400">
        Loading commit history...
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#1e1e1e] text-slate-400">
        No commits found or not a git repository.
      </div>
    );
  }

  // Parse github URL for hyperlinking
  let githubBaseUrl = '';
  if (remoteUrl) {
    if (remoteUrl.includes('github.com')) {
      // https://github.com/user/repo.git or git@github.com:user/repo.git
      const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
      if (match && match[1]) {
        githubBaseUrl = `https://github.com/${match[1]}`;
      }
    }
  }

  const openCommit = (hash: string) => {
    if (githubBaseUrl && window.electronAPI) {
      window.electronAPI.openExternal(`${githubBaseUrl}/commit/${hash}`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] overflow-hidden text-slate-200 p-8">
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4 shrink-0">
        <GitCommit className="w-8 h-8 text-[#c4f042]" />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Git Commit History</h1>
          {githubBaseUrl && (
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 hover:text-white cursor-pointer transition-colors" onClick={() => window.electronAPI?.openExternal(githubBaseUrl)}>
              <Globe className="w-4 h-4" />
              <span>{githubBaseUrl.replace('https://', '')}</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-4 space-y-4">
        {commits.map(commit => (
          <div key={commit.hash} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-[15px] truncate mr-4" title={commit.message}>{commit.message}</h3>
              {githubBaseUrl ? (
                <button 
                  onClick={() => openCommit(commit.hash)}
                  className="flex items-center gap-1.5 text-[12px] font-mono text-slate-300 hover:text-[#c4f042] hover:bg-black/40 shrink-0 px-2 py-0.5 rounded transition-colors"
                  title="View on GitHub"
                >
                  {commit.hash.substring(0, 7)}
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-[12px] font-mono text-slate-400 shrink-0 bg-black/40 px-2 py-0.5 rounded">
                  {commit.hash.substring(0, 7)}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-[12px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{commit.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{commit.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
