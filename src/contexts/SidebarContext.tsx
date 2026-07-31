import { createContext, useContext, useState } from 'react';


export type ActivityItem = 'explorer' | 'search' | 'source-control' | 'run-debug' | 'extensions' | 'ai' | 'settings';

interface SidebarContextType {
  activeActivity: ActivityItem;
  setActiveActivity: (activity: ActivityItem) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [activeActivity, setActiveActivity] = useState<ActivityItem>('explorer');

  return (
    <SidebarContext.Provider value={{ activeActivity, setActiveActivity }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

