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
    id: 'file.newTextFile',
    title: 'New Text File',
    execute: () => console.log('file.newTextFile executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.newFile',
    title: 'New File...',
    execute: () => console.log('file.newFile executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.newWindow',
    title: 'New Window',
    execute: () => {
      if (window.electronAPI) window.electronAPI.windowControl('newWindow'); // assuming such exists, or stub
    }
  });

  CommandRegistry.registerCommand({
    id: 'file.openFile',
    title: 'Open File...',
    execute: () => console.log('file.openFile executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.openFolder',
    title: 'Open Folder...',
    execute: async () => {
      if (window.electronAPI) {
        const folder = await window.electronAPI.openFolder();
        if (folder) {
          window.dispatchEvent(new CustomEvent('ide:openWorkspace', { detail: folder }));
        }
      }
    }
  });

  CommandRegistry.registerCommand({
    id: 'file.openWorkspaceFromFile',
    title: 'Open Workspace from File...',
    execute: () => console.log('file.openWorkspaceFromFile executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.addFolderToWorkspace',
    title: 'Add Folder to Workspace...',
    execute: () => console.log('file.addFolderToWorkspace executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.saveWorkspaceAs',
    title: 'Save Workspace As...',
    execute: () => console.log('file.saveWorkspaceAs executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.duplicateWorkspace',
    title: 'Duplicate Workspace',
    execute: () => console.log('file.duplicateWorkspace executed')
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
    id: 'file.saveAs',
    title: 'Save As...',
    when: 'hasActiveEditor',
    execute: () => console.log('file.saveAs executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.saveAll',
    title: 'Save All',
    execute: () => console.log('file.saveAll executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.autoSave',
    title: 'Auto Save',
    execute: () => console.log('file.autoSave executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.revertFile',
    title: 'Revert File',
    when: 'hasActiveEditor',
    execute: () => console.log('file.revertFile executed')
  });

  CommandRegistry.registerCommand({
    id: 'file.closeEditor',
    title: 'Close Editor',
    when: 'hasActiveEditor',
    execute: () => console.log('file.closeEditor executed') // hook up to EditorContext later
  });

  CommandRegistry.registerCommand({
    id: 'file.closeFolder',
    title: 'Close Workspace',
    when: 'isWorkspaceOpen',
    execute: () => {
      window.dispatchEvent(new CustomEvent('ide:closeWorkspace'));
    }
  });

  CommandRegistry.registerCommand({
    id: 'file.closeWindow',
    title: 'Close Window',
    execute: () => {
      if (window.electronAPI) window.electronAPI.windowControl('close');
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
  KeybindingManager.register({ commandId: 'file.newTextFile', key: 'Ctrl+N' });
  KeybindingManager.register({ commandId: 'file.newFile', key: 'Ctrl+Alt+Win+N' });
  KeybindingManager.register({ commandId: 'file.newWindow', key: 'Ctrl+Shift+N' });
  KeybindingManager.register({ commandId: 'file.openFile', key: 'Ctrl+O' });
  KeybindingManager.register({ commandId: 'file.openFolder', key: 'Ctrl+K Ctrl+O' });
  KeybindingManager.register({ commandId: 'file.save', key: 'Ctrl+S' });
  KeybindingManager.register({ commandId: 'file.saveAs', key: 'Ctrl+Shift+S' });
  KeybindingManager.register({ commandId: 'file.saveAll', key: 'Ctrl+K S' });
  KeybindingManager.register({ commandId: 'file.closeEditor', key: 'Ctrl+F4' });
  KeybindingManager.register({ commandId: 'file.closeFolder', key: 'Ctrl+K F' });
  KeybindingManager.register({ commandId: 'file.closeWindow', key: 'Alt+F4' });
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
    { id: 'file.newTextFile', type: 'command', commandId: 'file.newTextFile' },
    { id: 'file.newFile', type: 'command', commandId: 'file.newFile' },
    { id: 'file.newWindow', type: 'command', commandId: 'file.newWindow' },
    { id: 'file.newWindowProfile', type: 'submenu', label: 'New Window with Profile', submenuId: 'menubar/file/newProfile' },
    { id: 'sep1', type: 'separator' },
    { id: 'file.openFile', type: 'command', commandId: 'file.openFile' },
    { id: 'file.openFolder', type: 'command', commandId: 'file.openFolder' },
    { id: 'file.openWorkspaceFromFile', type: 'command', commandId: 'file.openWorkspaceFromFile' },
    { id: 'file.openRecent', type: 'submenu', label: 'Open Recent', submenuId: 'menubar/file/openRecent' },
    { id: 'sep2', type: 'separator' },
    { id: 'file.addFolderToWorkspace', type: 'command', commandId: 'file.addFolderToWorkspace' },
    { id: 'file.saveWorkspaceAs', type: 'command', commandId: 'file.saveWorkspaceAs' },
    { id: 'file.duplicateWorkspace', type: 'command', commandId: 'file.duplicateWorkspace' },
    { id: 'sep3', type: 'separator' },
    { id: 'file.save', type: 'command', commandId: 'file.save' },
    { id: 'file.saveAs', type: 'command', commandId: 'file.saveAs' },
    { id: 'file.saveAll', type: 'command', commandId: 'file.saveAll' },
    { id: 'sep4', type: 'separator' },
    { id: 'file.share', type: 'submenu', label: 'Share', submenuId: 'menubar/file/share' },
    { id: 'sep5', type: 'separator' },
    { id: 'file.autoSave', type: 'command', commandId: 'file.autoSave' },
    { id: 'file.preferences', type: 'submenu', label: 'Preferences', submenuId: 'menubar/file/preferences' },
    { id: 'sep6', type: 'separator' },
    { id: 'file.revertFile', type: 'command', commandId: 'file.revertFile' },
    { id: 'file.closeEditor', type: 'command', commandId: 'file.closeEditor' },
    { id: 'file.closeFolder', type: 'command', commandId: 'file.closeFolder' },
    { id: 'file.closeWindow', type: 'command', commandId: 'file.closeWindow' },
    { id: 'sep7', type: 'separator' },
    { id: 'file.exit', type: 'command', commandId: 'file.exit' },
  ]);

  // Register File Submenus
  MenuRegistry.registerMenu('menubar/file/newProfile', [
    { id: 'profile.default', type: 'command', commandId: 'stub', label: 'Default' },
  ]);
  MenuRegistry.registerMenu('menubar/file/openRecent', [
    { id: 'recent.1', type: 'command', commandId: 'stub', label: 'C:\\Projects\\NovaDesk' },
    { id: 'recent.clear', type: 'command', commandId: 'stub', label: 'Clear Recently Opened' },
  ]);
  MenuRegistry.registerMenu('menubar/file/share', [
    { id: 'share.export', type: 'command', commandId: 'stub', label: 'Export...' },
  ]);
  MenuRegistry.registerMenu('menubar/file/preferences', [
    { id: 'pref.settings', type: 'command', commandId: 'stub', label: 'Settings' },
    { id: 'pref.theme', type: 'command', commandId: 'stub', label: 'Theme' },
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
