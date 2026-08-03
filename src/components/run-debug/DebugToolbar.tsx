import React from 'react';
import { useDebug } from '../../contexts/DebugContext';
import { Play, Pause, Square, RotateCcw, ArrowDownToLine, StepForward, ArrowUpFromLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DebugToolbar() {
  const { debugState, stopDebugging } = useDebug();

  if (debugState === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#252526] border border-slate-700/50 shadow-xl rounded-md p-1 flex items-center gap-1 z-50 cursor-move"
      >
        <div className="w-1.5 h-4 bg-slate-600/50 rounded-sm mx-1 cursor-grab" title="Drag to move" />
        
        {debugState === 'paused' ? (
          <button className="p-1.5 hover:bg-slate-700 rounded text-blue-400" title="Continue (F5)">
            <Play className="w-4 h-4" />
          </button>
        ) : (
          <button className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Pause (F6)">
            <Pause className="w-4 h-4" />
          </button>
        )}

        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Step Over (F10)">
          <StepForward className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Step Into (F11)">
          <ArrowDownToLine className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-300" title="Step Out (Shift+F11)">
          <ArrowUpFromLine className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-green-400" title="Restart (Ctrl+Shift+F5)">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button 
          className="p-1.5 hover:bg-slate-700 rounded text-red-500" 
          title="Stop (Shift+F5)"
          onClick={() => stopDebugging()}
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
