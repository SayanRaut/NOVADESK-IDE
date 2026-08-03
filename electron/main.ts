import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell, type WebContents } from 'electron';
import { randomBytes, randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';

import { OpenVSXClient } from './extensions/OpenVSXClient';
import { VSIXInstaller } from './extensions/VSIXInstaller';
import { extensionRegistry } from './extensions/ExtensionRegistry';
import { extensionHostManager } from './extensions/ExtensionHostManager';

// Ensure dotenv loads from the project root instead of wherever the process started
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
dotenv.config({ path: path.join(__dirname, '../.env') });

const pty = require('node-pty') as typeof import('node-pty');
const isDev = process.env.NODE_ENV === 'development';
const desktopScheme = 'novadesk';
const apiOrigin = process.env.VITE_NOVADESK_API_URL || process.env.NOVADESK_API_URL || 'https://novadesk-ide.onrender.com';

let mainWindow: BrowserWindow | null = null;
let workspaceRoot: string | null = null;
const ptyProcesses = new Map<string, import('node-pty').IPty>();
const terminalSubscribers = new Set<WebContents>();
let pendingAuthCallback: { ticket: string; state: string } | null = null;
const execFileAsync = promisify(execFile);

type AIConnection = {
  provider: 'novadesk' | 'openai-compatible';
  baseUrl: string;
  model: string;
  encryptedApiKey?: string;
};

type PublicAIConnection = Omit<AIConnection, 'encryptedApiKey'> & { hasApiKey: boolean };

const aiConnectionPath = () => path.join(app.getPath('userData'), 'ai-connection.json');

const readAIConnection = (): AIConnection => {
  try {
    const parsed = JSON.parse(fs.readFileSync(aiConnectionPath(), 'utf-8')) as Partial<AIConnection>;
    return {
      provider: parsed.provider === 'openai-compatible' ? 'openai-compatible' : 'novadesk',
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
      encryptedApiKey: typeof parsed.encryptedApiKey === 'string' ? parsed.encryptedApiKey : undefined,
    };
  } catch {
    return { provider: 'novadesk', baseUrl: '', model: '' };
  }
};

const publicAIConnection = (connection: AIConnection): PublicAIConnection => ({
  provider: connection.provider,
  baseUrl: connection.baseUrl,
  model: connection.model,
  hasApiKey: Boolean(connection.encryptedApiKey),
});

const getAPIKey = (connection: AIConnection) => {
  if (!connection.encryptedApiKey) return '';
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Your operating system key store is unavailable. NovaDesk cannot safely unlock the AI key.');
  return safeStorage.decryptString(Buffer.from(connection.encryptedApiKey, 'base64'));
};

const normalizeAIBaseUrl = (value: string) => {
  const parsed = new URL(value.trim());
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('The AI service URL must begin with http:// or https://.');
  return parsed.toString().replace(/\/$/, '');
};

const isInsideWorkspace = (candidatePath: string) => {
  if (!workspaceRoot) return false;
  const relative = path.relative(workspaceRoot, path.resolve(candidatePath));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

const ignoredDirectoryNames = new Set(['.git', 'node_modules', '.venv', 'dist', 'build', '.next', '__pycache__']);

const sendTerminalData = (id: string, data: string) => {
  for (const subscriber of terminalSubscribers) {
    if (!subscriber.isDestroyed()) subscriber.send('terminal:data', { id, data });
  }
};

const stopTerminal = (id: string) => {
  const ptyProcess = ptyProcesses.get(id);
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcesses.delete(id);
  }
};

const createTerminal = (cwd?: string) => {
  const id = randomUUID();
  let shell = 'bash';
  if (os.platform() === 'win32') {
    shell = 'powershell.exe';
  } else if (process.env.SHELL) {
    shell = process.env.SHELL;
  }
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 100,
    rows: 30,
    cwd: cwd || workspaceRoot || process.cwd(),
    env: process.env as Record<string, string>,
  });
  
  ptyProcess.onData((data) => sendTerminalData(id, data));
  ptyProcess.onExit(() => {
    ptyProcesses.delete(id);
    // Let frontend know it exited
    for (const subscriber of terminalSubscribers) {
      if (!subscriber.isDestroyed()) subscriber.send('terminal:exit', id);
    }
  });
  
  ptyProcesses.set(id, ptyProcess);
  return id;
};

