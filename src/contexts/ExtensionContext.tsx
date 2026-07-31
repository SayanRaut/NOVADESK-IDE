import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Extension {
  id: string;
  name: string;
  publisher: string;
  description: string;
  version: string;
  iconUrl?: string;
  tags: string[];
}

interface ExtensionState {
  installed: string[];
  enabled: string[];
}

interface ExtensionContextType {
  availableExtensions: Extension[];
  installedExtensions: string[];
  enabledExtensions: string[];
  installExtension: (id: string) => Promise<void>;
  uninstallExtension: (id: string) => Promise<void>;
  enableExtension: (id: string) => Promise<void>;
  disableExtension: (id: string) => Promise<void>;
  isInstalled: (id: string) => boolean;
  isEnabled: (id: string) => boolean;
}

const mockExtensions: Extension[] = [
  {
    id: 'python',
    name: 'Python',
    publisher: 'Microsoft',
    description: 'IntelliSense (Pylance), Linting, Debugging, code navigation, code formatting, refactoring, variable explorer, test explorer, and more!',
    version: '2024.2.1',
    tags: ['python', 'linters', 'debuggers'],
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg'
  },
  {
    id: 'prettier',
    name: 'Prettier - Code formatter',
    publisher: 'Prettier',
    description: 'Code formatter using prettier',
    version: '10.3.2',
    tags: ['formatters'],
    iconUrl: 'https://prettier.io/icon.png'
  },
  {
    id: 'eslint',
    name: 'ESLint',
    publisher: 'Microsoft',
    description: 'Integrates ESLint JavaScript into VS Code.',
    version: '2.4.4',
    tags: ['linters', 'javascript'],
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/ESLint_logo.svg'
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    description: 'Intelligent Tailwind CSS tooling for VS Code',
    version: '0.11.4',
    tags: ['css', 'autocomplete'],
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg'
  },
  {
    id: 'react-snippets',
    name: 'ES7+ React/Redux/React-Native snippets',
    publisher: 'dsznajder',
    description: 'Extensions for React, React-Native and Redux in JS/TS with ES7+ syntax',
    version: '4.4.3',
    tags: ['snippets', 'react'],
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg'
  }
];

const ExtensionContext = createContext<ExtensionContextType | undefined>(undefined);

export const ExtensionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExtensionState>({ installed: [], enabled: [] });

  useEffect(() => {
    // Load from local storage
    const savedState = localStorage.getItem('novadesk:extensions');
    if (savedState) {
      try {
        setState(JSON.parse(savedState));
      } catch (e) {
        console.error('Failed to parse extension state', e);
      }
    }
  }, []);

  const saveState = (newState: ExtensionState) => {
    setState(newState);
    localStorage.setItem('novadesk:extensions', JSON.stringify(newState));
  };

  const installExtension = async (id: string) => {
    if (state.installed.includes(id)) return;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    saveState({
      installed: [...state.installed, id],
      enabled: [...state.enabled, id]
    });
  };

  const uninstallExtension = async (id: string) => {
    if (!state.installed.includes(id)) return;
    await new Promise(resolve => setTimeout(resolve, 400));
    saveState({
      installed: state.installed.filter(eId => eId !== id),
      enabled: state.enabled.filter(eId => eId !== id)
    });
  };

  const enableExtension = async (id: string) => {
    if (!state.installed.includes(id) || state.enabled.includes(id)) return;
    saveState({
      ...state,
      enabled: [...state.enabled, id]
    });
  };

  const disableExtension = async (id: string) => {
    if (!state.enabled.includes(id)) return;
    saveState({
      ...state,
      enabled: state.enabled.filter(eId => eId !== id)
    });
  };

  const isInstalled = (id: string) => state.installed.includes(id);
  const isEnabled = (id: string) => state.enabled.includes(id);

  return (
    <ExtensionContext.Provider
      value={{
        availableExtensions: mockExtensions,
        installedExtensions: state.installed,
        enabledExtensions: state.enabled,
        installExtension,
        uninstallExtension,
        enableExtension,
        disableExtension,
        isInstalled,
        isEnabled
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
