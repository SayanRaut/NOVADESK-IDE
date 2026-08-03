
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, PanelLeftClose } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import { useLayout } from '../contexts/LayoutContext';
import type { ActivityItem } from '../contexts/SidebarContext';
import { useResize } from '../hooks/useResize';
import { Skeleton } from './Loading/Skeleton';
import { FileExplorer } from './explorer/FileExplorer';
import { SettingsPanel } from './SettingsPanel';
import { ExtensionsPanel } from './extensions/ExtensionsPanel';
import { SearchPanel } from './search/SearchPanel';
import { RunDebugPanel } from './run-debug/RunDebugPanel';
import { cn } from '../utils/cn';
import { useEffect } from 'react';

const titleMap: Record<ActivityItem, string> = {
  explorer: 'EXPLORER',
  search: 'SEARCH',
  'source-control': 'SOURCE CONTROL',
  'run-debug': 'RUN AND DEBUG',
  extensions: 'EXTENSIONS',
  ai: 'AI WORKSPACE',
  settings: 'SETTINGS'
};

export function Sidebar() {
  const { activeActivity, setActiveActivity } = useSidebar();
  const { isSidebarOpen, setSidebarOpen } = useLayout();
  
  useEffect(() => {
    const handleToggleRunDebug = () => {
      if (activeActivity === 'run-debug') {
        setSidebarOpen(!isSidebarOpen);
      } else {
        setActiveActivity('run-debug');
        if (!isSidebarOpen) setSidebarOpen(true);
      }
    };
    window.addEventListener('ide:toggleRunDebug', handleToggleRunDebug);
    return () => window.removeEventListener('ide:toggleRunDebug', handleToggleRunDebug);
  }, [activeActivity, isSidebarOpen, setSidebarOpen, setActiveActivity]);
  
  const { size, isResizing, onMouseDown } = useResize({
    initialSize: 260,
    minSize: 170,
    maxSize: 600,
    direction: 'horizontal',
    storageKey: 'novadesk:sidebar-width'
  });

  return (
    <AnimatePresence initial={false}>
      {isSidebarOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: size, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative flex h-full bg-slate-900 border-r border-slate-800 shrink-0 overflow-hidden"
          style={{ width: size }}
        >
          <div className="flex flex-col w-full h-full min-w-[170px]">
            {/* Header */}
            <div className="flex items-center justify-between h-9 px-4 uppercase text-[11px] font-semibold tracking-wider text-slate-300">
              <span className="truncate">{titleMap[activeActivity]}</span>
              <div className="flex items-center gap-1">
                <button className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {activeActivity === 'explorer' ? (
              <FileExplorer />
            ) : activeActivity === 'search' ? (
              <SearchPanel />
            ) : activeActivity === 'run-debug' ? (
              <RunDebugPanel />
            ) : activeActivity === 'settings' ? (
              <SettingsPanel />
            ) : activeActivity === 'extensions' ? (
              <ExtensionsPanel />
            ) : (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div 
            className={cn(
              "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors",
              isResizing ? "bg-blue-500" : "hover:bg-blue-500/50 delay-150"
            )}
            onMouseDown={onMouseDown}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
