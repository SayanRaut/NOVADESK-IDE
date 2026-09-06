import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppPage = 'home' | 'create' | 'generating' | 'ide';

export interface PrototypeRequest {
  name: string;
  template: string;
  prompt: string;
  apiKey?: string;
  plan?: any;
}

interface NavigationContextType {
  page: AppPage;
  navigateTo: (page: AppPage) => void;
  prototypeReq: PrototypeRequest | null;
  startPrototypeGeneration: (req: PrototypeRequest) => void;
  activeCodespaceName: string | null;
  openCodespace: (name: string, path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<AppPage>(() => {
    // If a workspace was already open, default to ide, otherwise home
    const saved = localStorage.getItem('novadesk:currentWorkspace');
    return saved ? 'ide' : 'home';
  });

  const [prototypeReq, setPrototypeReq] = useState<PrototypeRequest | null>(null);
  const [activeCodespaceName, setActiveCodespaceName] = useState<string | null>(() => {
    const saved = localStorage.getItem('novadesk:currentWorkspace');
    return saved ? saved.split(/[\\/]/).filter(Boolean).pop() || null : null;
  });

  const navigateTo = (targetPage: AppPage) => {
    setPage(targetPage);
  };

  const startPrototypeGeneration = (req: PrototypeRequest) => {
    setPrototypeReq(req);
    setPage('generating');
  };

  const openCodespace = async (name: string, path: string) => {
    setActiveCodespaceName(name);
    localStorage.setItem('novadesk:currentWorkspace', path);
    window.dispatchEvent(new CustomEvent('novadesk:openWorkspace', { detail: { path, name } }));
    if (window.electronAPI) {
      await window.electronAPI.setWorkspace(path).catch(() => {});
    }
    setPage('ide');
  };

  useEffect(() => {
    const handleNavHome = () => setPage('home');
    window.addEventListener('ide:navigateHome', handleNavHome);
    return () => window.removeEventListener('ide:navigateHome', handleNavHome);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        page,
        navigateTo,
        prototypeReq,
        startPrototypeGeneration,
        activeCodespaceName,
        openCodespace,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
