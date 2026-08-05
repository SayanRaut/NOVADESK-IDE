import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type UIContextType = {
  activeSidebar: string | null;
  setActiveSidebar: (sidebar: string | null) => void;
  activeBottomPanel: string | null;
  setActiveBottomPanel: (panel: string | null) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
};

const UIContext = createContext<UIContextType | undefined>(undefined);
export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [activeSidebar, setActiveSidebar] = useState<string | null>('files');
  const [activeBottomPanel, setActiveBottomPanel] = useState<string | null>('terminal');
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = localStorage.getItem('novadesk:zoomLevel');
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('novadesk:zoomLevel', zoomLevel.toString());
    if (window.electronAPI) {
      window.electronAPI.setZoom(zoomLevel);
    }
  }, [zoomLevel]);

  // Global keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom In (Ctrl + = or Ctrl + +)
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoomLevel((z) => Math.min(2.5, z + 0.1));
      }
      // Zoom Out (Ctrl + -)
      else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setZoomLevel((z) => Math.max(0.5, z - 0.1));
      }
      // Reset Zoom (Ctrl + 0)
      else if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <UIContext.Provider value={{
      activeSidebar,
      setActiveSidebar,
      activeBottomPanel,
      setActiveBottomPanel,
      zoomLevel,
      setZoomLevel,
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) throw new Error('useUI must be used within a UIProvider');
  return context;
};