const runGit = async (args: string[]) => {
  if (!workspaceRoot) throw new Error('Open a workspace first.');
  const { stdout, stderr } = await execFileAsync('git', args, { cwd: workspaceRoot, windowsHide: true });
  return { stdout, stderr };
};

const makeProjectFiles = (template: string, name: string): Record<string, string> => {
  const packageName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'novadesk-project';
  if (template === 'python') {
    return {
      'main.py': 'def main():\n    print("Hello from NovaDesk!")\n\n\nif __name__ == "__main__":\n    main()\n',
      'README.md': `# ${name}\n\nA Python project created with NovaDesk.\n`,
      '.gitignore': '__pycache__/\n.venv/\n.env\n',
    };
  }
  if (template === 'html') {
    return {
      'index.html': `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${name}</title>\n    <link rel="stylesheet" href="style.css" />\n  </head>\n  <body>\n    <main>\n      <h1>${name}</h1>\n      <p>Built with NovaDesk.</p>\n    </main>\n    <script src="script.js"></script>\n  </body>\n</html>\n`,
      'style.css': 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #101827; color: #f8fafc; }\nmain { text-align: center; }\n',
      'script.js': 'console.log("NovaDesk project ready");\n',
      'README.md': `# ${name}\n\nOpen \`index.html\` in a browser to get started.\n`,
    };
  }
  return {
    'package.json': JSON.stringify({ name: packageName, private: true, version: '0.1.0', type: 'module', scripts: { dev: 'vite', build: 'vite build' }, devDependencies: { vite: '^8.0.0' } }, null, 2) + '\n',
    'index.html': '<!doctype html>\n<html lang="en">\n  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>NovaDesk App</title></head>\n  <body><div id="app"></div><script type="module" src="/src/main.js"></script></body>\n</html>\n',
    'src/main.js': `import './style.css';\n\ndocument.querySelector('#app').innerHTML = \`<main><h1>${name}</h1><p>Your NovaDesk project is ready.</p></main>\`;\n`,
    'src/style.css': 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Inter, system-ui, sans-serif; background: #0f172a; color: #f8fafc; }\nmain { text-align: center; }\n',
    '.gitignore': 'node_modules/\ndist/\n.env\n',
    'README.md': `# ${name}\n\nRun \`npm install\` then \`npm run dev\`.\n`,
  };
};

const forwardAuthCallback = (urlString: string) => {
  console.log('[Main Process] forwardAuthCallback called with:', urlString);
  try {
    const url = new URL(urlString);
    if (url.protocol !== `${desktopScheme}:` || url.hostname !== 'auth' || url.pathname !== '/callback') {
      console.log('[Main Process] URL is not an auth callback. Ignoring.');
      return;
    }
    const ticket = url.searchParams.get('ticket');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const refresh = url.searchParams.get('refresh');
    console.log('[Main Process] Extracted ticket, state, error, refresh:', { ticket, state, error, refresh: !!refresh });
    
    if (error) {
      pendingAuthCallback = { ticket: '', state: '', error } as any;
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('auth:callback', pendingAuthCallback);
        pendingAuthCallback = null;
      }
      return;
    }
    
    if (!ticket || !state) return;
    pendingAuthCallback = { ticket, state, refresh_token: refresh } as any;
    if (mainWindow) {
      console.log('[Main Process] mainWindow exists, waking up and sending auth:callback IPC');
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('auth:callback', pendingAuthCallback);
      pendingAuthCallback = null;
    } else {
      console.log('[Main Process] mainWindow does not exist yet. Saved as pending.');
    }
  } catch (err) {
    console.error('[Main Process] Error parsing deep link:', err);
  }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1000,
    minHeight: 680,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#141414',
      symbolColor: '#ffffff',
      height: 32,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('[Main Process] did-finish-load triggered');
    // We no longer blindly send the callback here because React might not be mounted yet!
    // Instead, React will pull it using `auth:checkPending` when it is ready.
  });

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173');
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

