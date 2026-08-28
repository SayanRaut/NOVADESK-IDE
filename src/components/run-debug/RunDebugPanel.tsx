import { useState } from 'react';
import { Play, Settings, ChevronRight, ChevronDown, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from '../../contexts/EditorContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { useDebug } from '../../contexts/DebugContext';
import { usePanel } from '../../contexts/PanelContext';
import { useLayout } from '../../contexts/LayoutContext';

type SectionState = {
  variables: boolean;
  watch: boolean;
  callStack: boolean;
  breakpoints: boolean;
};

export function RunDebugPanel() {
  const { editorGroups, activeGroupId } = useEditor();
  const { activeTerminalId, newTerminal } = useTerminal();
  const { debugState, startDebugging, breakpoints, clearBreakpoints } = useDebug();
  const { setActiveTab } = usePanel();
  const { setBottomPanelOpen } = useLayout();

  const [sections, setSections] = useState<SectionState>({
    variables: true,
    watch: true,
    callStack: true,
    breakpoints: true,
  });

  const toggleSection = (section: keyof SectionState) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleStartDebugging = async () => {
    const activeGroup = editorGroups.find(g => g.id === activeGroupId);
    if (!activeGroup?.activeFile) return;

    let terminalId = activeTerminalId;
    if (!terminalId) {
      terminalId = await newTerminal();
    }

    startDebugging(activeGroup.activeFile, '');
    setActiveTab('terminal');
    setBottomPanelOpen(true);
    
    if (window.electronAPI && terminalId) {
      const ext = activeGroup.activeFile.split('.').pop()?.toLowerCase();
      let cmd = '';
      if (ext === 'js') cmd = `node "${activeGroup.activeFile}"\n`;
      else if (ext === 'py') cmd = `python "${activeGroup.activeFile}"\n`;
      else if (ext === 'ts') cmd = `npx ts-node "${activeGroup.activeFile}"\n`;
      else cmd = `echo "Cannot run file with extension .${ext}"\n`;
      
      window.electronAPI.writeTerminal(terminalId, cmd);
    }
  };

  const SectionHeader = ({ title, section, extra }: { title: string; section: keyof SectionState; extra?: React.ReactNode }) => (
    <div
      className="flex items-center justify-between px-2 py-1 hover:bg-[var(--hover-bg)] cursor-pointer group text-[11px] font-bold text-slate-400 uppercase tracking-wide border-t border-[var(--border-color)]"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-1">
        {sections[section] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span>{title}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        {extra}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full glass-panel text-slate-300 overflow-hidden select-none">
      {/* Header Section */}
      <div className="p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
        <select className="flex-1 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded text-slate-200 text-[13px] px-2 py-1 outline-none focus:border-[var(--accent)] mr-2">
          <option>Launch Program</option>
          <option>Node.js</option>
          <option>Chrome</option>
        </select>
        <div className="flex items-center gap-1 text-slate-400">
          <button 
            title="Start Debugging" 
            className="p-1 hover:text-green-400 transition-colors rounded hover:glass-panel"
            onClick={handleStartDebugging}
            disabled={debugState !== 'idle'}
          >
            <Play className={`w-4 h-4 ${debugState !== 'idle' ? 'opacity-50' : ''}`} />
          </button>
          <button title="Configure (launch.json)" className="p-1 hover:text-slate-200 transition-colors rounded hover:glass-panel">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accordions */}
      <div className="flex-1 overflow-y-auto">
        {/* Variables */}
        <div className="flex flex-col">
          <SectionHeader title="Variables" section="variables" />
          <AnimatePresence initial={false}>
            {sections.variables && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="py-2 px-6 text-[13px] text-slate-500 italic">No variables available.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Watch */}
        <div className="flex flex-col">
          <SectionHeader
            title="Watch"
            section="watch"
            extra={
              <button title="Add Expression" className="p-0.5 hover:text-slate-200 rounded">
                <Plus className="w-3.5 h-3.5" />
              </button>
            }
          />
          <AnimatePresence initial={false}>
            {sections.watch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="py-2 px-6 text-[13px] text-slate-500 italic">No watch expressions.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Call Stack */}
        <div className="flex flex-col">
          <SectionHeader title="Call Stack" section="callStack" />
          <AnimatePresence initial={false}>
            {sections.callStack && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="py-2 px-6 text-[13px] text-slate-500 italic">Not paused.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Breakpoints */}
        <div className="flex flex-col">
          <SectionHeader
            title="Breakpoints"
            section="breakpoints"
            extra={
              <button 
                title="Remove All Breakpoints" 
                className="p-0.5 hover:text-slate-200 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  clearBreakpoints();
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            }
          />
          <AnimatePresence initial={false}>
            {sections.breakpoints && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {breakpoints.length === 0 ? (
                  <div className="py-2 px-6 text-[13px] text-slate-500 italic">No breakpoints.</div>
                ) : (
                  <div className="py-1 flex flex-col">
                    {breakpoints.map((bp, i) => (
                      <div key={i} className="px-6 py-1 hover:bg-[var(--hover-bg)] cursor-pointer flex items-center gap-2 group">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-700 shadow-sm shrink-0" />
                        <div className="flex-1 text-[13px] text-slate-300 truncate">
                          {bp.filePath.split(/[\\/]/).pop()}
                        </div>
                        <div className="text-[11px] text-slate-500 group-hover:text-slate-400 font-mono">
                          Line {bp.line}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
