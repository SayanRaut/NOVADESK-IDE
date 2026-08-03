import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

export type DebugState = 'idle' | 'running' | 'paused';

export type Breakpoint = {
  filePath: string;
  line: number;
};

interface DebugContextType {
  debugState: DebugState;
  setDebugState: (state: DebugState) => void;
  breakpoints: Breakpoint[];
  toggleBreakpoint: (filePath: string, line: number) => void;
  clearBreakpoints: () => void;
  startDebugging: (filePath: string, command: string) => void;
  stopDebugging: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugState, setDebugState] = useState<DebugState>('idle');
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);

  const toggleBreakpoint = useCallback((filePath: string, line: number) => {
    setBreakpoints(prev => {
      const existsIndex = prev.findIndex(bp => bp.filePath === filePath && bp.line === line);
      if (existsIndex >= 0) {
        const next = [...prev];
        next.splice(existsIndex, 1);
        return next;
      } else {
        return [...prev, { filePath, line }];
      }
    });
  }, []);

  const clearBreakpoints = useCallback(() => {
    setBreakpoints([]);
  }, []);

  const startDebugging = useCallback((filePath: string, command: string) => {
    setDebugState('running');
    // Actual launch logic will be wired where this is called
  }, []);

  const stopDebugging = useCallback(() => {
    setDebugState('idle');
  }, []);

  return (
    <DebugContext.Provider value={{
      debugState,
      setDebugState,
      breakpoints,
      toggleBreakpoint,
      clearBreakpoints,
      startDebugging,
      stopDebugging
    }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}