const setupProtocolHandler = () => {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(desktopScheme, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(desktopScheme);
  }
};

if (!app.requestSingleInstanceLock()) {
  console.log('[Main Process] Second instance detected. Quitting.');
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    console.log('[Main Process] second-instance event fired with args:', commandLine);
    const deepLink = commandLine.find((argument) => argument.startsWith(`${desktopScheme}://`));
    if (deepLink) forwardAuthCallback(deepLink);
  });
}

app.on('open-url', (event, url) => {
  console.log('[Main Process] open-url event fired with:', url);
  event.preventDefault();
  forwardAuthCallback(url);
});

app.whenReady().then(() => {
  setupProtocolHandler();
  createWindow();
  
  // Start the Extension Host
  extensionHostManager.start();

  console.log('[Main Process] App ready. Checking process.argv for initial deep link:', process.argv);
  const launchLink = process.argv.find((argument) => argument.startsWith(`${desktopScheme}://`));
  if (launchLink) forwardAuthCallback(launchLink);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  for (const id of ptyProcesses.keys()) {
    stopTerminal(id);
  }
  extensionHostManager.stop();
});

ipcMain.handle('window:control', (event, action: 'minimize' | 'maximize' | 'close') => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;
  if (action === 'minimize') window.minimize();
  if (action === 'maximize') {
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  }
  if (action === 'close') window.close();
});

ipcMain.handle('window:setTheme', (event, theme: string) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  let color = '#141414';
  let symbolColor = '#ffffff';

  switch (theme) {
    case 'light':
      color = '#f9fafb';
      symbolColor = '#111111';
      break;
    case 'abyss':
      color = '#000c18';
      symbolColor = '#6688cc';
      break;
    case 'tomorrow-night-blue':
      color = '#002451';
      symbolColor = '#ffffff';
      break;
    case 'hc-black':
      color = '#000000';
      symbolColor = '#ffffff';
      break;
    case 'hc-light':
      color = '#ffffff';
      symbolColor = '#000000';
      break;
    case 'dark':
    default:
      color = '#141414';
      symbolColor = '#ffffff';
      break;
  }

  window.setTitleBarOverlay({ color, symbolColor });
});

let workspaceWatcher: fs.FSWatcher | null = null;

const startWorkspaceWatcher = (rootPath: string) => {
  if (workspaceWatcher) {
    workspaceWatcher.close();
    workspaceWatcher = null;
  }
  try {
    workspaceWatcher = fs.watch(rootPath, { recursive: true }, (eventType, filename) => {
      if (filename && mainWindow) {
        // Debounce or just emit raw, let frontend handle it
        mainWindow.webContents.send('workspace:fileChanged', { eventType, filename, fullPath: path.join(rootPath, filename) });
      }
    });
  } catch (err) {
    console.error('[Main Process] Failed to start workspace watcher:', err);
  }
};

ipcMain.handle('workspace:openFolder', async () => {
  const { canceled, filePaths } = await (mainWindow
    ? dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
    : dialog.showOpenDialog({ properties: ['openDirectory'] }));
  if (canceled || !filePaths[0]) return null;
  workspaceRoot = path.resolve(filePaths[0]);
  startWorkspaceWatcher(workspaceRoot);
  // Do not kill all terminals on workspace change for now.
  return workspaceRoot;
});

ipcMain.handle('workspace:setWorkspace', async (_event, rootPath: string) => {
  if (!rootPath) return { ok: false };
  workspaceRoot = path.resolve(rootPath);
  startWorkspaceWatcher(workspaceRoot);
  return { ok: true };
});

