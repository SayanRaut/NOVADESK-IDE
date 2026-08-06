import { createContext, useContext, useState } from 'react';


export type BottomPanelTab = 'terminal' | 'problems' | 'output';

interface PanelContextType {
  activeTab: BottomPanelTab;
  setActiveTab: (tab: BottomPanelTab) => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function PanelProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<BottomPanelTab>('terminal');

  return (
    <PanelContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanel must be used within a PanelProvider');
  }
  return context;
}

