import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelBottomClose, Terminal, AlertCircle, ListTree, Bug, Activity, XCircle, AlertTriangle } from 'lucide-react';
import { useLayout } from '../contexts/LayoutContext';
import { usePanel } from '../contexts/PanelContext';
import { useEditor } from '../contexts/EditorContext';
import { useProblems } from '../contexts/ProblemsContext';
import { useTheme } from '../contexts/ThemeContext';
import type { BottomPanelTab } from '../contexts/PanelContext';
import { useResize } from '../hooks/useResize';
import { TerminalPanel } from './Terminal/TerminalPanel';
import { cn } from '../utils/cn';

const tabs: { id: BottomPanelTab; label: string; icon?: React.ElementType }[] = [
  { id: 'problems', label: 'PROBLEMS', icon: AlertCircle },
  { id: 'output', label: 'OUTPUT', icon: ListTree },
  { id: 'debug', label: 'DEBUG CONSOLE', icon: Bug },
  { id: 'terminal', label: 'TERMINAL', icon: Terminal },
  { id: 'ai-logs', label: 'AI LOGS', icon: Activity },
];

export function BottomPanel() {
  const { isBottomPanelOpen, setBottomPanelOpen } = useLayout();
  const { activeTab, setActiveTab } = usePanel();
  const { openFile } = useEditor();
  const { problems } = useProblems();
  const { customBackground } = useTheme();
  
  const allProblems = Object.entries(problems).flatMap(([file, markers]) => 
    markers.map(m => ({ file, ...m }))
  );
  
  const { size, isResizing, onMouseDown } = useResize({
    initialSize: 280,
    minSize: 100,
    maxSize: 600,
    direction: 'vertical',
    reverse: true, // Resizing from top edge of bottom panel
    storageKey: 'novadesk:bottom-panel-height'
  });

  return (
    <AnimatePresence initial={false}>
      {isBottomPanelOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: size, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            "relative flex flex-col border-t border-slate-800 shrink-0 overflow-hidden",
            customBackground ? "bg-transparent" : "bg-slate-950"
          )}
          style={{ height: size }}
        >
          {/* Resize Handle */}
          <div 
            className={cn(
              "absolute left-0 right-0 top-0 h-1 cursor-row-resize z-10 transition-colors",
              isResizing ? "bg-blue-500" : "hover:bg-blue-500/50 delay-150"
            )}
            onMouseDown={onMouseDown}
          />

          <div className="flex flex-col w-full h-full pt-1">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between h-9 px-4 uppercase text-[11px] font-semibold tracking-wider text-slate-400">
              <div className="flex h-full gap-4">
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <div 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center h-full gap-1.5 cursor-pointer border-b-2 transition-colors",
                        isActive 
                          ? "border-blue-500 text-slate-100" 
                          : "border-transparent hover:text-slate-200"
                      )}
                    >
                      {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                      <span>{tab.label}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setBottomPanelOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                >
                  <PanelBottomClose className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className={cn("flex-1 overflow-auto", customBackground ? "bg-transparent" : "bg-slate-950")}>
              {activeTab === 'terminal' ? (
                <TerminalPanel />
              ) : (
                <div className="p-4 text-sm text-slate-400">
                  {activeTab === 'problems' && (
                    <div className="flex flex-col gap-1">
                      {allProblems.length === 0 ? (
                        <div>No problems detected.</div>
                      ) : (
                        allProblems.map((p, i) => (
                          <div 
                            key={i} 
                            className="flex gap-2 items-center hover:bg-white/5 p-1 rounded cursor-pointer transition-colors"
                            onClick={() => openFile(p.file)}
                          >
                            {p.severity >= 8 ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                            <span className="truncate flex-1" title={p.message}>{p.message}</span>
                            <span className="text-slate-500 text-xs shrink-0">{p.file.split(/[\\/]/).pop()} [{p.startLineNumber}, {p.startColumn}]</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {activeTab === 'output' && <div>Output will appear here.</div>}
                  {activeTab === 'debug' && <div>Debug console initialized.</div>}
                  {activeTab === 'ai-logs' && <div>AI Workspace logs will stream here.</div>}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
