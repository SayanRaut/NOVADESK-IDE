import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type TerminalInfo = {
  id: string;
  name: string;
};

interface TerminalContextType {
  terminals: TerminalInfo[];
  activeTerminalId: string | null;
  newTerminal: (cwd?: string) => Promise<string>;
  closeTerminal: (id: string) => Promise<void>;
  renameTerminal: (id: string, newName: string) => void;
  setActiveTerminal: (id: string) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [terminals, setTerminals] = useState<TerminalInfo[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.subscribeTerminal();
      
      const cleanup = window.electronAPI.onTerminalExit((id: string) => {
        setTerminals((prev) => {
          const next = prev.filter(t => t.id !== id);
          if (next.length === 0) {
            setActiveTerminalId(null);
          } else if (activeTerminalId === id) {
            setActiveTerminalId(next[next.length - 1].id);
          }
          return next;
        });
      });

      return cleanup;
    }
  }, [activeTerminalId]);

  const newTerminal = useCallback(async (cwd?: string) => {
    if (!window.electronAPI) return '';
    const id = await window.electronAPI.createTerminal(cwd);
    setTerminals(prev => [...prev, { id, name: `Terminal ${prev.length + 1}` }]);
    setActiveTerminalId(id);
    return id;
  }, []);

  const closeTerminal = useCallback(async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.killTerminal(id);
    }
    setTerminals((prev) => {
      const next = prev.filter(t => t.id !== id);
      if (next.length === 0) setActiveTerminalId(null);
      else if (activeTerminalId === id) setActiveTerminalId(next[next.length - 1].id);
      return next;
    });
  }, [activeTerminalId]);

  const renameTerminal = useCallback((id: string, newName: string) => {
    setTerminals(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  }, []);

  return (
    <TerminalContext.Provider value={{ terminals, activeTerminalId, newTerminal, closeTerminal, renameTerminal, setActiveTerminal: setActiveTerminalId }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) throw new Error('useTerminal must be used within TerminalProvider');
  return context;
}
