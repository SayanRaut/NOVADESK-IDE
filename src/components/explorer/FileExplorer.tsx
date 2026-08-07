import { useEffect, useState, useRef, createContext, useContext } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FileJson, FileCode, FileText, FilePlus2, FolderPlus, RefreshCw, Trash2, Edit2, Copy, ExternalLink, MessageSquare, Plus, ListTree } from 'lucide-react';
import { useEditor, type FileTree } from '../../contexts/EditorContext';
import { useLayout } from '../../contexts/LayoutContext';
import { usePanel } from '../../contexts/PanelContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { cn } from '../../utils/cn';

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode size={14} className="text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-yellow-400" />;
  if (name.endsWith('.md')) return <FileText size={14} className="text-slate-400" />;
  return <File size={14} className="text-slate-300" />;
};

interface ContextMenuState {
  x: number;
  y: number;
  item: FileTree;
}

const ExplorerContext = createContext<{
  setContextMenu: (state: ContextMenuState | null) => void;
  setRenamingItem: (path: string | null) => void;
  renamingItem: string | null;
  triggerCreate: (type: 'file' | 'folder', parentPath: string) => void;
  isCreating: { type: 'file' | 'folder', path: string } | null;
  setIsCreating: (v: { type: 'file' | 'folder', path: string } | null) => void;
  selectedFolder: string | null;
  setSelectedFolder: (path: string | null) => void;
  collapseVersion: number;
  selectedPaths: Set<string>;
  setSelectedPaths: React.Dispatch<React.SetStateAction<Set<string>>>;
} | null>(null);

const InlineCreator = ({ type, parentPath, level, onComplete }: { type: 'file' | 'folder', parentPath: string, level: number, onComplete: () => void }) => {
  const { refreshWorkspace, openFile } = useEditor();
  const [name, setName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    if (!name.trim() || isSubmitting) {
      onComplete();
      return;
    }
    setIsSubmitting(true);
    try {
      if (window.electronAPI) {
         const createdPath = type === 'file'
            ? await window.electronAPI.createFile(parentPath, name.trim())
            : await window.electronAPI.createFolder(parentPath, name.trim());
         refreshWorkspace();
         if (type === 'file') openFile(createdPath);
      }
    } catch (e) {
      console.error(e);
    }
    onComplete();
  };

  return (
    <div 
      className="flex items-center gap-1 py-1 cursor-pointer transition-colors select-none group" 
      style={{ paddingLeft: `${level * 12 + 12}px` }}
      onClick={e => { e.stopPropagation(); }}
    >
       <span className="w-4 flex justify-center shrink-0" />
       <span className="shrink-0">{type === 'file' ? <File size={14} className="text-slate-300" /> : <Folder size={14} className="text-[#c4f042]" />}</span>
       <input 
         autoFocus
         type="text"
         value={name}
         onChange={e => setName(e.target.value)}
         onBlur={() => {
           if (!name.trim()) onComplete();
         }}
         onKeyDown={e => {
            if (e.key === 'Enter') void submit();
            if (e.key === 'Escape') onComplete();
         }}
         className="flex-1 min-w-0 bg-black/40 border border-[#c4f042] outline-none text-[13px] text-white px-1 ml-0.5 rounded"
         onClick={e => e.stopPropagation()}
       />
    </div>
  );
};