ipcMain.handle('workspace:chooseFolder', async () => {
  const { canceled, filePaths } = await (mainWindow
    ? dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] })
    : dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] }));
  return canceled || !filePaths[0] ? null : path.resolve(filePaths[0]);
});

ipcMain.handle('workspace:readDirectory', async (_event, directoryPath: string) => {
  if (!isInsideWorkspace(directoryPath)) throw new Error('Directory is outside the active workspace.');
  return fs.readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => !ignoredDirectoryNames.has(entry.name))
    .map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(directoryPath, entry.name),
    }))
    .sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name));
});

ipcMain.handle('workspace:readFile', async (_event, filePath: string) => {
  if (!isInsideWorkspace(filePath)) throw new Error('File is outside the active workspace.');
  return fs.promises.readFile(filePath, 'utf-8');
});

ipcMain.handle('workspace:writeFile', async (_event, filePath: string, content: string) => {
  if (!isInsideWorkspace(filePath)) throw new Error('File is outside the active workspace.');
  await fs.promises.writeFile(filePath, content, 'utf-8');
  return { ok: true };
});

ipcMain.handle('workspace:createFile', async (_event, parentPath: string, name: string, content = '') => {
  if (!isInsideWorkspace(parentPath)) throw new Error('Directory is outside the active workspace.');
  const cleanedName = name.trim();
  if (!cleanedName || cleanedName.includes('/') || cleanedName.includes('\\') || cleanedName === '.' || cleanedName === '..') {
    throw new Error('Enter a valid file name.');
  }
  const targetPath = path.join(parentPath, cleanedName);
  if (!isInsideWorkspace(targetPath)) throw new Error('File is outside the active workspace.');
  await fs.promises.writeFile(targetPath, content, { encoding: 'utf-8', flag: 'wx' });
  return targetPath;
});

ipcMain.handle('workspace:createFolder', async (_event, parentPath: string, name: string) => {
  if (!isInsideWorkspace(parentPath)) throw new Error('Directory is outside the active workspace.');
  const cleanedName = name.trim();
  if (!cleanedName || cleanedName.includes('/') || cleanedName.includes('\\') || cleanedName === '.' || cleanedName === '..') {
    throw new Error('Enter a valid folder name.');
  }
  const targetPath = path.join(parentPath, cleanedName);
  if (!isInsideWorkspace(targetPath)) throw new Error('Folder is outside the active workspace.');
  await fs.promises.mkdir(targetPath);
  return targetPath;
});

ipcMain.handle('workspace:rename', async (_event, oldPath: string, newName: string) => {
  if (!isInsideWorkspace(oldPath)) throw new Error('File is outside the active workspace.');
  const cleanedName = newName.trim();
  if (!cleanedName || cleanedName.includes('/') || cleanedName.includes('\\') || cleanedName === '.' || cleanedName === '..') {
    throw new Error('Enter a valid name.');
  }
  const parentPath = path.dirname(oldPath);
  const newPath = path.join(parentPath, cleanedName);
  if (!isInsideWorkspace(newPath)) throw new Error('Destination is outside the active workspace.');
  await fs.promises.rename(oldPath, newPath);
  return newPath;
});

ipcMain.handle('workspace:delete', async (_event, targetPath: string) => {
  if (!isInsideWorkspace(targetPath)) throw new Error('File is outside the active workspace.');
  await fs.promises.rm(targetPath, { recursive: true, force: true });
  return { ok: true };
});

