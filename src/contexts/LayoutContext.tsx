import { createContext, useContext, useState } from 'react';


interface LayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isAISidebarOpen: boolean;
  toggleAISidebar: () => void;
  isBottomPanelOpen: boolean;
  toggleBottomPanel: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setAISidebarOpen: (isOpen: boolean) => void;
  setBottomPanelOpen: (isOpen: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAISidebarOpen, setAISidebarOpen] = useState(false);
  const [isBottomPanelOpen, setBottomPanelOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleAISidebar = () => setAISidebarOpen((prev) => !prev);
  const toggleBottomPanel = () => setBottomPanelOpen((prev) => !prev);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        isAISidebarOpen,
        toggleAISidebar,
        isBottomPanelOpen,
        toggleBottomPanel,
        setSidebarOpen,
        setAISidebarOpen,
        setBottomPanelOpen,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