const FileTreeItem = ({ item, level = 0 }: { item: FileTree, level?: number }) => {
  const { activeFile, openFile, refreshWorkspace, refreshVersion, expandedFolders, setExpandedFolders, toggleFolderExpanded } = useEditor();
  const ctx = useContext(ExplorerContext);
  const isOpen = expandedFolders.has(item.path);
  const [children, setChildren] = useState<FileTree[] | undefined>(item.children);
  const [newName, setNewName] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const paddingLeft = `${level * 12 + 12}px`;
  const isSelected = ctx?.selectedPaths.has(item.path) || (ctx?.selectedPaths.size === 0 && activeFile === item.path);
  const isRenaming = ctx?.renamingItem === item.path;

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      const dotIndex = item.name.lastIndexOf('.');
      inputRef.current.setSelectionRange(0, dotIndex > 0 ? dotIndex : item.name.length);
    }
  }, [isRenaming, item.name]);

  const isCreatingInside = ctx?.isCreating?.path === item.path;

  useEffect(() => {
    if (ctx?.collapseVersion !== undefined && ctx.collapseVersion > 0) {
      const shouldBeOpen = ctx.collapseVersion % 2 !== 0; // odd = expand, even = collapse
      if (shouldBeOpen) {
        setExpandedFolders(prev => new Set(prev).add(item.path));
        if (item.isDirectory && !children && window.electronAPI) {
          void window.electronAPI.readDirectory(item.path).then(setChildren).catch(() => setChildren([]));
        }
      } else {
        setExpandedFolders(prev => {
           const next = new Set(prev);
           next.delete(item.path);
           return next;
        });
      }
    }
  }, [ctx?.collapseVersion]);

  useEffect(() => {
    if (isCreatingInside && !isOpen) {
      toggleFolderExpanded(item.path);
      if (!children && window.electronAPI) {
        void window.electronAPI.readDirectory(item.path).then(setChildren).catch(() => setChildren([]));
      }
    }
  }, [isCreatingInside]);

  // Respond to global refreshWorkspace deep reload
  useEffect(() => {
    if (isOpen && item.isDirectory && window.electronAPI) {
      void window.electronAPI.readDirectory(item.path).then(setChildren).catch(() => setChildren([]));
    }
  }, [refreshVersion]);

  const handleClick = (e: React.MouseEvent) => {
    if (isRenaming) return;

    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      ctx?.setSelectedPaths(prev => {
        const next = new Set(prev);
        if (next.has(item.path)) next.delete(item.path);
        else next.add(item.path);
        return next;
      });
      return;
    }

    ctx?.setSelectedPaths(new Set());
    if (item.isDirectory) {
      toggleFolderExpanded(item.path);
      ctx?.setSelectedFolder(item.path);
      if (!isOpen && !children) {
        if (!window.electronAPI) return;
        void window.electronAPI.readDirectory(item.path).then(setChildren).catch(() => setChildren([]));
      }
    } else {
      ctx?.setSelectedFolder(item.path.replace(/[\\/][^\\/]+$/, ''));
      openFile(item.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ctx && !ctx.selectedPaths.has(item.path)) {
      ctx.setSelectedPaths(new Set());
    }
    ctx?.setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  const submitRename = async () => {
    if (!newName.trim() || newName === item.name) {
      ctx?.setRenamingItem(null);
      return;
    }
    try {
      if (window.electronAPI) {
        await window.electronAPI.renameFile(item.path, newName.trim());
        refreshWorkspace();
      }
    } catch (err) {
      console.error(err);
    }
    ctx?.setRenamingItem(null);
  };

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-1 py-1 cursor-pointer transition-colors select-none group",
          isSelected ? 'bg-[#c4f042] text-black font-medium' : 'hover:bg-white/5 text-slate-300'
        )}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="w-4 flex justify-center shrink-0">
          {item.isDirectory ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        
        <span className="shrink-0">
          {item.isDirectory ? (
            <Folder size={14} className={isSelected ? 'text-black' : 'text-[#c4f042]'} />
          ) : (
            getFileIcon(item.name)
          )}
        </span>
        
        {isRenaming ? (
          <input 
            ref={inputRef}
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') void submitRename();
              if (e.key === 'Escape') {
                setNewName(item.name);
                ctx?.setRenamingItem(null);
              }
            }}
            className="flex-1 min-w-0 bg-black/40 border border-[#c4f042] outline-none text-[13px] text-white px-1 ml-0.5 rounded"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="text-[13px] truncate flex-1">{item.name}</span>
        )}
      </div>

      {item.isDirectory && isOpen && (children || isCreatingInside) && (
        <div>
          {isCreatingInside && (
            <InlineCreator type={ctx!.isCreating!.type} parentPath={item.path} level={level + 1} onComplete={() => ctx?.setIsCreating(null)} />
          )}
          {children?.map((child) => (
            <FileTreeItem key={child.path} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer = () => {
  const { activeFile, currentPath, fileTree, setFileTree, refreshVersion, refreshWorkspace, openFile, splitGroup, activeGroupId, setChatContextFiles } = useEditor();
  const { setAISidebarOpen, setBottomPanelOpen } = useLayout();
  const { setActiveTab } = usePanel();
  const { newTerminal } = useTerminal();
  const [isCreating, setIsCreating] = useState<{type: 'file' | 'folder', path: string} | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [collapseVersion, setCollapseVersion] = useState(0);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingItem, setRenamingItem] = useState<string | null>(null);

  useEffect(() => {
    if (currentPath) {
      if (!window.electronAPI) return;
      void window.electronAPI.readDirectory(currentPath).then(setFileTree).catch(() => setFileTree([]));
    }
  }, [currentPath, refreshVersion, setFileTree]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('contextmenu', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('contextmenu', handleClickOutside);
    };
  }, []);

  const triggerCreate = (type: 'file' | 'folder', parentPath: string) => {
    setIsCreating({ type, path: parentPath });
  };

  const handleContextMenuAction = async (action: string) => {
    if (!contextMenu || !window.electronAPI) return;
    const { item } = contextMenu;
    setContextMenu(null);
    
    const targetPaths = selectedPaths.has(item.path) ? Array.from(selectedPaths) : [item.path];

    try {
      switch (action) {
        case 'open':
          targetPaths.forEach(p => {
             if (!p.endsWith('\\') && !p.endsWith('/')) {
                openFile(p);
             }
          });
          break;
        case 'open-side':
          splitGroup(activeGroupId);
          setTimeout(() => openFile(item.path), 50);
          break;
        case 'open-terminal': {
          const dir = item.isDirectory ? item.path : item.path.replace(/[\\/][^\\/]+$/, '');
          await newTerminal(dir);
          setActiveTab('terminal');
          setBottomPanelOpen(true);
          break;
        }
        case 'run': {
          if (!item.isDirectory) {
            const dir = item.path.replace(/[\\/][^\\/]+$/, '');
            const isPy = item.path.endsWith('.py');
            const isTs = item.path.endsWith('.ts');
            const isJs = item.path.endsWith('.js');
            const cmd = isPy ? `python "${item.name}"` : isTs ? `npx ts-node "${item.name}"` : isJs ? `node "${item.name}"` : `"${item.path}"`;
            
            const tid = await newTerminal(dir);
            if (tid && window.electronAPI) window.electronAPI.writeTerminal(tid, cmd + '\r');
            
            setActiveTab('terminal');
            setBottomPanelOpen(true);
          }
          break;
        }
        case 'rename':
          setRenamingItem(item.path);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${targetPaths.length > 1 ? `${targetPaths.length} items` : `'${item.name}'`}?`)) {
            for (const p of targetPaths) {
              await window.electronAPI.deleteFile(p);
            }
            refreshWorkspace();
            setSelectedPaths(new Set());
          }
          break;
        case 'duplicate':
          await window.electronAPI.duplicateFile(item.path);
          refreshWorkspace();
          break;
        case 'reveal':
          await window.electronAPI.revealInExplorer(item.path);
          break;
        case 'copy-path':
          await navigator.clipboard.writeText(targetPaths.join('\n'));
          break;
        case 'copy-rel-path': {
          const rels = targetPaths.map(p => {
             let rel = currentPath && p.startsWith(currentPath) ? p.substring(currentPath.length + 1) : p;
             return rel.replace(/\\/g, '/');
          });
          await navigator.clipboard.writeText(rels.join('\n'));
          break;
        }
        case 'ai-chat':
          setChatContextFiles(prev => Array.from(new Set([...prev, ...targetPaths])));
          setAISidebarOpen(true);
          break;
        case 'new-file':
          triggerCreate('file', item.path);
          break;
        case 'new-folder':
          triggerCreate('folder', item.path);
          break;
      }
    } catch (err) {
      console.error('Context menu action failed:', err);
    }
  };

  if (!currentPath) return null;

  const workspaceName = currentPath ? currentPath.split(/[\\/]/).pop() || 'WORKSPACE' : 'EXPLORER';

  return (
    <ExplorerContext.Provider value={{ setContextMenu, renamingItem, setRenamingItem, triggerCreate, selectedFolder, setSelectedFolder, isCreating, setIsCreating, collapseVersion, selectedPaths, setSelectedPaths }}>
      <div className="flex flex-col h-full overflow-hidden relative" onClick={() => setSelectedPaths(new Set())}>
        <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none shrink-0 overflow-hidden">
          <span className="truncate flex-1 mr-2" title={workspaceName}>{workspaceName}</span>
          <div className="flex items-center gap-1 text-slate-400 normal-case">
            <button type="button" title="Collapse / Expand All" onClick={() => setCollapseVersion(v => v + 1)} className="rounded p-1 hover:bg-[var(--hover-bg)] hover:text-white"><ListTree size={14} /></button>
            <button type="button" title="Refresh Explorer" onClick={refreshWorkspace} className="rounded p-1 hover:bg-[var(--hover-bg)] hover:text-white"><RefreshCw size={14} /></button>
          </div>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden py-1"
          onContextMenu={e => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, item: { path: currentPath, name: workspaceName, isDirectory: true, children: fileTree } });
          }}
        >
          {isCreating && isCreating.path === currentPath && (
            <InlineCreator type={isCreating.type} parentPath={currentPath} level={0} onComplete={() => setIsCreating(null)} />
          )}
          {fileTree.map(item => (
            <FileTreeItem key={item.path} item={item} />
          ))}
        </div>

        {/* Custom Context Menu Portal */}
        {contextMenu && (
          <div 
            className="fixed z-[100] w-56 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl py-1 text-sm text-slate-200 overflow-y-auto"
            style={{ 
              top: Math.max(10, Math.min(contextMenu.y, window.innerHeight - 450)), 
              left: Math.min(contextMenu.x, window.innerWidth - 250),
              maxHeight: 'calc(100vh - 20px)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {contextMenu.item.isDirectory ? (
              <>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('new-file')}>
                  <FilePlus2 size={14} className="text-slate-400" /> New File...
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('new-folder')}>
                  <FolderPlus size={14} className="text-slate-400" /> New Folder...
                </button>
                <div className="h-px bg-white/10 my-1 mx-2" />
              </>
            ) : (
              <>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('open')}>
                  <File size={14} className="text-slate-400" /> Open File
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('open-side')}>
                  <File size={14} className="text-slate-400" /> Open to Side
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#c4f042]/20 hover:text-[#c4f042] text-left transition-colors" onClick={() => handleContextMenuAction('run')}>
                  <ChevronRight size={14} className="text-current" /> Run File
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#c4f042]/20 hover:text-[#c4f042] text-left transition-colors" onClick={() => handleContextMenuAction('ai-chat')}>
                  <MessageSquare size={14} className="text-current" /> Send to AI Chat
                </button>
                <div className="h-px bg-white/10 my-1 mx-2" />
              </>
            )}

            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('open-terminal')}>
              <RefreshCw size={14} className="text-slate-400" /> Open in Integrated Terminal
            </button>
            <div className="h-px bg-white/10 my-1 mx-2" />

            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('reveal')}>
              <ExternalLink size={14} className="text-slate-400" /> Reveal in File Explorer
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('copy-path')}>
              <Copy size={14} className="text-slate-400" /> Copy Path
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('copy-rel-path')}>
              <Copy size={14} className="text-slate-400" /> Copy Relative Path
            </button>
            <div className="h-px bg-white/10 my-1 mx-2" />

            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('rename')}>
              <Edit2 size={14} className="text-slate-400" /> Rename
            </button>
            
            {!contextMenu.item.isDirectory && (
              <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left transition-colors" onClick={() => handleContextMenuAction('duplicate')}>
                <Plus size={14} className="text-slate-400" /> Duplicate
              </button>
            )}

            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/20 hover:text-red-400 text-left transition-colors" onClick={() => handleContextMenuAction('delete')}>
              <Trash2 size={14} className="text-current" /> Delete
            </button>
          </div>
        )}
      </div>
    </ExplorerContext.Provider>
  );
};
