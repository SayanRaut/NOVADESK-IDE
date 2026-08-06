import React, { useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, File as FileIcon, Replace, ReplaceAll, RefreshCw } from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';

type SearchResult = {
  path: string;
  line: number;
  preview: string;
};

type GroupedResults = {
  [path: string]: SearchResult[];
};

type SearchState = {
  query: string;
  replaceQuery: string;
  isReplaceExpanded: boolean;
  results: SearchResult[];
  expandedFiles: Set<string>;
  setQuery: (query: string) => void;
  setReplaceQuery: (replaceQuery: string) => void;
  setIsReplaceExpanded: (isExpanded: boolean) => void;
  setResults: (results: SearchResult[]) => void;
  setExpandedFiles: (files: Set<string>) => void;
};

const useSearchStore = create<SearchState>((set) => ({
  query: '',
  replaceQuery: '',
  isReplaceExpanded: false,
  results: [],
  expandedFiles: new Set(),
  setQuery: (query) => set({ query }),
  setReplaceQuery: (replaceQuery) => set({ replaceQuery }),
  setIsReplaceExpanded: (isReplaceExpanded) => set({ isReplaceExpanded }),
  setResults: (results) => set({ results }),
  setExpandedFiles: (expandedFiles) => set({ expandedFiles }),
}));

export function SearchPanel() {
  const { query, setQuery, replaceQuery, setReplaceQuery, isReplaceExpanded, setIsReplaceExpanded, results, setResults, expandedFiles, setExpandedFiles } = useSearchStore();
  const [isSearching, setIsSearching] = React.useState(false);
  const { openFile, setCursorPosition } = useEditor();

  const handleSearch = async () => {
    if (!query.trim() || !window.electronAPI) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await window.electronAPI.searchWorkspace(query);
      setResults(res);
      // Expand all by default
      const paths = new Set<string>();
      res.forEach((r) => paths.add(r.path));
      setExpandedFiles(paths);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleExpand = (path: string) => {
    const newSet = new Set(expandedFiles);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setExpandedFiles(newSet);
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const doReplaceInFile = async (filePath: string, searchStr: string, replaceStr: string) => {
    if (!window.electronAPI) return;
    try {
      const content = await window.electronAPI.readFile(filePath);
      const regex = new RegExp(escapeRegExp(searchStr), 'gi'); // backend search is case-insensitive
      const newContent = content.replace(regex, replaceStr);
      if (newContent !== content) {
        await window.electronAPI.writeFile(filePath, newContent);
      }
    } catch (e) {
      console.error('Failed to replace in file', filePath, e);
    }
  };

  const handleReplaceAll = async () => {
    if (!query.trim() || !window.electronAPI || results.length === 0) return;
    const paths = Array.from(new Set(results.map((r) => r.path)));
    for (const p of paths) {
      await doReplaceInFile(p, query, replaceQuery);
    }
    // Re-run search after replace to update UI
    handleSearch();
  };

  const handleReplaceInFile = async (filePath: string) => {
    if (!query.trim() || !window.electronAPI) return;
    await doReplaceInFile(filePath, query, replaceQuery);
    // Re-run search to update UI
    handleSearch();
  };

  const groupedResults = results.reduce<GroupedResults>((acc, curr) => {
    if (!acc[curr.path]) {
      acc[curr.path] = [];
    }
    acc[curr.path].push(curr);
    return acc;
  }, {});

  const getRelativePath = (fullPath: string) => {
    const parts = fullPath.split(/[/\\]/);
    if (parts.length > 2) {
      return parts.slice(-2).join('/');
    }
    return fullPath;
  };

  return (
    <div className="flex flex-col h-full glass-panel text-slate-300 text-sm overflow-hidden">
      {/* Input Section */}
      <div className="p-4 flex flex-col gap-2 shrink-0 border-b border-slate-800">
        <div className="flex items-center bg-[var(--panel-bg)] border border-[var(--border-color)] rounded overflow-hidden focus-within:border-[var(--accent)] transition-colors">
          <button
            onClick={() => setIsReplaceExpanded(!isReplaceExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isReplaceExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 text-[13px] min-w-0 py-1.5 px-1"
          />
        </div>

        <AnimatePresence>
          {isReplaceExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center bg-[var(--panel-bg)] border border-[var(--border-color)] rounded overflow-hidden focus-within:border-[var(--accent)] transition-colors ml-7"
            >
              <input
                type="text"
                placeholder="Replace"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500 text-[13px] min-w-0 py-1.5 px-2"
              />
              <button
                onClick={handleReplaceAll}
                title="Replace All"
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors rounded mr-0.5"
              >
                <ReplaceAll className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && (
          <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Searching...
          </div>
        )}
        {!isSearching && query && results.length === 0 && (
          <div className="p-4 text-slate-500 text-xs">No results found.</div>
        )}

        <div className="py-2 pb-10">
          {Object.entries(groupedResults).map(([filePath, fileResults]) => {
            const isExpanded = expandedFiles.has(filePath);
            const fileName = filePath.split(/[/\\]/).pop() || '';
            const relativePath = getRelativePath(filePath);

            return (
              <div key={filePath} className="flex flex-col">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 hover:bg-[var(--hover-bg)] cursor-pointer group"
                  onClick={() => toggleExpand(filePath)}
                >
                  <div className="text-slate-500">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <FileIcon className="w-3.5 h-3.5 text-slate-400" />
                  <div className="flex items-baseline gap-2 overflow-hidden">
                    <span className="text-[13px] text-slate-200 truncate">{fileName}</span>
                    <span className="text-[11px] text-slate-500 truncate">{relativePath}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[11px] bg-blue-500/10 text-blue-400 px-1.5 rounded-full leading-relaxed">
                      {fileResults.length}
                    </span>
                    {isReplaceExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReplaceInFile(filePath);
                        }}
                        title="Replace in File"
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-200 transition-opacity"
                      >
                        <Replace className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="flex flex-col">
                    {fileResults.map((result, idx) => (
                      <div
                        key={`${filePath}-${result.line}-${idx}`}
                        className="flex items-start gap-2 pl-9 pr-2 py-1 hover:bg-[var(--hover-bg)] cursor-pointer group"
                        onClick={() => {
                          openFile(filePath);
                          setTimeout(() => setCursorPosition({ line: result.line, column: 1 }), 50);
                        }}
                      >
                        <span className="text-[11px] text-slate-500 min-w-[24px] text-right pt-0.5 select-none">
                          {result.line}
                        </span>
                        <span className="text-[12px] text-slate-300 break-all overflow-hidden flex-1 leading-relaxed">
                          {result.preview.split(new RegExp(`(${escapeRegExp(query)})`, 'gi')).map((part, i) =>
                            part.toLowerCase() === query.toLowerCase() ? (
                              <span key={i} className="bg-blue-500/30 text-blue-300 px-0.5 rounded">
                                {part}
                              </span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