ipcMain.handle('workspace:duplicate', async (_event, targetPath: string) => {
  if (!isInsideWorkspace(targetPath)) throw new Error('File is outside the active workspace.');
  
  const ext = path.extname(targetPath);
  const base = path.basename(targetPath, ext);
  const dir = path.dirname(targetPath);
  
  let newName = `${base} copy${ext}`;
  let newPath = path.join(dir, newName);
  let counter = 1;
  
  while (fs.existsSync(newPath)) {
    newName = `${base} copy ${counter}${ext}`;
    newPath = path.join(dir, newName);
    counter++;
  }
  
  const stat = await fs.promises.stat(targetPath);
  if (stat.isDirectory()) {
    await fs.promises.cp(targetPath, newPath, { recursive: true });
  } else {
    await fs.promises.copyFile(targetPath, newPath);
  }
  
  return newPath;
});

ipcMain.handle('workspace:reveal', async (_event, targetPath: string) => {
  if (!isInsideWorkspace(targetPath)) throw new Error('File is outside the active workspace.');
  shell.showItemInFolder(targetPath);
  return { ok: true };
});

ipcMain.handle('workspace:search', async (_event, query: string) => {
  if (!workspaceRoot) return [];
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  const matches: Array<{ path: string; line: number; preview: string }> = [];
  const visit = async (directoryPath: string): Promise<void> => {
    if (matches.length >= 200) return;
    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      if (matches.length >= 200) break;
      if (ignoredDirectoryNames.has(entry.name)) continue;
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!entry.isFile()) continue;
      try {
        const stat = await fs.promises.stat(entryPath);
        if (stat.size > 1_000_000) continue;
        const contents = await fs.promises.readFile(entryPath, 'utf-8');
        contents.split(/\r?\n/).forEach((line, index) => {
          if (matches.length < 200 && line.toLowerCase().includes(normalizedQuery)) {
            matches.push({ path: entryPath, line: index + 1, preview: line.trim().slice(0, 180) });
          }
        });
      } catch {
        // Ignore files that cannot be decoded as text.
      }
    }
  };
  await visit(workspaceRoot);
  return matches;
});

ipcMain.handle('workspace:createProject', async (_event, parentDirectory: string, name: string, template: string) => {
  const cleanedName = name.trim();
  if (!cleanedName || /[\\/:*?"<>|]/.test(cleanedName) || cleanedName === '.' || cleanedName === '..') {
    throw new Error('Enter a valid project name.');
  }
  const projectRoot = path.join(parentDirectory, cleanedName);
  if (fs.existsSync(projectRoot)) throw new Error('A folder with that name already exists.');
  await fs.promises.mkdir(projectRoot, { recursive: true });
  const files = makeProjectFiles(template, cleanedName);
  await Promise.all(Object.entries(files).map(async ([relativePath, contents]) => {
    const targetPath = path.join(projectRoot, relativePath);
    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, contents, 'utf-8');
  }));
  workspaceRoot = projectRoot;
  startWorkspaceWatcher(workspaceRoot);
  return projectRoot;
});

