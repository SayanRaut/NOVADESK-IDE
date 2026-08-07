import { useState, useEffect } from 'react';
import { Plus, Minus, Check, GitBranch, RefreshCw, GitCompare, Link, Unlink, Upload, FolderPlus, ChevronDown } from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';

interface GitFileStatus {
  path: string;
  indexStatus: string;
  workTreeStatus: string;
}

export function SourceControlPanel() {
  const { currentPath, refreshVersion, refreshWorkspace, openFile, openWorkspace } = useEditor();
  const [staged, setStaged] = useState<GitFileStatus[]>([]);
  const [unstaged, setUnstaged] = useState<GitFileStatus[]>([]);
  const [isGitRepo, setIsGitRepo] = useState(false);
  const [message, setMessage] = useState('');
  const [connectedRemoteUrl, setConnectedRemoteUrl] = useState('');
  const [remoteInput, setRemoteInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [gitError, setGitError] = useState('');
  const [cloneDirName, setCloneDirName] = useState('');
  
  const [compareBase, setCompareBase] = useState('main');
  const [compareTarget, setCompareTarget] = useState('feature');
  
  const [branches, setBranches] = useState<{name: string, active: boolean}[]>([]);
  const [showBranches, setShowBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const fetchStatus = async () => {
    if (!window.electronAPI) return;
    const statusOut = await window.electronAPI.gitStatus();
    
    // Also fetch remote url if available
    const urlOut = await window.electronAPI.gitRemoteUrl();
    if (urlOut) {
      setConnectedRemoteUrl(urlOut);
      setRemoteInput('');
    } else {
      setConnectedRemoteUrl('');
    }
    
    // Fetch branches
    const branchesOut = await window.electronAPI.gitBranches();
    if (branchesOut) {
       const bList = branchesOut.split('\n')
         .filter(Boolean)
         .map(b => {
           const active = b.startsWith('* ');
           let name = b.replace('* ', '').trim();
           if (name.startsWith('remotes/origin/')) {
             name = name.replace('remotes/origin/', '');
           }
           return { active, name };
         })
         .filter(b => !b.name.includes('->')); // remove HEAD pointer
         
       // Deduplicate by name, preserving active status
       const bMap = new Map<string, {name: string, active: boolean}>();
       for (const b of bList) {
         if (bMap.has(b.name)) {
           if (b.active) bMap.set(b.name, b);
         } else {
           bMap.set(b.name, b);
         }
       }
       setBranches(Array.from(bMap.values()));
    }

    if (statusOut === null) {
       setIsGitRepo(false);
       setStaged([]);
       setUnstaged([]);
       return;
    }
    setIsGitRepo(true);
    
    const lines = statusOut.split('\n').filter(Boolean);
    const newStaged: GitFileStatus[] = [];
    const newUnstaged: GitFileStatus[] = [];
    
    for (const line of lines) {
       if (line.startsWith('##')) continue;
       
       const x = line[0];
       const y = line[1];
       const path = line.slice(3).split(' -> ').pop() || line.slice(3);
       
       if (x !== ' ' && x !== '?') {
          newStaged.push({ path, indexStatus: x, workTreeStatus: y });
       }
       if (y !== ' ' && y !== '?') {
          newUnstaged.push({ path, indexStatus: x, workTreeStatus: y });
       }
       if (x === '?' && y === '?') {
          newUnstaged.push({ path, indexStatus: '?', workTreeStatus: '?' });
       }
    }
    
    setStaged(newStaged);
    setUnstaged(newUnstaged);
  };

  useEffect(() => {
    fetchStatus();
  }, [currentPath, refreshVersion]);

  const handleStage = async (path: string) => {
    if (window.electronAPI) {
      await window.electronAPI.gitAdd(path);
      refreshWorkspace();
    }
  };

  const handleUnstage = async (path: string) => {
    if (window.electronAPI) {
      await window.electronAPI.gitUnstage(path);
      refreshWorkspace();
    }
  };

  const handleCommit = async () => {
    if (!message.trim() || staged.length === 0) return;
    setGitError('');
    if (window.electronAPI) {
      try {
        await window.electronAPI.gitCommit(message);
        setMessage('');
        refreshWorkspace();
      } catch (e: any) {
        setGitError((e.message || 'Commit failed. Check your Git identity config.').replace(/^Error invoking remote method '.*?': Error: /, ''));
      }
    }
  };

  const handlePush = async () => {
    const activeBranch = branches.find(b => b.active)?.name || 'main';
    setGitError('');
    if (window.electronAPI) {
      try {
        await window.electronAPI.gitPush(activeBranch);
        setGitError('Successfully pushed!'); // actually a success message
        setTimeout(() => setGitError(''), 3000);
      } catch (e: any) {
        setGitError((e.message || 'Push failed. Are you authenticated?').replace(/^Error invoking remote method '.*?': Error: /, ''));
      }
    }
  };

  const handleCheckout = async (branch: string, isNew: boolean = false) => {
    setGitError('');
    if (window.electronAPI) {
      try {
        await window.electronAPI.gitCheckout(branch, isNew);
        if (isNew) setNewBranchName('');
        setShowBranches(false);
        refreshWorkspace();
      } catch (e: any) {
        setGitError((e.message || 'Checkout failed.').replace(/^Error invoking remote method '.*?': Error: /, ''));
      }
    }
  };

  const handleAddFromDialog = async () => {
    setGitError('');
    if (window.electronAPI) {
      try {
        const success = await window.electronAPI.gitAddFromDialog();
        if (success) refreshWorkspace();
      } catch (e: any) {
        setGitError((e.message || 'Failed to add files.').replace(/^Error invoking remote method '.*?': Error: /, ''));
      }
    }
  };

  const handleInit = async () => {
    if (window.electronAPI) {
      await window.electronAPI.gitInit();
      refreshWorkspace();
    }
  };

  const handleClone = async () => {
    if (!remoteInput.trim() || !window.electronAPI || !currentPath) return;
    setErrorMsg('');
    try {
      let folderName = cloneDirName.trim();
      if (!folderName) {
         const match = remoteInput.match(/\/([^/]+)(?:\.git)?$/);
         folderName = match ? match[1] : 'cloned-repo';
      }
      const newWorkspacePath = await window.electronAPI.cloneRepository(remoteInput.trim(), currentPath, folderName);
      openWorkspace(newWorkspacePath);
    } catch (e: any) {
      setErrorMsg((e.message || 'Clone failed. Make sure URL is correct and folder name is unique.').replace(/^Error invoking remote method '.*?': Error: /, ''));
    }
  };

  const handleConnectRemote = async () => {
    if (!remoteInput.trim() || !window.electronAPI) return;
    setErrorMsg('');
    try {
      await window.electronAPI.gitInit();
      await window.electronAPI.gitRemoteAdd(remoteInput.trim());
      setConnectedRemoteUrl(remoteInput.trim());
      refreshWorkspace();
    } catch (e: any) {
      setErrorMsg((e.message || 'Remote connect failed.').replace(/^Error invoking remote method '.*?': Error: /, ''));
    }
  };

  const handleStageAll = async () => {
    if (window.electronAPI) {
      await window.electronAPI.gitAddAll();
      refreshWorkspace();
    }
  };
  
  const handleDisconnectRemote = async () => {
    if (window.electronAPI) {
      await window.electronAPI.gitRemoteRemove();
      setConnectedRemoteUrl('');
      setRemoteInput('');
      refreshWorkspace();
    }
  };

  if (!isGitRepo) {
    return (
      <div className="flex flex-col h-full p-4 text-slate-400 gap-4 overflow-y-auto">
        <div className="flex flex-col items-center text-center gap-2 mb-4">
          <GitBranch className="w-10 h-10 text-slate-600" />
          <p className="text-sm text-slate-300">No source control providers registered.</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Local Repository</label>
          <button 
            onClick={handleInit}
            className="w-full px-4 py-2 bg-[#c4f042] text-black rounded text-xs font-semibold hover:bg-[#a3cc3b] transition-colors"
          >
            Initialize Repository
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-xs font-semibold text-slate-500 uppercase">Remote Repository</label>
          <input
            type="text"
            value={remoteInput}
            onChange={(e) => setRemoteInput(e.target.value)}
            placeholder="HTTPS .git URL"
            className="w-full bg-black/40 border border-white/10 focus:border-[#c4f042]/50 outline-none rounded p-2 text-xs text-slate-200 placeholder:text-slate-500"
          />
          <input
            type="text"
            value={cloneDirName}
            onChange={(e) => setCloneDirName(e.target.value)}
            placeholder="Folder name (optional for clone)"
            className="w-full bg-black/40 border border-white/10 focus:border-[#c4f042]/50 outline-none rounded p-2 text-xs text-slate-200 placeholder:text-slate-500 mt-1"
          />
          {errorMsg && <div className="text-rose-400 text-[11px] bg-rose-400/10 p-2 rounded">{errorMsg}</div>}
          <div className="flex gap-2 mt-1">
            <button 
              onClick={handleClone}
              disabled={!remoteInput.trim()}
              className="flex-1 px-4 py-2 bg-white/10 text-white rounded text-xs font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Clone Repo
            </button>
            <button 
              onClick={handleConnectRemote}
              disabled={!remoteInput.trim()}
              className="flex-1 px-4 py-2 bg-white/10 text-white rounded text-xs font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Connect Remote
            </button>
          </div>
        </div>
      </div>
    );
  }

  const FileItem = ({ item, actionIcon: ActionIcon, onAction }: { item: GitFileStatus, actionIcon: React.ElementType, onAction: () => void }) => {
    const filename = item.path.split(/[/\\]/).pop();
    const folder = item.path.substring(0, item.path.length - (filename?.length || 0) - 1);
    
    return (
      <div className="group flex items-center justify-between px-2 py-1 text-[13px] hover:bg-white/5 cursor-pointer select-none">
        <div className="flex items-center flex-1 min-w-0 overflow-hidden" onClick={() => openFile(`${currentPath}/${item.path}`)}>
          <span className="truncate mr-1 text-slate-300">{filename}</span>
          <span className="truncate text-slate-500 text-[10px]">{folder}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-slate-500 text-[10px] uppercase font-bold w-3 text-center">{item.indexStatus !== ' ' && item.indexStatus !== '?' ? item.indexStatus : item.workTreeStatus}</span>
          <button onClick={(e) => { e.stopPropagation(); onAction(); }} className="p-0.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
            <ActionIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-300">
      
      {/* Remote connection area for active git repos */}
      <div className="p-3 border-b border-white/5 shrink-0 bg-black/20">
         {connectedRemoteUrl ? (
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                 <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                 <span className="text-[11px] text-slate-300 truncate" title={connectedRemoteUrl}>{connectedRemoteUrl}</span>
              </div>
              <button onClick={handleDisconnectRemote} title="Disconnect Remote" className="p-1 hover:bg-white/10 rounded text-rose-400/80 hover:text-rose-400 transition-colors ml-2 shrink-0">
                 <Unlink className="w-3.5 h-3.5" />
              </button>
           </div>
         ) : (
           <div className="flex flex-col gap-1">
             <div className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Add Remote</div>
             <div className="flex items-center gap-2">
               <input 
                 value={remoteInput}
                 onChange={e => setRemoteInput(e.target.value)}
                 placeholder="HTTPS .git URL"
                 className="flex-1 min-w-0 bg-black/40 border border-white/10 focus:border-[#c4f042]/50 outline-none rounded p-1.5 text-[11px] text-slate-200"
               />
               <button 
                 onClick={handleConnectRemote}
                 disabled={!remoteInput.trim()}
                 className="px-2 py-1.5 bg-[#c4f042]/10 text-[#c4f042] hover:bg-[#c4f042]/20 rounded text-[11px] transition-colors disabled:opacity-50"
               >
                 Connect
               </button>
             </div>
             {errorMsg && <div className="text-rose-400 text-[10px] mt-1">{errorMsg}</div>}
           </div>
         )}
      </div>

      <div className="flex-1 overflow-y-auto pt-2">
        {staged.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Staged Changes</span>
              <span className="bg-white/10 px-1.5 rounded-full">{staged.length}</span>
            </div>
            {staged.slice(0, 100).map(item => (
              <FileItem key={item.path} item={item} actionIcon={Minus} onAction={() => handleUnstage(item.path)} />
            ))}
            {staged.length > 100 && (
              <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                + {staged.length - 100} more files...
              </div>
            )}
          </div>
        )}

        {unstaged.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Changes</span>
              <span className="bg-white/10 px-1.5 rounded-full">{unstaged.length}</span>
            </div>
            {unstaged.slice(0, 100).map(item => (
              <FileItem key={item.path} item={item} actionIcon={Plus} onAction={() => handleStage(item.path)} />
            ))}
            {unstaged.length > 100 && (
              <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                + {unstaged.length - 100} more files...
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Action Toolbar & Message Bar placed at the bottom */}
      <div className="p-3 shrink-0 flex flex-col gap-3 border-t border-white/5 bg-black/20">
        <div className="flex flex-col gap-2">
          {/* Compare Branches Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1">
              <input value={compareBase} onChange={e => setCompareBase(e.target.value)} placeholder="Base" className="w-1/2 min-w-0 bg-black/40 border border-[#c4f042]/20 focus:border-[#c4f042]/60 outline-none rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 transition-colors" />
              <input value={compareTarget} onChange={e => setCompareTarget(e.target.value)} placeholder="Compare" className="w-1/2 min-w-0 bg-black/40 border border-[#c4f042]/20 focus:border-[#c4f042]/60 outline-none rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 transition-colors" />
            </div>
            <button onClick={() => openFile(`git-diff://branches?base=${compareBase}&compare=${compareTarget}`)} title="View Differences" className="p-1.5 bg-[#c4f042]/10 hover:bg-[#c4f042]/20 rounded text-[#c4f042] transition-colors">
              <GitCompare className="w-4 h-4" />
            </button>
          </div>
          
          {/* Stage All Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 pl-1 font-medium uppercase tracking-wider">Stage All</span>
            <button onClick={handleStageAll} title="Stage All Changes" className="p-1.5 bg-[#c4f042]/10 hover:bg-[#c4f042]/20 rounded text-[#c4f042] transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Add Files Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 pl-1 font-medium uppercase tracking-wider">Add Files/Folder</span>
            <button onClick={handleAddFromDialog} title="Select Files to Stage" className="p-1.5 bg-[#c4f042]/10 hover:bg-[#c4f042]/20 rounded text-[#c4f042] transition-colors">
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Refresh Row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 pl-1 font-medium uppercase tracking-wider">Refresh</span>
            <button onClick={() => refreshWorkspace()} title="Refresh Status" className="p-1.5 bg-[#c4f042]/10 hover:bg-[#c4f042]/20 rounded text-[#c4f042] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="mt-2 pt-3 border-t border-white/5 relative">
          <button 
            onClick={() => setShowBranches(!showBranches)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs text-slate-300 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
               <GitBranch className="w-3.5 h-3.5 text-[#c4f042]" />
               <span className="font-semibold">{branches.find(b => b.active)?.name || 'No Branch'}</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showBranches && (
            <div className="absolute bottom-[calc(100%+4px)] left-0 w-full bg-[#1e1e1e] border border-white/10 rounded shadow-xl flex flex-col p-1 max-h-48 overflow-y-auto z-50">
               {branches.map(b => (
                 <button 
                   key={b.name} 
                   onClick={() => handleCheckout(b.name)}
                   className={`text-left px-2 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2 ${b.active ? 'text-[#c4f042]' : 'text-slate-300'}`}
                 >
                   {b.active && <Check className="w-3 h-3 shrink-0" />}
                   <span className={b.active ? '' : 'ml-5'}>{b.name}</span>
                 </button>
               ))}
               <div className="flex items-center gap-1 mt-1 p-1 border-t border-white/10">
                 <input 
                   value={newBranchName} 
                   onChange={e => setNewBranchName(e.target.value)} 
                   placeholder="New branch name" 
                   className="flex-1 min-w-0 bg-black/40 border border-white/10 outline-none rounded px-1.5 py-1 text-xs text-slate-200"
                 />
                 <button onClick={() => handleCheckout(newBranchName, true)} disabled={!newBranchName.trim()} className="p-1 bg-[#c4f042]/10 hover:bg-[#c4f042]/20 text-[#c4f042] rounded disabled:opacity-50">
                   <Plus className="w-3.5 h-3.5" />
                 </button>
               </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {gitError && (
             <div className={`text-[10px] p-2 rounded ${gitError.includes('Successfully') ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono'}`}>
                {gitError}
             </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit)"
            className="w-full bg-black/40 border border-[#c4f042]/20 focus:border-[#c4f042]/60 outline-none rounded p-2 text-[13px] resize-none h-16 text-slate-200 placeholder:text-slate-500 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleCommit();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCommit}
              disabled={!message.trim() || staged.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-[#c4f042] text-black rounded text-[12px] font-semibold hover:bg-[#a3cc3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              Commit
            </button>
            <button
              onClick={handlePush}
              disabled={!connectedRemoteUrl}
              title={connectedRemoteUrl ? "Push to remote" : "Add a remote repository first to push"}
              className="px-3 py-1.5 bg-white/10 text-white rounded hover:bg-white/20 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
