import { useState } from 'react';
import { useWindowControls } from '../contexts/WindowContext';
import { useEditor } from '../contexts/EditorContext';
import { Minus, Square, X } from 'lucide-react';
import { Menu, type MenuItemProps } from './Menu';
import { cn } from '../utils/cn';

export function TitleBar() {
  const { minimize, maximize, close } = useWindowControls();
  const { currentPath, openWorkspace, closeWorkspace, saveActiveFile, workspaceName } = useEditor();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleMenuToggle = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuHover = (menuName: string) => {
    if (activeMenu && activeMenu !== menuName) {
      setActiveMenu(menuName);
    }
  };

  const closeMenu = () => setActiveMenu(null);

  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.openFolder();
      if (folder) openWorkspace(folder);
    }
  };

  const handleCreateFile = async () => {
    if (window.electronAPI && currentPath) {
      // In a real app we'd prompt for name, for now just a dummy or use a dialog/input later.
      // But we will use the sidebar for actual file creation usually. 
      // We can just leave this unimplemented or prompt.
    }
  };

  const handleExit = () => {
    close();
  };

  const fileMenuItems: MenuItemProps[] = [
    { label: 'New File', shortcut: 'Ctrl+N', disabled: !currentPath, onClick: handleCreateFile },
    { label: 'New Folder', disabled: !currentPath },
    { divider: true, label: '' },
    { label: 'Open Folder...', shortcut: 'Ctrl+O', onClick: handleOpenFolder },
    { label: 'Open Workspace...', disabled: true },
    { divider: true, label: '' },
    { label: 'Save', shortcut: 'Ctrl+S', onClick: saveActiveFile },
    { label: 'Save All', disabled: true },
    { divider: true, label: '' },
    { label: 'Close Folder', onClick: closeWorkspace, disabled: !currentPath },
    { divider: true, label: '' },
    { label: 'Exit', shortcut: 'Alt+F4', onClick: handleExit },
  ];

  const editMenuItems: MenuItemProps[] = [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y' },
    { divider: true, label: '' },
    { label: 'Cut', shortcut: 'Ctrl+X' },
    { label: 'Copy', shortcut: 'Ctrl+C' },
    { label: 'Paste', shortcut: 'Ctrl+V' },
  ];

  const defaultMenuItems: MenuItemProps[] = [{ label: 'Not implemented' }];

  const menus = [
    { name: 'File', items: fileMenuItems },
    { name: 'Edit', items: editMenuItems },
    { name: 'Selection', items: defaultMenuItems },
    { name: 'View', items: defaultMenuItems },
    { name: 'Go', items: defaultMenuItems },
    { name: 'Run', items: defaultMenuItems },
    { name: 'Terminal', items: defaultMenuItems },
    { name: 'AI', items: defaultMenuItems },
    { name: 'Help', items: defaultMenuItems },
  ];

  return (
    <div 
      className={cn(
        "h-8 flex items-center justify-between text-xs font-medium select-none text-slate-400 bg-[#141414] border-b border-[#2a2a2a]",
        "[-webkit-app-region:drag]"
      )}
    >
      <div className="flex items-center h-full">
        {/* Logo */}
        <div className="px-3 flex items-center h-full text-blue-400 font-bold text-sm tracking-wide">
          NovaDesk
        </div>
        
        {/* Menus */}
        <div className="flex items-center h-full [-webkit-app-region:no-drag]">
          {menus.map(menu => (
            <Menu
              key={menu.name}
              label={menu.name}
              items={menu.items}
              isOpen={activeMenu === menu.name}
              onToggle={() => handleMenuToggle(menu.name)}
              onHover={() => handleMenuHover(menu.name)}
              onClose={closeMenu}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-slate-300 opacity-80">{workspaceName} - NovaDesk</span>
      </div>

      <div className="flex h-full [-webkit-app-region:no-drag]">
        <button 
          onClick={minimize}
          className="h-full px-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={maximize}
          className="h-full px-4 hover:bg-slate-800 flex items-center justify-center transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button 
          onClick={close}
          className="h-full px-4 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
