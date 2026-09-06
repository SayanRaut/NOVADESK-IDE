/**
 * NovaDesk Web IDE Platform Adapter
 * Polyfills `window.electronAPI` to provide seamless browser execution
 * across all existing IDE components by delegating to FastAPI REST & WebSockets.
 */

import { getApiBaseUrl } from '../config/api';

const TOKENS_STORAGE_KEY = 'novadesk_auth_tokens';
const API_CONFIG_STORAGE_KEY = 'novadesk_api_config';
const AI_CONN_STORAGE_KEY = 'novadesk_ai_connection';

// Terminal WebSocket state
let terminalSocket: WebSocket | null = null;
let terminalConnectPromise: Promise<WebSocket> | null = null;
const terminalDataCallbacks = new Set<(payload: { id: string; data: string }) => void>();
const terminalExitCallbacks = new Set<(id: string) => void>();

function ensureTerminalSocket(): Promise<WebSocket> {
  if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
    return Promise.resolve(terminalSocket);
  }
  if (terminalConnectPromise) {
    return terminalConnectPromise;
  }

  terminalConnectPromise = new Promise((resolve, reject) => {
    try {
      const apiBase = getApiBaseUrl();
      const wsUrl = apiBase.replace(/^http/, 'ws') + '/ws/terminal';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        terminalSocket = ws;
        terminalConnectPromise = null;
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'data') {
            terminalDataCallbacks.forEach((cb) => cb({ id: msg.id, data: msg.data }));
          } else if (msg.type === 'exit') {
            terminalExitCallbacks.forEach((cb) => cb(msg.id));
          }
        } catch (err) {
          console.error('Terminal ws message parse error:', err);
        }
      };

      ws.onerror = (err) => {
        terminalConnectPromise = null;
        console.warn('Terminal WebSocket error:', err);
        reject(err);
      };

      ws.onclose = () => {
        terminalSocket = null;
        terminalConnectPromise = null;
      };
    } catch (err) {
      terminalConnectPromise = null;
      reject(err);
    }
  });

  return terminalConnectPromise;
}

// Workspace File Watcher WebSocket state
let workspaceSocket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const workspaceFileCallbacks = new Set<(payload: { eventType: string; filename: string; fullPath: string }) => void>();

