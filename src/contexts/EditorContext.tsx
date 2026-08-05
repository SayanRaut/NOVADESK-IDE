import { createContext, useCallback, useContext, useMemo, useState, useEffect, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useContextKeyService } from '../services/command/ContextKeyService';

export type FileTree = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTree[];
};

export type CursorPosition = { line: number; column: number };

export type SplitState = 'none' | 'horizontal' | 'vertical';

export type EditorGroup = {
  id: string;
  openFiles: string[];
  activeFile: string | null;
  pinnedTabs: string[];
};

type EditorContextType = {
  currentPath: string | null;
  workspaceName: string;
  recentWorkspaces: string[];
  openWorkspace: (path: string) => void;
  closeWorkspace: () => void;
  
  fileTree: FileTree[];
  setFileTree: (tree: FileTree[]) => void;
  refreshVersion: number;
  refreshWorkspace: () => void;
  
  editorGroups: EditorGroup[];
  activeGroupId: string;
  setActiveGroup: (id: string) => void;
  splitState: SplitState;
  setSplitState: (state: SplitState) => void;

  // Legacy derived properties for backwards compatibility
  activeFile: string | null;
  openFiles: string[];

  openFile: (filePath: string, groupId?: string) => void;
  closeFile: (filePath: string, groupId?: string) => void;
  closeOthers: (filePath: string, groupId?: string) => void;
  closeAll: (groupId?: string) => void;
  pinFile: (filePath: string, groupId?: string) => void;
  unpinFile: (filePath: string, groupId?: string) => void;
  reorderTabs: (groupId: string, sourceIndex: number, destIndex: number) => void;
  splitGroup: (groupId: string) => void;
  closeGroup: (groupId: string) => void;
  
  fileContents: Record<string, string>;
  setFileContents: Dispatch<SetStateAction<Record<string, string>>>;
  dirtyFiles: Set<string>;
  setFileDirty: (filePath: string, dirty: boolean) => void;
  saveActiveFile: () => Promise<void>;
  saveAllFiles: () => Promise<void>;
  
  cursorPosition: CursorPosition;
  setCursorPosition: (position: CursorPosition) => void;

  expandedFolders: Set<string>;
  toggleFolderExpanded: (path: string) => void;
  problems: Record<string, any[]>;
  setProblems: Dispatch<SetStateAction<Record<string, any[]>>>;
};

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const getName = (filePath: string) => filePath.split(/[\\/]/).filter(Boolean).at(-1) ?? 'Workspace';

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const defaultGroup: EditorGroup = { id: 'main', openFiles: [], activeFile: null, pinnedTabs: [] };

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [currentPath, setCurrentPath] = useState<string | null>(() => localStorage.getItem('novadesk:currentWorkspace') || null);
  const [recentWorkspaces, setRecentWorkspaces] = useState<string[]>(() => {
    try {
      const recent = localStorage.getItem('novadesk:recentWorkspaces');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  });
  const [fileTree, setFileTree] = useState<FileTree[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const path = localStorage.getItem('novadesk:currentWorkspace');
    if (!path) return new Set();
    try {
      const rawState = localStorage.getItem(`novadesk:workspaceState:${hashString(path)}`);
      if (rawState) return new Set(JSON.parse(rawState).expandedFolders || []);
    } catch {}
    return new Set();
  });
  
  const [editorGroups, setEditorGroups] = useState<EditorGroup[]>(() => {
    const path = localStorage.getItem('novadesk:currentWorkspace');
    if (!path) return [defaultGroup];
    try {
      const rawState = localStorage.getItem(`novadesk:workspaceState:${hashString(path)}`);
      if (rawState) {
        const groups = JSON.parse(rawState).editorGroups;
        return groups?.length ? groups : [defaultGroup];
      }
    } catch {}
    return [defaultGroup];
  });
  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    const path = localStorage.getItem('novadesk:currentWorkspace');
    if (!path) return 'main';
    try {
      const rawState = localStorage.getItem(`novadesk:workspaceState:${hashString(path)}`);
      if (rawState) {
        const groups = JSON.parse(rawState).editorGroups;
        return groups?.[0]?.id || 'main';
      }
    } catch {}
    return 'main';
  });
  const [splitState, setSplitState] = useState<SplitState>(() => {
    const path = localStorage.getItem('novadesk:currentWorkspace');
    if (!path) return 'none';
    try {
      const rawState = localStorage.getItem(`novadesk:workspaceState:${hashString(path)}`);
      if (rawState) return JSON.parse(rawState).splitState || 'none';
    } catch {}
    return 'none';
  });

  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(() => new Set());
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });
  const [problems, setProblems] = useState<Record<string, any[]>>({});

  // 1. Load initial global state
  useEffect(() => {
    try {
      if (currentPath) {
        if (window.electronAPI) {
          window.electronAPI.setWorkspace(currentPath).catch(console.error);
        }
      }
    } catch (e) {
      console.error('Failed to load initial workspace state', e);
    }
  }, []);

  // Sync state to ContextKeyService
  useEffect(() => {
    const { setContext } = useContextKeyService.getState();
    setContext('isWorkspaceOpen', currentPath !== null);
  }, [currentPath]);

  useEffect(() => {
    const { setContext } = useContextKeyService.getState();
    const activeGroup = editorGroups.find(g => g.id === activeGroupId);
    setContext('hasActiveEditor', activeGroup?.activeFile !== null && activeGroup?.activeFile !== undefined);
  }, [editorGroups, activeGroupId]);

  // 2. Persist recent workspaces
  useEffect(() => {
    localStorage.setItem('novadesk:recentWorkspaces', JSON.stringify(recentWorkspaces));
  }, [recentWorkspaces]);

  // 3. Persist current workspace identity
  useEffect(() => {
    if (currentPath) {
      localStorage.setItem('novadesk:currentWorkspace', currentPath);
    } else {
      localStorage.removeItem('novadesk:currentWorkspace');
    }
  }, [currentPath]);

  // 4. Persist active workspace internal state
  useEffect(() => {
    if (!currentPath) return;
    const stateKey = `novadesk:workspaceState:${hashString(currentPath)}`;
    const state = {
      editorGroups,
      splitState,
      expandedFolders: Array.from(expandedFolders)
    };
    localStorage.setItem(stateKey, JSON.stringify(state));
  }, [currentPath, editorGroups, splitState, expandedFolders]);

  // File Watching (Auto Reload if changed externally)
  useEffect(() => {
    if (!window.electronAPI) return;
    return window.electronAPI.onWorkspaceFileChanged(async (payload) => {
      // If we have it in contents and it's NOT dirty, auto reload it.
      if (fileContents[payload.fullPath] !== undefined && !dirtyFiles.has(payload.fullPath)) {
        try {
          const text = await window.electronAPI!.readFile(payload.fullPath);
          setFileContents(prev => ({ ...prev, [payload.fullPath]: text }));
        } catch {
          // File might have been deleted, ignore for now
        }
      }
    });
  }, [fileContents, dirtyFiles]);

  // Auto Save Loop (debounce 1s)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (dirtyFiles.size === 0 || !window.electronAPI) return;
      const toSave = Array.from(dirtyFiles);
      for (const path of toSave) {
        try {
          await window.electronAPI.writeFile(path, fileContents[path] ?? '');
          setFileDirty(path, false);
        } catch (e) {
          console.error("Auto save failed for", path, e);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [dirtyFiles, fileContents]);



  const loadWorkspaceState = (path: string) => {
    try {
      const stateKey = `novadesk:workspaceState:${hashString(path)}`;
      const rawState = localStorage.getItem(stateKey);
      if (rawState) {
        const state = JSON.parse(rawState);
        setEditorGroups(state.editorGroups?.length ? state.editorGroups : [defaultGroup]);
        setSplitState(state.splitState || 'none');
        setExpandedFolders(new Set(state.expandedFolders || []));
        setActiveGroupId(state.editorGroups?.[0]?.id || 'main');
      } else {
        setEditorGroups([defaultGroup]);
        setSplitState('none');
        setExpandedFolders(new Set());
        setActiveGroupId('main');
      }
    } catch {
      setEditorGroups([defaultGroup]);
      setSplitState('none');
      setExpandedFolders(new Set());
      setActiveGroupId('main');
    }
  };

  const openWorkspace = useCallback((workspacePath: string) => {
    setCurrentPath(workspacePath);
    if (window.electronAPI) {
      window.electronAPI.setWorkspace(workspacePath).catch(console.error);
    }
    setFileTree([]);
    setFileContents({});
    setDirtyFiles(new Set());
    
    setRecentWorkspaces(prev => {
      const next = [workspacePath, ...prev.filter(p => p !== workspacePath)].slice(0, 10);
      return next;
    });

    loadWorkspaceState(workspacePath);
    setRefreshVersion((version) => version + 1);
  }, []);

  const closeWorkspace = useCallback(() => {
    setCurrentPath(null);
    setFileTree([]);
    setEditorGroups([defaultGroup]);
    setSplitState('none');
    setExpandedFolders(new Set());
    setFileContents({});
    setDirtyFiles(new Set());
  }, []);

  const refreshWorkspace = useCallback(() => setRefreshVersion((version) => version + 1), []);

  const setActiveGroup = useCallback((id: string) => {
    setActiveGroupId(id);
  }, []);

  const updateGroup = useCallback((id: string, updater: (group: EditorGroup) => EditorGroup) => {
    setEditorGroups(groups => groups.map(g => g.id === id ? updater(g) : g));
  }, []);

  const openFile = useCallback((filePath: string, groupId: string = activeGroupId) => {
    updateGroup(groupId, g => {
      const openFiles = g.openFiles.includes(filePath) ? g.openFiles : [...g.openFiles, filePath];
      return { ...g, openFiles, activeFile: filePath };
    });
  }, [activeGroupId, updateGroup]);

  const closeFile = useCallback((filePath: string, groupId: string = activeGroupId) => {
    setEditorGroups(groups => {
      const nextGroups = groups.map(g => {
        if (g.id !== groupId) return g;
        const nextFiles = g.openFiles.filter(f => f !== filePath);
        const pinned = g.pinnedTabs.filter(f => f !== filePath);
        const nextActive = g.activeFile === filePath ? (nextFiles.at(-1) ?? null) : g.activeFile;
        return { ...g, openFiles: nextFiles, pinnedTabs: pinned, activeFile: nextActive };
      });
      
      const stillOpen = nextGroups.some(g => g.openFiles.includes(filePath));
      if (!stillOpen) {
        setFileContents(prev => {
          const copy = { ...prev };
          delete copy[filePath];
          return copy;
        });
      }
      return nextGroups;
    });
  }, [activeGroupId]);

  const closeOthers = useCallback((filePath: string, groupId: string = activeGroupId) => {
    updateGroup(groupId, g => ({
      ...g,
      openFiles: g.pinnedTabs.includes(filePath) ? [...g.pinnedTabs] : [...g.pinnedTabs, filePath].filter((v, i, a) => a.indexOf(v) === i),
      activeFile: filePath
    }));
  }, [activeGroupId, updateGroup]);

  const closeAll = useCallback((groupId: string = activeGroupId) => {
    updateGroup(groupId, g => ({
      ...g,
      openFiles: [...g.pinnedTabs],
      activeFile: g.pinnedTabs.length > 0 ? g.pinnedTabs[0] : null
    }));
  }, [activeGroupId, updateGroup]);

  const splitGroup = useCallback((groupId: string) => {
    setEditorGroups(groups => {
      const sourceGroup = groups.find(g => g.id === groupId);
      if (!sourceGroup) return groups;
      const newId = `group_${Date.now()}`;
      const newGroup: EditorGroup = {
        id: newId,
        openFiles: [...sourceGroup.openFiles],
        activeFile: sourceGroup.activeFile,
        pinnedTabs: [...sourceGroup.pinnedTabs]
      };
      const idx = groups.findIndex(g => g.id === groupId);
      const next = [...groups];
      next.splice(idx + 1, 0, newGroup);
      setActiveGroupId(newId);
      if (splitState === 'none') setSplitState('horizontal');
      return next;
    });
  }, [splitState]);

  const closeGroup = useCallback((groupId: string) => {
    setEditorGroups(groups => {
      if (groups.length <= 1) return groups;
      const next = groups.filter(g => g.id !== groupId);
      if (activeGroupId === groupId) setActiveGroupId(next[0].id);
      if (next.length === 1) setSplitState('none');
      return next;
    });
  }, [activeGroupId]);

  const pinFile = useCallback((filePath: string, groupId: string = activeGroupId) => {
    updateGroup(groupId, g => ({
      ...g,
      pinnedTabs: Array.from(new Set([...g.pinnedTabs, filePath]))
    }));
  }, [activeGroupId, updateGroup]);

  const unpinFile = useCallback((filePath: string, groupId: string = activeGroupId) => {
    updateGroup(groupId, g => ({
      ...g,
      pinnedTabs: g.pinnedTabs.filter(f => f !== filePath)
    }));
  }, [activeGroupId, updateGroup]);

  const reorderTabs = useCallback((groupId: string, sourceIndex: number, destIndex: number) => {
    updateGroup(groupId, g => {
      const next = [...g.openFiles];
      const [removed] = next.splice(sourceIndex, 1);
      next.splice(destIndex, 0, removed);
      return { ...g, openFiles: next };
    });
  }, [updateGroup]);

  const setFileDirty = useCallback((filePath: string, dirty: boolean) => {
    setDirtyFiles((files) => {
      const next = new Set(files);
      if (dirty) next.add(filePath);
      else next.delete(filePath);
      return next;
    });
  }, []);

  const saveActiveFile = useCallback(async () => {
    const activeGroup = editorGroups.find(g => g.id === activeGroupId);
    if (!activeGroup?.activeFile || !window.electronAPI) return;
    const file = activeGroup.activeFile;
    await window.electronAPI.writeFile(file, fileContents[file] ?? '');
    setFileDirty(file, false);
  }, [editorGroups, activeGroupId, fileContents, setFileDirty]);

  const saveAllFiles = useCallback(async () => {
    if (!window.electronAPI) return;
    for (const file of Array.from(dirtyFiles)) {
      await window.electronAPI.writeFile(file, fileContents[file] ?? '');
      setFileDirty(file, false);
    }
  }, [dirtyFiles, fileContents, setFileDirty]);

  const toggleFolderExpanded = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Command Action Listeners
  useEffect(() => {
    const handleSave = () => {
      saveActiveFile();
    };
    const handleSaveAll = () => {
      saveAllFiles();
    };
    const handleOpenWorkspace = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) openWorkspace(customEvent.detail);
    };
    const handleCloseWorkspace = () => {
      closeWorkspace();
    };
    const handleCloseActiveFile = () => {
      const activeGroup = editorGroups.find(g => g.id === activeGroupId);
      if (activeGroup?.activeFile) {
        closeFile(activeGroup.activeFile, activeGroupId);
      }
    };

    window.addEventListener('ide:saveActiveFile', handleSave);
    window.addEventListener('ide:saveAllFiles', handleSaveAll);
    window.addEventListener('ide:openWorkspace', handleOpenWorkspace);
    window.addEventListener('ide:closeWorkspace', handleCloseWorkspace);
    window.addEventListener('ide:closeActiveFile', handleCloseActiveFile);

    return () => {
      window.removeEventListener('ide:saveActiveFile', handleSave);
      window.removeEventListener('ide:saveAllFiles', handleSaveAll);
      window.removeEventListener('ide:openWorkspace', handleOpenWorkspace);
      window.removeEventListener('ide:closeWorkspace', handleCloseWorkspace);
      window.removeEventListener('ide:closeActiveFile', handleCloseActiveFile);
    };
  }, [saveActiveFile, saveAllFiles, openWorkspace, closeWorkspace, closeFile, editorGroups, activeGroupId]);

  const value = useMemo(() => {
    const activeGroup = editorGroups.find(g => g.id === activeGroupId);
    
    return {
      currentPath,
      workspaceName: currentPath ? getName(currentPath) : 'No folder open',
      recentWorkspaces,
      openWorkspace,
      closeWorkspace,
      fileTree,
      setFileTree,
      refreshVersion,
      refreshWorkspace,
      editorGroups,
      activeGroupId,
      setActiveGroup,
      splitState,
      setSplitState,
      activeFile: activeGroup?.activeFile || null,
      openFiles: activeGroup?.openFiles || [],
      openFile,
      closeFile,
      closeOthers,
      closeAll,
      pinFile,
      unpinFile,
      reorderTabs,
      splitGroup,
      closeGroup,
      fileContents,
      setFileContents,
      dirtyFiles,
      setFileDirty,
      saveActiveFile,
      saveAllFiles,
      cursorPosition,
      setCursorPosition,
      expandedFolders,
      toggleFolderExpanded,
      problems,
      setProblems
    };
  }, [
    currentPath, recentWorkspaces, openWorkspace, closeWorkspace, fileTree, refreshVersion,
    refreshWorkspace, editorGroups, activeGroupId, setActiveGroup, splitState, openFile,
    closeFile, closeOthers, closeAll, pinFile, unpinFile, reorderTabs, splitGroup, closeGroup, fileContents, dirtyFiles, setFileDirty,
    saveActiveFile, saveAllFiles, cursorPosition, expandedFolders, toggleFolderExpanded, problems
  ]);

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) throw new Error('useEditor must be used within an EditorProvider');
  return context;
};
