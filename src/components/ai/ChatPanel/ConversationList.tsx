import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { useAI } from '../../../contexts/AIContext';
import { cn } from '../../../utils/cn';

export const ConversationList = () => {
  const {
    conversations,
    activeConversation,
    createNewConversation,
    selectConversation,
    removeConversation,
    renameActiveConversation,
  } = useAI();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (id: number, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const commitEdit = async () => {
    if (editingId && editTitle.trim()) {
      await renameActiveConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full border-r border-slate-950 bg-[#0e0e0e] w-52 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-950">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Chats</span>
        <button
          onClick={() => void createNewConversation()}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-950 transition-colors"
          title="New Chat"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-slate-950">
        <div className="flex items-center gap-2 bg-slate-950 border border-[#252525] rounded px-2 py-1">
          <Search size={11} className="text-slate-600 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <div className="px-3 py-8 text-center">
            <MessageSquare size={24} className="text-slate-700 mx-auto mb-2" />
            <p className="text-[11px] text-slate-600">
              {conversations.length === 0 ? 'No chats yet' : 'No results'}
            </p>
          </div>
        )}

        {filtered.map(convo => (
          <div
            key={convo.id}
            onClick={() => void selectConversation(convo.id)}
            className={cn(
              'group flex items-center gap-2 px-2 py-2 mx-1 rounded-md cursor-pointer transition-colors',
              activeConversation?.id === convo.id
                ? 'bg-blue-600/15 border border-blue-500/20'
                : 'hover:bg-slate-950'
            )}
          >
            <MessageSquare size={12} className={cn(
              'shrink-0',
              activeConversation?.id === convo.id ? 'text-blue-400' : 'text-slate-600'
            )} />

            <div className="flex-1 min-w-0">
              {editingId === convo.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                  className="w-full bg-slate-950 border border-blue-500/50 rounded px-1 text-[11px] text-slate-200 outline-none"
                />
              ) : (
                <p className={cn(
                  'text-[11px] truncate',
                  activeConversation?.id === convo.id ? 'text-slate-200' : 'text-slate-400'
                )}>
                  {convo.title}
                </p>
              )}
            </div>

            {/* Actions */}
            {editingId === convo.id ? (
              <div className="flex gap-1">
                <button onClick={() => void commitEdit()} className="text-green-400 hover:text-green-300"><Check size={11} /></button>
                <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300"><X size={11} /></button>
              </div>
            ) : (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => startEdit(convo.id, convo.title, e)}
                  className="p-0.5 rounded text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); void removeConversation(convo.id); }}
                  className="p-0.5 rounded text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Chat footer */}
      <div className="p-2 border-t border-slate-950">
        <button
          onClick={() => void createNewConversation()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-xs text-blue-400 transition-colors"
        >
          <Plus size={13} />
          New Chat
        </button>
      </div>
    </div>
  );
};