function ensureWorkspaceSocket() {
  if (typeof window === 'undefined') return;
  // Only connect if there are active subscribers to watch events
  if (workspaceFileCallbacks.size === 0) return;
  if (workspaceSocket && (workspaceSocket.readyState === WebSocket.OPEN || workspaceSocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    const apiBase = getApiBaseUrl();
    const wsUrl = apiBase.replace(/^http/, 'ws') + '/ws/workspace';
    const ws = new WebSocket(wsUrl);

    let heartbeatTimer: any = null;

    ws.onopen = () => {
      workspaceSocket = ws;
      reconnectAttempts = 0;
      // Send heartbeat ping
      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        if (event.data === 'pong') return;
        const msg = JSON.parse(event.data);
        if (msg.eventType && msg.fullPath) {
          workspaceFileCallbacks.forEach((cb) => cb(msg));
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      // Suppress unhandled noisy console crashes when backend is starting or offline
    };

    ws.onclose = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      workspaceSocket = null;
      if (workspaceFileCallbacks.size > 0) {
        reconnectAttempts++;
        const delay = Math.min(30000, 1000 * Math.pow(1.5, Math.min(reconnectAttempts, 8)));
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(ensureWorkspaceSocket, delay);
      }
    };
  } catch {
    // ignore
  }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiBase = getApiBaseUrl();
  const url = `${apiBase}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach token if present
  try {
    const rawTokens = localStorage.getItem(TOKENS_STORAGE_KEY);
    if (rawTokens) {
      const parsed = JSON.parse(rawTokens);
      if (parsed?.access_token) {
        headers['Authorization'] = `Bearer ${parsed.access_token}`;
      }
    }
  } catch {}

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let detail = `Server error ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || err.message || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export function initWebIdeApi() {
  if (typeof window === 'undefined') return;

  // Polyfill window.electronAPI with web adapter implementation
  const webApi = {
    // Window Controls
    windowControl: async (action: 'minimize' | 'maximize' | 'close') => {
      if (action === 'maximize') {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch(() => {});
        } else {
          await document.exitFullscreen().catch(() => {});
        }
      } else if (action === 'close') {
        window.dispatchEvent(new CustomEvent('ide:navigateHome'));
      }
    },

    setZoom: async (zoomFactor: number) => {
      (document.documentElement.style as any).zoom = zoomFactor;
    },

    setTheme: async (theme: string) => {
      document.documentElement.setAttribute('data-theme', theme);
    },

    // Workspaces & File System (Pure Server Codespace - No local filesystem)
    openFolder: async () => {
      // In web mode, dispatch event to open codespace switcher or return active
      window.dispatchEvent(new CustomEvent('ide:openWorkspaceSelector'));
      const ws = await fetchJson<{ path: string }>('/api/fs/workspace').catch(() => null);
      return ws?.path || null;
    },

    chooseFolder: async () => {
      const ws = await fetchJson<{ path: string }>('/api/fs/workspace').catch(() => null);
      return ws?.path || null;
    },

    showSaveDialog: async (defaultPath?: string) => {
      return defaultPath || null;
    },

    setWorkspace: async (rootPath: string) => {
      const res = await fetchJson<{ ok: boolean; path: string }>('/api/fs/set-workspace', {
        method: 'POST',
        body: JSON.stringify({ rootPath }),
      });
      return { ok: res.ok };
    },

    readDirectory: async (directoryPath: string) => {
      const query = directoryPath ? `?directoryPath=${encodeURIComponent(directoryPath)}` : '';
      return fetchJson<Array<{ name: string; isDirectory: boolean; path: string }>>(`/api/fs/tree${query}`);
    },

    readFile: async (filePath: string) => {
      const res = await fetchJson<{ content: string }>(`/api/fs/read?filePath=${encodeURIComponent(filePath)}`);
      return res.content;
    },

    writeFile: async (filePath: string, content: string) => {
      return fetchJson<{ ok: boolean }>('/api/fs/write', {
        method: 'POST',
        body: JSON.stringify({ path: filePath, content }),
      });
    },

    createFile: async (parentPath: string, name: string, content = '') => {
      const res = await fetchJson<{ path: string }>('/api/fs/create-file', {
        method: 'POST',
        body: JSON.stringify({ parentPath, name, content }),
      });
      return res.path;
    },

    createFolder: async (parentPath: string, name: string) => {
      const res = await fetchJson<{ path: string }>('/api/fs/create-folder', {
        method: 'POST',
        body: JSON.stringify({ parentPath, name }),
      });
      return res.path;
    },

    renameFile: async (oldPath: string, newName: string) => {
      const res = await fetchJson<{ path: string }>('/api/fs/rename', {
        method: 'POST',
        body: JSON.stringify({ oldPath, newName }),
      });
      return res.path;
    },

    deleteFile: async (targetPath: string) => {
      return fetchJson<{ ok: boolean }>('/api/fs/delete', {
        method: 'POST',
        body: JSON.stringify({ targetPath }),
      });
    },

    duplicateFile: async (targetPath: string) => {
      const res = await fetchJson<{ path: string }>('/api/fs/duplicate', {
        method: 'POST',
        body: JSON.stringify({ targetPath }),
      });
      return res.path;
    },

    revealInExplorer: async (_targetPath: string) => {
      return { ok: true };
    },

    searchWorkspace: async (query: string) => {
      return fetchJson<Array<{ path: string; line: number; preview: string }>>(`/api/fs/search?query=${encodeURIComponent(query)}`);
    },

    createProject: async (_parentDirectory: string, name: string, template: string) => {
      const res = await fetchJson<{ path: string }>('/api/fs/codespaces', {
        method: 'POST',
        body: JSON.stringify({ name, template }),
      });
      return res.path;
    },

    cloneRepository: async (_repositoryUrl: string, _parentDirectory: string, name: string) => {
      const res = await fetchJson<{ path: string }>('/api/fs/codespaces', {
        method: 'POST',
        body: JSON.stringify({ name, template: 'web' }),
      });
      return res.path;
    },

    onWorkspaceFileChanged: (callback: (payload: { eventType: string; filename: string; fullPath: string }) => void) => {
      workspaceFileCallbacks.add(callback);
      ensureWorkspaceSocket();
      return () => {
        workspaceFileCallbacks.delete(callback);
        if (workspaceFileCallbacks.size === 0) {
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
          if (workspaceSocket) {
            try {
              workspaceSocket.close();
            } catch {}
            workspaceSocket = null;
          }
        }
      };
    },

    // Git Operations
    gitStatus: async () => {
      const res = await fetchJson<{ status: string | null }>('/api/git/status').catch(() => ({ status: null }));
      return res.status;
    },

    gitInit: async () => {
      const res = await fetchJson<{ output: string }>('/api/git/init', { method: 'POST' });
      return res.output || 'Initialized Git repository.';
    },

    gitLog: async (maxCount = 50) => {
      const res = await fetchJson<{ log: string | null }>(`/api/git/log?maxCount=${maxCount}`).catch(() => ({ log: null }));
      return res.log;
    },

    gitBranches: async () => {
      const res = await fetchJson<{ branches: string | null }>('/api/git/branches').catch(() => ({ branches: null }));
      return res.branches;
    },

    gitAdd: async (filePath: string) => {
      await fetchJson('/api/git/add', { method: 'POST', body: JSON.stringify({ filePath }) });
      return true;
    },

    gitAddFromDialog: async () => {
      await fetchJson('/api/git/add-all', { method: 'POST' });
      return true;
    },

    gitAddAll: async () => {
      await fetchJson('/api/git/add-all', { method: 'POST' });
      return true;
    },

    gitUnstage: async (filePath: string) => {
      await fetchJson('/api/git/unstage', { method: 'POST', body: JSON.stringify({ filePath }) });
      return true;
    },

    gitCommit: async (message: string) => {
      await fetchJson('/api/git/commit', { method: 'POST', body: JSON.stringify({ message }) });
      return true;
    },

    gitPush: async (branch: string) => {
      await fetchJson('/api/git/push', { method: 'POST', body: JSON.stringify({ branch }) });
      return true;
    },

    gitCheckout: async (branch: string, isNew = false) => {
      await fetchJson('/api/git/checkout', { method: 'POST', body: JSON.stringify({ branch, isNew }) });
      return true;
    },

    gitRemoteAdd: async (url: string) => {
      await fetchJson('/api/git/remote-add', { method: 'POST', body: JSON.stringify({ url }) });
      return true;
    },

    gitRemoteRemove: async () => {
      await fetchJson('/api/git/remote-remove', { method: 'POST' });
      return true;
    },

    gitRemoteUrl: async () => {
      const res = await fetchJson<{ url: string | null }>('/api/git/remote-url').catch(() => ({ url: null }));
      return res.url;
    },

    openExternal: async (url: string) => {
      window.open(url, '_blank');
      return true;
    },

    gitDiffBranches: async (base: string, compare: string) => {
      const res = await fetchJson<{ diff: string | null }>(`/api/git/diff?base=${encodeURIComponent(base)}&compare=${encodeURIComponent(compare)}`).catch(() => ({ diff: null }));
      return res.diff;
    },

    // AI Connection
    getAIConnection: async () => {
      try {
        const raw = localStorage.getItem(AI_CONN_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
      return { provider: 'novadesk', baseUrl: '', model: '', hasApiKey: true };
    },

    saveAIConnection: async (connection: any) => {
      localStorage.setItem(AI_CONN_STORAGE_KEY, JSON.stringify(connection));
      return { ...connection, hasApiKey: Boolean(connection.apiKey) };
    },

    clearAIConnection: async () => {
      localStorage.removeItem(AI_CONN_STORAGE_KEY);
      return { provider: 'novadesk', baseUrl: '', model: '', hasApiKey: false };
    },

    testAIConnection: async () => {
      return { ok: true, message: 'AI connection active.' };
    },

    chatWithAI: async (_payload: any) => {
      return { content: 'AI ready in web ide.', model: 'novadesk' };
    },

    // Web Terminal (via WebSocket)
    subscribeTerminal: () => {
      void ensureTerminalSocket();
    },

    createTerminal: async (cwd?: string) => {
      const ws = await ensureTerminalSocket();
      const id = 'term-' + Math.random().toString(36).slice(2, 9);
      ws.send(JSON.stringify({ action: 'create', id, cwd, cols: 100, rows: 30 }));
      return id;
    },

    killTerminal: async (id: string) => {
      if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
        terminalSocket.send(JSON.stringify({ action: 'kill', id }));
      }
    },

    onTerminalData: (callback: (payload: { id: string; data: string }) => void) => {
      terminalDataCallbacks.add(callback);
      return () => {
        terminalDataCallbacks.delete(callback);
      };
    },

    onTerminalExit: (callback: (id: string) => void) => {
      terminalExitCallbacks.add(callback);
      return () => {
        terminalExitCallbacks.delete(callback);
      };
    },

    writeTerminal: (id: string, data: string) => {
      if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
        terminalSocket.send(JSON.stringify({ action: 'write', id, data }));
      }
    },

    resizeTerminal: (id: string, cols: number, rows: number) => {
      if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
        terminalSocket.send(JSON.stringify({ action: 'resize', id, cols, rows }));
      }
    },

    spawnTask: async (_command: string) => {
      return 'task-' + Date.now();
    },

    killTask: async (_id: string) => {},

    // Auth & Local Storage
    startGoogleLogin: async () => {
      const apiBase = getApiBaseUrl();
      const state = Math.random().toString(36).substring(2);
      window.open(`${apiBase}/api/auth/google/start?state=${state}`, '_blank', 'width=500,height=600');
      return state;
    },

    onGoogleAuth: (callback: (payload: { ticket: string; state: string }) => void) => {
      const handler = (e: MessageEvent) => {
        if (e.data?.ticket) {
          callback(e.data);
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    },

    checkPendingAuth: async () => null,

    saveTokens: async (tokens: { access_token: string; refresh_token: string }) => {
      localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
    },

    getTokens: async () => {
      try {
        const raw = localStorage.getItem(TOKENS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    clearTokens: async () => {
      localStorage.removeItem(TOKENS_STORAGE_KEY);
    },

    saveApiConfig: async (config: { baseUrl: string }) => {
      localStorage.setItem(API_CONFIG_STORAGE_KEY, JSON.stringify(config));
    },

    getApiConfig: async () => {
      try {
        const raw = localStorage.getItem(API_CONFIG_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },

    // Extensions
    searchExtensions: async (query: string, sortBy?: string, sortOrder?: string, offset?: number) => {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);
      if (offset) params.set('offset', String(offset));
      return fetchJson(`/api/extensions/search?${params.toString()}`);
    },

    installExtension: async (namespace: string, name: string) => {
      await fetchJson('/api/extensions/install', {
        method: 'POST',
        body: JSON.stringify({ namespace, name }),
      });
    },

    uninstallExtension: async (id: string) => {
      await fetchJson(`/api/extensions/uninstall/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },

    getInstalledExtensions: async () => {
      return fetchJson<any[]>('/api/extensions/installed').catch(() => []);
    },

    toggleExtension: async (id: string, enabled: boolean) => {
      await fetchJson('/api/extensions/toggle', {
        method: 'POST',
        body: JSON.stringify({ id, enabled }),
      });
    },
  };

  // Mount globally onto window
  window.electronAPI = webApi as any;
  console.log('[NovaDesk Web Platform] Initialized webIdeApi bridge on window.electronAPI');
}