ipcMain.handle('workspace:cloneRepository', async (_event, repositoryUrl: string, parentDirectory: string, name: string) => {
  const cleanedName = name.trim();
  if (!/^https?:\/\/|^git@/.test(repositoryUrl.trim())) throw new Error('Enter a valid HTTPS or SSH repository URL.');
  if (!cleanedName || /[\\/:*?"<>|]/.test(cleanedName)) throw new Error('Enter a valid folder name.');
  const projectRoot = path.join(parentDirectory, cleanedName);
  if (fs.existsSync(projectRoot)) throw new Error('A folder with that name already exists.');
  await execFileAsync('git', ['clone', repositoryUrl.trim(), projectRoot], { windowsHide: true });
  workspaceRoot = projectRoot;
  startWorkspaceWatcher(workspaceRoot);
  return projectRoot;
});

ipcMain.handle('git:status', async () => {
  try {
    const { stdout } = await runGit(['status', '--porcelain=v1', '--branch']);
    return stdout;
  } catch {
    return null; // Not a git repo or no workspace open
  }
});

ipcMain.handle('git:init', async () => {
  const { stdout, stderr } = await runGit(['init']);
  return stdout || stderr || 'Initialized empty Git repository.';
});

ipcMain.handle('ai:getConnection', (): PublicAIConnection => publicAIConnection(readAIConnection()));

ipcMain.handle('ai:saveConnection', (_event, payload: { provider: 'novadesk' | 'openai-compatible'; baseUrl?: string; model?: string; apiKey?: string }) => {
  const previous = readAIConnection();
  const provider = payload.provider === 'openai-compatible' ? 'openai-compatible' : 'novadesk';
  const baseUrl = payload.baseUrl?.trim() ? normalizeAIBaseUrl(payload.baseUrl) : '';
  const model = payload.model?.trim() ?? '';
  if (provider === 'openai-compatible' && (!baseUrl || !model)) throw new Error('AI service URL and model are required.');
  let encryptedApiKey = previous.encryptedApiKey;
  if (payload.apiKey?.trim()) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Your operating system key store is unavailable, so NovaDesk cannot safely save an AI key.');
    encryptedApiKey = safeStorage.encryptString(payload.apiKey.trim()).toString('base64');
  }
  const connection: AIConnection = { provider, baseUrl, model, encryptedApiKey: provider === 'openai-compatible' ? encryptedApiKey : undefined };
  if (provider === 'openai-compatible' && !connection.encryptedApiKey) throw new Error('Enter an API key for the selected AI service.');
  fs.writeFileSync(aiConnectionPath(), JSON.stringify(connection), 'utf-8');
  return publicAIConnection(connection);
});

ipcMain.handle('ai:clearConnection', () => {
  try { fs.unlinkSync(aiConnectionPath()); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  return publicAIConnection(readAIConnection());
});

ipcMain.handle('ai:testConnection', async () => {
  const connection = readAIConnection();
  if (connection.provider !== 'openai-compatible') throw new Error('Select an OpenAI-compatible AI service first.');
  const apiKey = getAPIKey(connection);
  const response = await fetch(`${normalizeAIBaseUrl(connection.baseUrl)}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string }; message?: string };
    throw new Error(body.error?.message ?? body.message ?? `AI service returned ${response.status}.`);
  }
  return { ok: true, message: `Connected to ${connection.baseUrl}.` };
});

ipcMain.handle('ai:chat', async (_event, payload: { messages: Array<{ role: 'user' | 'model'; content: string }>; context?: { activeFile?: string; activeFileContent?: string } }) => {
  const connection = readAIConnection();
  if (connection.provider !== 'openai-compatible') throw new Error('No direct AI service is configured.');
  const apiKey = getAPIKey(connection);
  const contextMessage = payload.context?.activeFile
    ? `You are NovaDesk, a practical coding assistant. The active file is ${payload.context.activeFile}.\n\n${payload.context.activeFileContent ? `Active file contents:\n${payload.context.activeFileContent.slice(0, 30000)}` : ''}`
    : 'You are NovaDesk, a practical coding assistant. Help the user build and understand software.';
  const messages = [
    { role: 'system', content: contextMessage },
    ...payload.messages.slice(-14).map((message) => ({ role: message.role === 'model' ? 'assistant' : 'user', content: message.content })),
  ];
  const response = await fetch(`${normalizeAIBaseUrl(connection.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: connection.model, messages, stream: false }),
  });
  const body = await response.json().catch(() => ({})) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string }; message?: string };
  if (!response.ok) throw new Error(body.error?.message ?? body.message ?? `AI service returned ${response.status}.`);
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error('The AI service returned an empty response.');
  return { content, model: connection.model };
});

ipcMain.on('terminal:subscribe', (event) => {
  terminalSubscribers.add(event.sender);
  event.sender.once('destroyed', () => terminalSubscribers.delete(event.sender));
});

ipcMain.handle('terminal:create', (_event, cwd?: string) => {
  return createTerminal(cwd);
});

ipcMain.handle('terminal:kill', (_event, id: string) => {
  stopTerminal(id);
});

