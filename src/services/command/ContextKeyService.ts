import { create } from 'zustand';

// Defines the shape of our global context context keys
interface ContextState {
  isWorkspaceOpen: boolean;
  hasActiveEditor: boolean;
  editorTextFocus: boolean;
  hasSelection: boolean;
  terminalFocus: boolean;
  gitRepositoryDetected: boolean;
  aiConnected: boolean;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  
  // Methods to update state
  setContext: (key: keyof Omit<ContextState, 'setContext' | 'evaluate'>, value: boolean) => void;
  evaluate: (whenClause?: string) => boolean;
}

export const useContextKeyService = create<ContextState>((set, get) => ({
  isWorkspaceOpen: false,
  hasActiveEditor: false,
  editorTextFocus: false,
  hasSelection: false,
  terminalFocus: false,
  gitRepositoryDetected: false,
  aiConnected: false,
  isMac: navigator.userAgent.includes('Mac'),
  isWindows: navigator.userAgent.includes('Win'),
  isLinux: navigator.userAgent.includes('Linux'),

  setContext: (key, value) => set({ [key]: value }),

  // Evaluates a simple "when" clause. 
  // Supports basic logical operators: '!key', 'key1 && key2'
  evaluate: (whenClause?: string) => {
    if (!whenClause) return true;
    
    const state = get();
    
    // Split by &&
    const conditions = whenClause.split('&&').map(c => c.trim());
    
    return conditions.every(condition => {
      let isNegated = false;
      let key = condition;
      
      if (key.startsWith('!')) {
        isNegated = true;
        key = key.substring(1);
      }
      
      const value = (state as any)[key] ?? false;
      return isNegated ? !value : value;
    });
  }
}));
