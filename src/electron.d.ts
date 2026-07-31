export {};

declare global {
  interface Window {
    electronAPI?: {
      windowControl: (action: 'minimize' | 'maximize' | 'close') => Promise<void>;
      openFolder: () => Promise<string | null>;
      chooseFolder: () => Promise<string | null>;
      setWorkspace: (rootPath: string) => Promise<{ ok: boolean }>;
      readDirectory: (directoryPath: string) => Promise<Array<{ name: string; isDirectory: boolean; path: string }>>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<{ ok: boolean }>;
      createFile: (parentPath: string, name: string, content?: string) => Promise<string>;
      createFolder: (parentPath: string, name: string) => Promise<string>;
      renameFile: (oldPath: string, newName: string) => Promise<string>;
      deleteFile: (targetPath: string) => Promise<{ ok: boolean }>;
      duplicateFile: (targetPath: string) => Promise<string>;
      revealInExplorer: (targetPath: string) => Promise<{ ok: boolean }>;
      searchWorkspace: (query: string) => Promise<Array<{ path: string; line: number; preview: string }>>;
      createProject: (parentDirectory: string, name: string, template: string) => Promise<string>;
      cloneRepository: (repositoryUrl: string, parentDirectory: string, name: string) => Promise<string>;
      onWorkspaceFileChanged: (callback: (payload: { eventType: string; filename: string; fullPath: string }) => void) => () => void;
      gitStatus: () => Promise<string | null>;
      gitInit: () => Promise<string>;
      getAIConnection: () => Promise<{ provider: 'novadesk' | 'openai-compatible'; baseUrl: string; model: string; hasApiKey: boolean }>;
      saveAIConnection: (connection: { provider: 'novadesk' | 'openai-compatible'; baseUrl?: string; model?: string; apiKey?: string }) => Promise<{ provider: 'novadesk' | 'openai-compatible'; baseUrl: string; model: string; hasApiKey: boolean }>;
      clearAIConnection: () => Promise<{ provider: 'novadesk' | 'openai-compatible'; baseUrl: string; model: string; hasApiKey: boolean }>;
      testAIConnection: () => Promise<{ ok: boolean; message: string }>;
      chatWithAI: (payload: { messages: Array<{ role: 'user' | 'model'; content: string }>; context?: { activeFile?: string; activeFileContent?: string } }) => Promise<{ content: string; model: string }>;
      subscribeTerminal: () => void;
      createTerminal: (cwd?: string) => Promise<string>;
      killTerminal: (id: string) => Promise<void>;
      onTerminalData: (callback: (payload: { id: string; data: string }) => void) => () => void;
      onTerminalExit: (callback: (id: string) => void) => () => void;
      writeTerminal: (id: string, data: string) => void;
      resizeTerminal: (id: string, cols: number, rows: number) => void;
      spawnTask: (command: string) => Promise<string>;
      killTask: (id: string) => Promise<void>;

      startGoogleLogin: () => Promise<string>;
      onGoogleAuth: (callback: (payload: { ticket: string; state: string }) => void) => () => void;
      checkPendingAuth: () => Promise<{ ticket: string; state: string } | null>;
      saveTokens: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
      getTokens: () => Promise<{ access_token: string; refresh_token: string } | null>;
      clearTokens: () => Promise<void>;
      saveApiConfig: (config: { baseUrl: string }) => Promise<void>;
      getApiConfig: () => Promise<{ baseUrl: string } | null>;
      searchExtensions: (query: string, sortBy?: string, sortOrder?: string, offset?: number) => Promise<any>;
      installExtension: (namespace: string, name: string) => Promise<void>;
      uninstallExtension: (id: string) => Promise<void>;
      getInstalledExtensions: () => Promise<any[]>;
      toggleExtension: (id: string, enabled: boolean) => Promise<void>;
    };
  }
}
