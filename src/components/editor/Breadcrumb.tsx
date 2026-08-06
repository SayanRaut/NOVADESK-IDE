import { useEditor } from '../../contexts/EditorContext';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb({ groupId }: { groupId: string }) {
  const { editorGroups } = useEditor();
  const group = editorGroups.find(g => g.id === groupId);

  if (!group || !group.activeFile) return null;

  const parts = group.activeFile.split(/[\\/]/).filter(Boolean);

  return (
    <div className="h-7 px-4 flex items-center glass-panel border-b border-slate-800 overflow-x-auto no-scrollbar">
      {parts.map((part, index) => (
        <div key={index} className="flex items-center text-xs text-slate-400">
          <span className="hover:text-slate-200 cursor-pointer">{part}</span>
          {index < parts.length - 1 && (
            <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-50" />
          )}
        </div>
      ))}
    </div>
  );
}
