import { createContext, useContext, useCallback } from 'react';

interface WindowContextType {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  toggleFullscreen: () => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export function WindowProvider({ children }: { children: React.ReactNode }) {
  const minimize = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.windowControl('minimize');
    }
  }, []);

  const maximize = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.windowControl('maximize');
    }
  }, []);

  const close = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.windowControl('close');
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.windowControl('maximize');
    }
  }, []);

  return (
    <WindowContext.Provider value={{ minimize, maximize, close, toggleFullscreen }}>
      {children}
    </WindowContext.Provider>
  );
}

export function useWindowControls() {
  const context = useContext(WindowContext);
  if (context === undefined) {
    throw new Error('useWindowControls must be used within a WindowProvider');
  }
  return context;
}
