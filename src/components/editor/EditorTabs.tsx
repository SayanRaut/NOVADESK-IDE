import { useState } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { X, File, Circle, Pin } from 'lucide-react';
import { cn } from '../../utils/cn';
import { EditorTabContextMenu } from './EditorTabContextMenu';

export function EditorTabs({ groupId }: { groupId: string }) {
  const { editorGroups, openFile, closeFile, closeGroup, pinFile, unpinFile, reorderTabs, dirtyFiles } = useEditor();
  const group = editorGroups.find(g => g.id === groupId);
  
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ file: string; x: number; y: number } | null>(null);

  if (!group || group.openFiles.length === 0) {
    return (
      <div className="flex bg-[var(--activity-bar-bg)] h-9 items-center justify-end px-2 border-b border-[var(--border-color)]">
        <button onClick={() => closeGroup(groupId)} className="p-1 hover:glass-panel rounded text-slate-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== index) {
      reorderTabs(groupId, draggedIdx, index);
    }
    setDraggedIdx(null);
  };

  return (
    <div className="flex bg-[var(--activity-bar-bg)] overflow-x-auto no-scrollbar border-b border-[var(--border-color)] select-none">
      {group.openFiles.map((file, index) => {
        const isActive = file === group.activeFile;
        const isDirty = dirtyFiles.has(file);
        const isPinned = group.pinnedTabs.includes(file);
        const fileName = file.split(/[\\/]/).pop() || 'Unknown';
        
        return (
          <div
            key={file}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ file, x: e.clientX, y: e.clientY });
            }}
            onMouseUp={(e) => {
              if (e.button === 1) closeFile(file, groupId); // Middle click
            }}
            onDoubleClick={() => isPinned ? unpinFile(file, groupId) : pinFile(file, groupId)}
            className={cn(
              "flex items-center h-9 px-3 gap-2 border-r border-[var(--border-color)] cursor-pointer group min-w-fit max-w-[200px]",
              isActive ? "bg-[var(--panel-bg)] text-[#c4f042] border-t-2 border-t-[#c4f042]" : "bg-[var(--activity-bar-bg)] text-slate-400 hover:bg-[var(--panel-bg)] border-t-2 border-t-transparent"
            )}
            onClick={() => openFile(file, groupId)}
          >
            {isPinned ? <Pin className="w-3 h-3 shrink-0 text-slate-500 transform rotate-45" /> : <File className="w-3.5 h-3.5 shrink-0" />}
            
            {!isPinned && <span className="text-xs truncate">{fileName}</span>}
            
            <div 
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700/50"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file, groupId);
              }}
            >
              {isDirty ? (
                <Circle className="w-2.5 h-2.5 fill-current" />
              ) : (
                <X className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>
        );
      })}
      
      {/* Right side actions */}
      <div className="flex-1 flex justify-end items-center px-2">
        {editorGroups.length > 1 && (
          <button onClick={() => closeGroup(groupId)} className="p-1 hover:bg-[var(--panel-bg)] rounded text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {contextMenu && (
        <EditorTabContextMenu 
          file={contextMenu.file}
          groupId={groupId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
