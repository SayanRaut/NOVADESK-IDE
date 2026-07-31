import { createContext, useContext, useState, type ReactNode } from 'react';

type UIContextType = {
  activeSidebar: string | null;
  setActiveSidebar: (sidebar: string | null) => void;
  activeBottomPanel: string | null;
  setActiveBottomPanel: (panel: string | null) => void;
};

const UIContext = createContext<UIContextType | undefined>(undefined);
export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [activeSidebar, setActiveSidebar] = useState<string | null>('files');
  const [activeBottomPanel, setActiveBottomPanel] = useState<string | null>('terminal');

  return (
    <UIContext.Provider value={{
      activeSidebar,
      setActiveSidebar,
      activeBottomPanel,
      setActiveBottomPanel,
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
