import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (action: 'minimize' | 'maximize' | 'close') => ipcRenderer.invoke('window:control', action),
  setZoom: (zoomFactor: number) => ipcRenderer.invoke('window:setZoom', zoomFactor),
  setTheme: (theme: string) => ipcRenderer.invoke('window:setTheme', theme),
  openFolder: () => ipcRenderer.invoke('workspace:openFolder'),
  chooseFolder: () => ipcRenderer.invoke('workspace:chooseFolder'),
  setWorkspace: (rootPath: string) => ipcRenderer.invoke('workspace:setWorkspace', rootPath),
  readDirectory: (directoryPath: string) => ipcRenderer.invoke('workspace:readDirectory', directoryPath),
  readFile: (filePath: string) => ipcRenderer.invoke('workspace:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('workspace:writeFile', filePath, content),
  createFile: (parentPath: string, name: string, content?: string) => ipcRenderer.invoke('workspace:createFile', parentPath, name, content),
  createFolder: (parentPath: string, name: string) => ipcRenderer.invoke('workspace:createFolder', parentPath, name),
  renameFile: (oldPath: string, newName: string) => ipcRenderer.invoke('workspace:rename', oldPath, newName),
  deleteFile: (targetPath: string) => ipcRenderer.invoke('workspace:delete', targetPath),
  duplicateFile: (targetPath: string) => ipcRenderer.invoke('workspace:duplicate', targetPath),
  revealInExplorer: (targetPath: string) => ipcRenderer.invoke('workspace:reveal', targetPath),
  searchWorkspace: (query: string) => ipcRenderer.invoke('workspace:search', query),
  createProject: (parentDirectory: string, name: string, template: string) => ipcRenderer.invoke('workspace:createProject', parentDirectory, name, template),
  cloneRepository: (repositoryUrl: string, parentDirectory: string, name: string) => ipcRenderer.invoke('workspace:cloneRepository', repositoryUrl, parentDirectory, name),
  onWorkspaceFileChanged: (callback: (payload: { eventType: string; filename: string; fullPath: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: { eventType: string; filename: string; fullPath: string }) => callback(payload);
    ipcRenderer.on('workspace:fileChanged', listener);
    return () => ipcRenderer.removeListener('workspace:fileChanged', listener);
  },
  gitStatus: () => ipcRenderer.invoke('git:status'),
  gitInit: () => ipcRenderer.invoke('git:init'),
  getAIConnection: () => ipcRenderer.invoke('ai:getConnection'),
  saveAIConnection: (connection: { provider: 'novadesk' | 'openai-compatible'; baseUrl?: string; model?: string; apiKey?: string }) => ipcRenderer.invoke('ai:saveConnection', connection),
  clearAIConnection: () => ipcRenderer.invoke('ai:clearConnection'),
  testAIConnection: () => ipcRenderer.invoke('ai:testConnection'),
  chatWithAI: (payload: { messages: Array<{ role: 'user' | 'model'; content: string }>; context?: { activeFile?: string; activeFileContent?: string } }) => ipcRenderer.invoke('ai:chat', payload),
  subscribeTerminal: () => ipcRenderer.send('terminal:subscribe'),
  createTerminal: (cwd?: string) => ipcRenderer.invoke('terminal:create', cwd),
  killTerminal: (id: string) => ipcRenderer.invoke('terminal:kill', id),
  onTerminalData: (callback: (payload: { id: string; data: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: { id: string; data: string }) => callback(payload);
    ipcRenderer.on('terminal:data', listener);
    return () => ipcRenderer.removeListener('terminal:data', listener);
  },
  onTerminalExit: (callback: (id: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, id: string) => callback(id);
    ipcRenderer.on('terminal:exit', listener);
    return () => ipcRenderer.removeListener('terminal:exit', listener);
  },
  writeTerminal: (id: string, data: string) => ipcRenderer.send('terminal:write', id, data),
  resizeTerminal: (id: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', id, cols, rows),
  spawnTask: (command: string) => ipcRenderer.invoke('tasks:spawn', command),
  killTask: (id: string) => ipcRenderer.invoke('tasks:kill', id),
  startGoogleLogin: () => ipcRenderer.invoke('auth:startGoogleLogin'),
  onGoogleAuth: (callback: (payload: { ticket: string; state: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: { ticket: string; state: string }) => callback(payload);
    ipcRenderer.on('auth:callback', listener);
    return () => ipcRenderer.removeListener('auth:callback', listener);
  },
  checkPendingAuth: () => ipcRenderer.invoke('auth:checkPending'),

  saveTokens: (tokens: { access_token: string; refresh_token: string }) => ipcRenderer.invoke('auth:saveTokens', tokens),
  getTokens: () => ipcRenderer.invoke('auth:getTokens'),
  clearTokens: () => ipcRenderer.invoke('auth:clearTokens'),
  saveApiConfig: (config: { baseUrl: string }) => ipcRenderer.invoke('api:saveConfig', config),
  getApiConfig: () => ipcRenderer.invoke('api:getConfig'),
  searchExtensions: (query: string, sortBy?: string, sortOrder?: string, offset?: number) => ipcRenderer.invoke('extensions:search', query, sortBy, sortOrder, offset),
  installExtension: (namespace: string, name: string) => ipcRenderer.invoke('extensions:install', namespace, name),
  uninstallExtension: (id: string) => ipcRenderer.invoke('extensions:uninstall', id),
  getInstalledExtensions: () => ipcRenderer.invoke('extensions:getInstalled'),
  toggleExtension: (id: string, enabled: boolean) => ipcRenderer.invoke('extensions:toggle', id, enabled),
});
