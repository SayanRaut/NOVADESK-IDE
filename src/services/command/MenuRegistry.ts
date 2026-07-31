export type MenuItemType = 'command' | 'separator' | 'submenu' | 'checkbox' | 'radio';

export interface IMenuItem {
  id: string;
  type: MenuItemType;
  label?: string; // If omitted, UI can pull from CommandRegistry using commandId
  commandId?: string; // For 'command', 'checkbox', 'radio'
  submenuId?: string; // For 'submenu', links to another menu registration
  when?: string; // Context condition for visibility
}

export interface IMenu {
  id: string;
  items: IMenuItem[];
}

class MenuRegistryClass {
  private menus = new Map<string, IMenu>();

  registerMenu(id: string, items: IMenuItem[]) {
    this.menus.set(id, { id, items });
  }

  getMenu(id: string): IMenu | undefined {
    return this.menus.get(id);
  }
}

export const MenuRegistry = new MenuRegistryClass();