ipcMain.on('terminal:write', (_event, id: string, data: string) => {
  ptyProcesses.get(id)?.write(data);
});

ipcMain.on('terminal:resize', (_event, id: string, cols: number, rows: number) => {
  if (cols > 0 && rows > 0) ptyProcesses.get(id)?.resize(cols, rows);
});

// Stubs for future Task/Process architecture
ipcMain.handle('tasks:spawn', (_event, _command: string) => {
  // Stub for Phase 5 architecture requirement
  return randomUUID();
});

ipcMain.handle('tasks:kill', (_event, _taskId: string) => {
  // Stub for Phase 5 architecture requirement
});

ipcMain.handle('auth:startGoogleLogin', async () => {
  console.log('[Main Process] Starting Google Login...');
  const state = randomBytes(32).toString('base64url');
  const url = new URL('/api/auth/google/start', apiOrigin);
  url.searchParams.set('state', state);
  await shell.openExternal(url.toString());
  return state;
});

ipcMain.handle('auth:checkPending', () => {
  console.log('[Main Process] React requested pending auth callback. Current pending:', pendingAuthCallback);
  const payload = pendingAuthCallback;
  pendingAuthCallback = null; // Clear it after sending
  return payload;
});
const getTokensPath = () => path.join(app.getPath('userData'), 'auth_tokens.json');

ipcMain.handle('auth:saveTokens', (_event, tokens: { access_token: string; refresh_token: string }) => {
  if (!safeStorage.isEncryptionAvailable()) {
    console.error('safeStorage is not available. Saving unencrypted (not recommended).');
    fs.writeFileSync(getTokensPath(), JSON.stringify(tokens), 'utf-8');
    return;
  }
  
  const data = JSON.stringify(tokens);
  const encrypted = safeStorage.encryptString(data);
  fs.writeFileSync(getTokensPath(), encrypted);
});

ipcMain.handle('auth:getTokens', () => {
  try {
    const data = fs.readFileSync(getTokensPath());
    if (safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(data);
      return JSON.parse(decrypted);
    } else {
      return JSON.parse(data.toString('utf-8'));
    }
  } catch {
    return null;
  }
});

ipcMain.handle('auth:clearTokens', () => {
  try {
    fs.unlinkSync(getTokensPath());
  } catch {
    // Ignore if not exists
  }
});

const getApiConfigPath = () => path.join(app.getPath('userData'), 'api_config.json');

ipcMain.handle('api:saveConfig', (_event, config: { baseUrl: string }) => {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('safeStorage is not available. Saving API config unencrypted.');
    fs.writeFileSync(getApiConfigPath(), JSON.stringify(config), 'utf-8');
    return;
  }
  
  const data = JSON.stringify(config);
  const encrypted = safeStorage.encryptString(data);
  fs.writeFileSync(getApiConfigPath(), encrypted);
});

ipcMain.handle('api:getConfig', () => {
  try {
    const data = fs.readFileSync(getApiConfigPath());
    if (safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(data);
      return JSON.parse(decrypted);
    } else {
      return JSON.parse(data.toString('utf-8'));
    }
  } catch {
    return null;
  }
});

// Extension Marketplace IPCs
ipcMain.handle('extensions:search', async (_event, query: string, sortBy?: string, sortOrder?: string, offset?: number) => {
  return OpenVSXClient.search(query, sortBy, sortOrder, offset);
});

ipcMain.handle('extensions:install', async (_event, namespace: string, name: string) => {
  await VSIXInstaller.installFromOpenVSX(namespace, name);
});

ipcMain.handle('extensions:uninstall', async (_event, id: string) => {
  await VSIXInstaller.uninstall(id);
});

ipcMain.handle('extensions:getInstalled', () => {
  return extensionRegistry.getInstalled();
});

ipcMain.handle('extensions:toggle', (_event, id: string, enabled: boolean) => {
  extensionRegistry.toggleExtension(id, enabled);
});

