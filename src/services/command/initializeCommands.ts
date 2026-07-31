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
    title: 'New File...',
    execute: () => window.dispatchEvent(new CustomEvent('ide:newFile'))
  });

  // Edit Commands
  CommandRegistry.registerCommand({
    id: 'edit.undo',
    title: 'Undo',
    when: 'editorTextFocus',
    execute: () => document.execCommand('undo')
  });
  CommandRegistry.registerCommand({
    id: 'edit.redo',
    title: 'Redo',
    when: 'editorTextFocus',
    execute: () => document.execCommand('redo')
  });
  CommandRegistry.registerCommand({
    id: 'edit.cut',
    title: 'Cut',
    when: 'hasSelection',
    execute: () => document.execCommand('cut')
  });
  CommandRegistry.registerCommand({
    id: 'edit.copy',
    title: 'Copy',
    when: 'hasSelection',
    execute: () => document.execCommand('copy')
  });
  CommandRegistry.registerCommand({
    id: 'edit.paste',
    title: 'Paste',
    when: 'editorTextFocus',
    execute: () => document.execCommand('paste')
  });
  CommandRegistry.registerCommand({
    id: 'edit.selectAll',
    title: 'Select All',
    when: 'editorTextFocus',
    execute: () => document.execCommand('selectAll')
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


  CommandRegistry.registerCommand({
    id: 'go.toFile',
    title: 'Go to File',
    execute: () => window.dispatchEvent(new CustomEvent('ide:searchFiles'))
  });

  // Run Commands
  CommandRegistry.registerCommand({
    id: 'run.runCode',
    title: 'Run Code',
    when: 'hasActiveEditor',
    execute: () => window.dispatchEvent(new CustomEvent('ide:runCode'))
  });

  // ==========================================
  // 2. REGISTER KEYBINDINGS
  // ==========================================
  // Simplified Bindings
  KeybindingManager.register({ commandId: 'file.newFile', key: 'Ctrl+N' });
  KeybindingManager.register({ commandId: 'file.openFolder', key: 'Ctrl+O' });
  KeybindingManager.register({ commandId: 'file.save', key: 'Ctrl+S' });
  KeybindingManager.register({ commandId: 'file.saveAll', key: 'Ctrl+Shift+S' });
  KeybindingManager.register({ commandId: 'file.closeEditor', key: 'Ctrl+W' });
  KeybindingManager.register({ commandId: 'file.closeFolder', key: 'Ctrl+K F' });
  KeybindingManager.register({ commandId: 'file.exit', key: 'Alt+F4' });
  
  KeybindingManager.register({ commandId: 'edit.undo', key: 'Ctrl+Z' });
  KeybindingManager.register({ commandId: 'edit.redo', key: 'Ctrl+Y' });
  KeybindingManager.register({ commandId: 'edit.cut', key: 'Ctrl+X' });
  KeybindingManager.register({ commandId: 'edit.copy', key: 'Ctrl+C' });
  KeybindingManager.register({ commandId: 'edit.paste', key: 'Ctrl+V' });
  KeybindingManager.register({ commandId: 'edit.selectAll', key: 'Ctrl+A' });

  KeybindingManager.register({ commandId: 'view.toggleSidebar', key: 'Ctrl+B' });
  KeybindingManager.register({ commandId: 'view.toggleTerminal', key: 'Ctrl+`' });
  
  KeybindingManager.register({ commandId: 'go.toFile', key: 'Ctrl+P' });
  
  KeybindingManager.register({ commandId: 'ai.chat.new', key: 'Ctrl+L' });


  // ==========================================
  // 3. REGISTER MENUS
  // ==========================================

  // File Menu
  MenuRegistry.registerMenu('menubar/file', [
    { id: 'file.newFile', type: 'command', commandId: 'file.newFile', label: 'New File' },
    { id: 'sep1', type: 'separator' },
    { id: 'file.openFolder', type: 'command', commandId: 'file.openFolder', label: 'Open Folder...' },
    { id: 'sep2', type: 'separator' },
    { id: 'file.save', type: 'command', commandId: 'file.save' },
    { id: 'file.saveAll', type: 'command', commandId: 'file.saveAll' },
    { id: 'sep3', type: 'separator' },
    { id: 'file.closeEditor', type: 'command', commandId: 'file.closeEditor', label: 'Close Editor' },
    { id: 'file.closeFolder', type: 'command', commandId: 'file.closeFolder', label: 'Close Workspace' },
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

  MenuRegistry.registerMenu('menubar/selection', [
    { id: 'sel.all', type: 'command', commandId: 'edit.selectAll' }
  ]);
  MenuRegistry.registerMenu('menubar/go', [
    { id: 'go.file', type: 'command', commandId: 'go.toFile' }
  ]);
  MenuRegistry.registerMenu('menubar/run', [
    { id: 'run.code', type: 'command', commandId: 'run.runCode' }
  ]);
  MenuRegistry.registerMenu('menubar/terminal', [
    { id: 'term.toggle', type: 'command', commandId: 'view.toggleTerminal' }
  ]);
  
  MenuRegistry.registerMenu('menubar/git', stubItems);
  MenuRegistry.registerMenu('menubar/extensions', stubItems);
  MenuRegistry.registerMenu('menubar/window', stubItems);
  MenuRegistry.registerMenu('menubar/help', stubItems);

  // Start listening to keybindings
  KeybindingManager.start();
}
