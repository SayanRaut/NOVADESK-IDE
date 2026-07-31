import React, { useState, useMemo } from 'react';
import { Search, Filter, MoreHorizontal } from 'lucide-react';
import { useExtensions } from '../../contexts/ExtensionContext';
import { ExtensionCard } from './ExtensionCard';
import { cn } from '../../utils/cn';

export const ExtensionsPanel: React.FC = () => {
  const { availableExtensions, installedExtensions } = useExtensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'installed'>('all');

  const filteredExtensions = useMemo(() => {
    let filtered = availableExtensions;

    if (filterMode === 'installed') {
      filtered = filtered.filter(ext => installedExtensions.includes(ext.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ext => 
        ext.name.toLowerCase().includes(q) || 
        ext.description.toLowerCase().includes(q) ||
        ext.publisher.toLowerCase().includes(q) ||
        ext.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [availableExtensions, installedExtensions, searchQuery, filterMode]);

  const installedCount = installedExtensions.length;

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800 shrink-0 flex flex-col gap-2">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search Extensions in Marketplace" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/50 rounded pl-8 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-colors"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <button className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-200">
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0 group hover:bg-slate-800/30 cursor-pointer">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <button 
            onClick={() => setFilterMode(filterMode === 'all' ? 'installed' : 'all')}
            className={cn("hover:text-slate-200 transition-colors", filterMode === 'installed' && "text-blue-400")}
          >
            {filterMode === 'installed' ? 'INSTALLED' : 'RECOMMENDED'}
          </button>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full text-[9px]">
            {filterMode === 'installed' ? installedCount : filteredExtensions.length}
          </span>
        </h3>
        <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredExtensions.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 mt-4">
            No extensions found.
          </div>
        ) : (
          filteredExtensions.map(ext => (
            <ExtensionCard key={ext.id} extension={ext} />
          ))
        )}
      </div>
    </div>
  );
};
