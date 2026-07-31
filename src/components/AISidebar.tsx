import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose } from 'lucide-react';
import { useLayout } from '../contexts/LayoutContext';
import { useResize } from '../hooks/useResize';
import { cn } from '../utils/cn';
import { ChatPanel } from './ai/ChatPanel';

export function AISidebar() {
  const { isAISidebarOpen, setAISidebarOpen } = useLayout();
  
  const { size, isResizing, onMouseDown } = useResize({
    initialSize: 360,
    minSize: 280,
    maxSize: 640,
    direction: 'horizontal',
    reverse: true,
    storageKey: 'novadesk:ai-sidebar-width'
  });

  return (
    <AnimatePresence initial={false}>
      {isAISidebarOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: size, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative flex h-full bg-[#0c0c0c] border-l border-[#1e1e1e] shrink-0 overflow-hidden"
          style={{ width: size }}
        >
          {/* Resize Handle */}
          <div 
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors",
              isResizing ? "bg-blue-500" : "hover:bg-blue-500/50 delay-150"
            )}
            onMouseDown={onMouseDown}
          />

          <div className="flex flex-col w-full h-full min-w-[280px] overflow-hidden">
            {/* Close button row */}
            <div className="flex items-center justify-end h-8 px-2 border-b border-[#1a1a1a] shrink-0">
              <button 
                onClick={() => setAISidebarOpen(false)}
                className="p-1 text-slate-600 hover:text-slate-300 hover:bg-[#1a1a1a] rounded transition-colors"
                title="Close AI Panel"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Full Chat Panel */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatPanel />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
