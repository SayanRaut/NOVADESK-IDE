import { CommandRegistry } from './CommandRegistry';
import { MenuRegistry, type IMenuItem } from './MenuRegistry';
import { KeybindingManager } from './KeybindingManager';

export function initializeCommands() {
  console.log('[CommandRegistry] Initializing IDE Commands...');

  // ==========================================
  // 1. REGISTER CORE COMMANDS
  // ==========================================

  // File Commands
  CommandRegistry.registerCommand({
    id: 'file.newFile',
    title: 'New File',
    execute: async () => {
      // In real implementation, this triggers a dialog or opens a new untitled editor
      console.log('file.newFile executed');
    }
  });

  CommandRegistry.registerCommand({
    id: 'file.openFolder',
    title: 'Open Folder...',
    execute: async () => {
      if (window.electronAPI) {
        const folder = await window.electronAPI.openFolder();
        // Since we don't have direct access to EditorContext here easily,
        // we might need an event emitter or pass dependencies. 
        // For phase 1, we can trigger a custom event that the EditorContext listens to
        if (folder) {
          window.dispatchEvent(new CustomEvent('ide:openWorkspace', { detail: folder }));
        }
      }
    }
  });

  CommandRegistry.registerCommand({
    id: 'file.save',
    title: 'Save',
    when: 'hasActiveEditor',
    execute: () => {
      window.dispatchEvent(new CustomEvent('ide:saveActiveFile'));
    }
  });

  CommandRegistry.registerCommand({
    id: 'file.closeFolder',
    title: 'Close Folder',
    when: 'isWorkspaceOpen',
    execute: () => {
      window.dispatchEvent(new CustomEvent('ide:closeWorkspace'));
    }
  });

  CommandRegistry.registerCommand({
    id: 'file.exit',
    title: 'Exit',
    execute: () => {
      if (window.electronAPI) window.electronAPI.windowControl('close');
    }
  });

  // Edit Commands (Monaco handles most natively, these are logical triggers)
  CommandRegistry.registerCommand({
    id: 'edit.undo',
    title: 'Undo',
    when: 'editorTextFocus',
    execute: () => {
      document.execCommand('undo'); // fallback if editor intercepts
    }
  });

  CommandRegistry.registerCommand({
    id: 'edit.copy',
    title: 'Copy',
    when: 'hasSelection',
    execute: () => document.execCommand('copy')
  });

  // View Commands
  CommandRegistry.registerCommand({
    id: 'view.toggleSidebar',
    title: 'Toggle Side Bar',
    execute: () => window.dispatchEvent(new CustomEvent('ide:toggleSidebar'))
  });
  
  CommandRegistry.registerCommand({
    id: 'view.toggleTerminal',
    title: 'Toggle Terminal',
    execute: () => window.dispatchEvent(new CustomEvent('ide:toggleTerminal'))
  });

  // AI Commands
  CommandRegistry.registerCommand({
    id: 'ai.chat.new',
    title: 'New AI Chat',
    execute: () => window.dispatchEvent(new CustomEvent('ide:newAIChat'))
  });

  CommandRegistry.registerCommand({
    id: 'ai.explain',
    title: 'Explain Code',
    when: 'hasSelection',
    execute: () => window.dispatchEvent(new CustomEvent('ide:explainCode'))
  });


  // ==========================================
  // 2. REGISTER KEYBINDINGS
  // ==========================================
  KeybindingManager.register({ commandId: 'file.newFile', key: 'Ctrl+N' });
  KeybindingManager.register({ commandId: 'file.openFolder', key: 'Ctrl+O' });
  KeybindingManager.register({ commandId: 'file.save', key: 'Ctrl+S' });
  KeybindingManager.register({ commandId: 'file.exit', key: 'Alt+F4' });
  KeybindingManager.register({ commandId: 'edit.undo', key: 'Ctrl+Z' });
  KeybindingManager.register({ commandId: 'edit.copy', key: 'Ctrl+C' });
  KeybindingManager.register({ commandId: 'view.toggleSidebar', key: 'Ctrl+B' });
  KeybindingManager.register({ commandId: 'view.toggleTerminal', key: 'Ctrl+`' });
  KeybindingManager.register({ commandId: 'ai.chat.new', key: 'Ctrl+L' });


  // ==========================================
  // 3. REGISTER MENUS
  // ==========================================

  // File Menu
  MenuRegistry.registerMenu('menubar/file', [
    { id: 'file.newFile', type: 'command', commandId: 'file.newFile' },
    { id: 'file.newFolder', type: 'command', commandId: 'file.newFolder', label: 'New Folder' },
    { id: 'sep1', type: 'separator' },
    { id: 'file.openFolder', type: 'command', commandId: 'file.openFolder' },
    { id: 'file.openWorkspace', type: 'command', commandId: 'file.openWorkspace', label: 'Open Workspace...' },
    { id: 'sep2', type: 'separator' },
    { id: 'file.save', type: 'command', commandId: 'file.save' },
    { id: 'file.saveAll', type: 'command', commandId: 'file.saveAll', label: 'Save All' },
    { id: 'sep3', type: 'separator' },
    { id: 'file.closeFolder', type: 'command', commandId: 'file.closeFolder' },
    { id: 'sep4', type: 'separator' },
    { id: 'file.exit', type: 'command', commandId: 'file.exit' },
  ]);

  // Edit Menu
  MenuRegistry.registerMenu('menubar/edit', [
    { id: 'edit.undo', type: 'command', commandId: 'edit.undo' },
    { id: 'edit.redo', type: 'command', commandId: 'edit.redo', label: 'Redo' },
    { id: 'sep1', type: 'separator' },
    { id: 'edit.cut', type: 'command', commandId: 'edit.cut', label: 'Cut' },
    { id: 'edit.copy', type: 'command', commandId: 'edit.copy' },
    { id: 'edit.paste', type: 'command', commandId: 'edit.paste', label: 'Paste' },
  ]);

  // View Menu
  MenuRegistry.registerMenu('menubar/view', [
    { id: 'view.explorer', type: 'command', commandId: 'stub', label: 'Explorer' },
    { id: 'view.search', type: 'command', commandId: 'stub', label: 'Search' },
    { id: 'sep1', type: 'separator' },
    { id: 'view.toggleSidebar', type: 'command', commandId: 'view.toggleSidebar' },
    { id: 'view.toggleTerminal', type: 'command', commandId: 'view.toggleTerminal' },
  ]);

  // AI Menu
  MenuRegistry.registerMenu('menubar/ai', [
    { id: 'ai.chat.new', type: 'command', commandId: 'ai.chat.new' },
    { id: 'sep1', type: 'separator' },
    { id: 'ai.explain', type: 'command', commandId: 'ai.explain' },
    { id: 'ai.refactor', type: 'command', commandId: 'stub', label: 'Refactor Code' },
  ]);

  // Stub other menus
  const stubItems: IMenuItem[] = [{ id: 'stub', type: 'command', commandId: 'stub', label: 'Not implemented' }];
  CommandRegistry.registerCommand({ id: 'stub', title: 'Not implemented', execute: () => {} });

  MenuRegistry.registerMenu('menubar/selection', stubItems);
  MenuRegistry.registerMenu('menubar/go', stubItems);
  MenuRegistry.registerMenu('menubar/run', stubItems);
  MenuRegistry.registerMenu('menubar/terminal', stubItems);
  MenuRegistry.registerMenu('menubar/ai', stubItems);
  MenuRegistry.registerMenu('menubar/git', stubItems);
  MenuRegistry.registerMenu('menubar/extensions', stubItems);
  MenuRegistry.registerMenu('menubar/window', stubItems);
  MenuRegistry.registerMenu('menubar/help', stubItems);

  // Start listening to keybindings
  KeybindingManager.start();
}
