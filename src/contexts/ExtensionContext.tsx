import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

export interface Extension {
  id: string; // namespace.name
  namespace: string;
  name: string;
  publisher: string;
  description: string;
  version: string;
  iconUrl?: string;
  tags?: string[];
  downloadCount?: number;
  averageRating?: number;
}

export interface ExtensionState {
  installed: Extension[];
  enabledIds: string[];
}

interface ExtensionContextType {
  installedExtensions: Extension[];
  enabledExtensions: string[];
  installExtension: (namespace: string, name: string) => Promise<void>;
  uninstallExtension: (id: string) => Promise<void>;
  enableExtension: (id: string) => Promise<void>;
  disableExtension: (id: string) => Promise<void>;
  isInstalled: (id: string) => boolean;
  isEnabled: (id: string) => boolean;
  refreshInstalled: () => Promise<void>;
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(undefined);

export const ExtensionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installedExtensions, setInstalledExtensions] = useState<Extension[]>([]);
  const [enabledExtensions, setEnabledExtensions] = useState<string[]>([]);

  const refreshInstalled = useCallback(async () => {
    if (window.electronAPI && window.electronAPI.getInstalledExtensions) {
      try {
        const exts = await window.electronAPI.getInstalledExtensions();
        setInstalledExtensions(exts);
        setEnabledExtensions(exts.filter((e: any) => e.enabled).map((e: any) => e.id));
      } catch (err) {
        console.error('Failed to get installed extensions', err);
      }
    }
  }, []);

  useEffect(() => {
    refreshInstalled();
  }, [refreshInstalled]);

  const installExtension = async (namespace: string, name: string) => {
    if (window.electronAPI && window.electronAPI.installExtension) {
      await window.electronAPI.installExtension(namespace, name);
      await refreshInstalled();
    }
  };

  const uninstallExtension = async (id: string) => {
    if (window.electronAPI && window.electronAPI.uninstallExtension) {
      await window.electronAPI.uninstallExtension(id);
      await refreshInstalled();
    }
  };

  const enableExtension = async (id: string) => {
    if (window.electronAPI && window.electronAPI.toggleExtension) {
      await window.electronAPI.toggleExtension(id, true);
      await refreshInstalled();
    }
  };

  const disableExtension = async (id: string) => {
    if (window.electronAPI && window.electronAPI.toggleExtension) {
      await window.electronAPI.toggleExtension(id, false);
      await refreshInstalled();
    }
  };

  const isInstalled = (id: string) => installedExtensions.some(ext => ext.id === id);
  const isEnabled = (id: string) => enabledExtensions.includes(id);

  return (
    <ExtensionContext.Provider
      value={{
        installedExtensions,
        enabledExtensions,
        installExtension,
        uninstallExtension,
        enableExtension,
        disableExtension,
        isInstalled,
        isEnabled,
        refreshInstalled
      }}
    >
      {children}
    </ExtensionContext.Provider>
  );
};

export const useExtensions = () => {
  const context = useContext(ExtensionContext);
  if (context === undefined) {
    throw new Error('useExtensions must be used within an ExtensionProvider');
  }
  return context;
};
