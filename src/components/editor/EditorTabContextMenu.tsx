import { useEffect, useRef } from 'react';
import { useEditor } from '../../contexts/EditorContext';
import { Columns, X, ArrowLeftRight, CheckSquare } from 'lucide-react';


type Props = {
  file: string;
  groupId: string;
  x: number;
  y: number;
  onClose: () => void;
};

export function EditorTabContextMenu({ file, groupId, x, y, onClose }: Props) {
  const { closeFile, closeOthers, closeAll, splitGroup, editorGroups } = useEditor();
  const group = editorGroups.find(g => g.id === groupId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!group) return null;

  return (
    <div 
      ref={ref}
      style={{ top: y, left: x }}
      className="fixed z-50 w-48 glass-panel border border-slate-700 rounded shadow-xl py-1 text-sm text-slate-300"
    >
      <button 
        className="w-full flex items-center px-3 py-1.5 hover:bg-blue-600 hover:text-white"
        onClick={() => { closeFile(file, groupId); onClose(); }}
      >
        <X className="w-3.5 h-3.5 mr-2 opacity-70" />
        Close
      </button>
      <button 
        className="w-full flex items-center px-3 py-1.5 hover:bg-blue-600 hover:text-white"
        onClick={() => { closeOthers(file, groupId); onClose(); }}
      >
        <ArrowLeftRight className="w-3.5 h-3.5 mr-2 opacity-70" />
        Close Others
      </button>
      <button 
        className="w-full flex items-center px-3 py-1.5 hover:bg-blue-600 hover:text-white"
        onClick={() => { closeAll(groupId); onClose(); }}
      >
        <CheckSquare className="w-3.5 h-3.5 mr-2 opacity-70" />
        Close All
      </button>
      
      <div className="h-px bg-slate-700 my-1 w-full" />
      
      <button 
        className="w-full flex items-center px-3 py-1.5 hover:bg-blue-600 hover:text-white"
        onClick={() => { splitGroup(groupId); onClose(); }}
      >
        <Columns className="w-3.5 h-3.5 mr-2 opacity-70" />
        Split Editor
      </button>
    </div>
  );
}
