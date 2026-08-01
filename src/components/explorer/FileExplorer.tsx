import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FileJson, FileCode, FileText, FilePlus2, FolderPlus, RefreshCw } from 'lucide-react';
import { useEditor, type FileTree } from '../../contexts/EditorContext';

// Simple icon mapper based on extension
const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode size={14} className="text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson size={14} className="text-yellow-400" />;
  if (name.endsWith('.md')) return <FileText size={14} className="text-slate-400" />;
  return <File size={14} className="text-slate-300" />;
};

const FileTreeItem = ({ item, level = 0 }: { item: FileTree, level?: number }) => {
  const { activeFile, openFile } = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileTree[] | undefined>(item.children);

  const paddingLeft = `${level * 12 + 12}px`;
  const isSelected = activeFile === item.path;

  const handleClick = () => {
    if (item.isDirectory) {
      setIsOpen(!isOpen);
      if (!isOpen && !children) {
        if (!window.electronAPI) return;
        void window.electronAPI.readDirectory(item.path).then(setChildren).catch(() => setChildren([]));
      }
    } else {
      openFile(item.path);
    }
  };

  return (
    <div>
      <div 
        className={`flex items-center gap-1 py-1 cursor-pointer transition-ui select-none ${
          isSelected ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--hover-bg)] text-slate-300'
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        <span className="w-4 flex justify-center">
          {item.isDirectory ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        
        {item.isDirectory ? (
          <Folder size={14} className="text-blue-400" />
        ) : (
          getFileIcon(item.name)
        )}
        
        <span className="text-[13px] truncate">{item.name}</span>
      </div>

      {item.isDirectory && isOpen && children && (
        <div>
          {children.map((child) => (
            <FileTreeItem key={child.path} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer = () => {
  const { currentPath, fileTree, setFileTree, refreshVersion, refreshWorkspace, openFile } = useEditor();
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [entryName, setEntryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentPath) {
      if (!window.electronAPI) return;
      void window.electronAPI.readDirectory(currentPath).then(setFileTree).catch(() => setFileTree([]));
    }
  }, [currentPath, refreshVersion, setFileTree]);

  const createEntry = async () => {
    if (!currentPath || !entryName.trim() || !window.electronAPI || !isCreating) return;
    setError(null);
    try {
      const createdPath = isCreating === 'file'
        ? await window.electronAPI.createFile(currentPath, entryName.trim())
        : await window.electronAPI.createFolder(currentPath, entryName.trim());
      setEntryName(''); setIsCreating(null); refreshWorkspace();
      if (isCreating === 'file') openFile(createdPath);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create the item.'); }
  };

  if (!currentPath) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
        <span>Explorer</span>
        <div className="flex items-center gap-1 text-slate-400 normal-case">
          <button type="button" title="New file" onClick={() => { setIsCreating('file'); setError(null); }} className="rounded p-1 hover:bg-[var(--hover-bg)] hover:text-white"><FilePlus2 size={15} /></button>
          <button type="button" title="New folder" onClick={() => { setIsCreating('folder'); setError(null); }} className="rounded p-1 hover:bg-[var(--hover-bg)] hover:text-white"><FolderPlus size={15} /></button>
          <button type="button" title="Refresh Explorer" onClick={refreshWorkspace} className="rounded p-1 hover:bg-[var(--hover-bg)] hover:text-white"><RefreshCw size={14} /></button>
        </div>
      </div>
      {isCreating && <div className="px-3 pb-2"><input autoFocus value={entryName} onChange={(event) => setEntryName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void createEntry(); if (event.key === 'Escape') setIsCreating(null); }} onBlur={() => { if (!entryName.trim()) setIsCreating(null); }} placeholder={`New ${isCreating} name`} className="h-8 w-full rounded border border-blue-500 bg-[#111] px-2 text-sm outline-none" /></div>}
      {error && <p className="px-4 pb-2 text-xs text-red-300">{error}</p>}
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {fileTree.map(item => (
          <FileTreeItem key={item.path} item={item} />
        ))}
      </div>
    </div>
  );
};
