import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MoreHorizontal, Loader2 } from 'lucide-react';
import { useExtensions, type Extension } from '../../contexts/ExtensionContext';
import { ExtensionCard } from './ExtensionCard';
import { cn } from '../../utils/cn';

export const ExtensionsPanel: React.FC = () => {
  const { installedExtensions } = useExtensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'installed'>('all');
  
  const [searchResults, setSearchResults] = useState<Extension[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch from Open VSX
  const fetchExtensions = useCallback(async () => {
    if (filterMode === 'installed') return;
    
    setIsSearching(true);
    try {
      if (window.electronAPI && window.electronAPI.searchExtensions) {
        const response = await window.electronAPI.searchExtensions(debouncedQuery, 'downloadCount', 'desc', 0);
        
        // Map Open VSX format to our Extension interface
        const mapped: Extension[] = response.extensions.map((ext: any) => ({
          id: `${ext.namespace}.${ext.name}`,
          namespace: ext.namespace,
          name: ext.name,
          publisher: ext.publisher || ext.namespace,
          description: ext.description || '',
          version: ext.version,
          iconUrl: ext.files.icon || ext.iconUrl,
          downloadCount: ext.downloadCount,
          averageRating: ext.averageRating
        }));
        
        setSearchResults(mapped);
      }
    } catch (err) {
      console.error('Failed to search extensions:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, filterMode]);

  useEffect(() => {
    if (filterMode === 'all') {
      fetchExtensions();
    }
  }, [fetchExtensions, filterMode]);

  const displayedExtensions = filterMode === 'installed' 
    ? installedExtensions 
    : searchResults;

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
            onClick={() => setFilterMode('all')}
            className={cn("hover:text-slate-200 transition-colors", filterMode === 'all' && "text-blue-400")}
          >
            RECOMMENDED
          </button>
          <span className="text-slate-600">|</span>
          <button 
            onClick={() => setFilterMode('installed')}
            className={cn("hover:text-slate-200 transition-colors", filterMode === 'installed' && "text-blue-400")}
          >
            INSTALLED
          </button>
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full text-[9px] ml-1">
            {filterMode === 'installed' ? installedCount : ''}
          </span>
        </h3>
        <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {isSearching && filterMode === 'all' && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}
        
        {displayedExtensions.length === 0 && !isSearching ? (
          <div className="p-4 text-center text-xs text-slate-500 mt-4">
            {filterMode === 'installed' ? 'No extensions installed.' : 'No results found on Open VSX.'}
          </div>
        ) : (
          displayedExtensions.map(ext => (
            <ExtensionCard key={ext.id} extension={ext} />
          ))
        )}
      </div>
    </div>
  );
};
