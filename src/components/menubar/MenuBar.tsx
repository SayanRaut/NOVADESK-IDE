import React from 'react';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { ChevronRight } from 'lucide-react';
import { CommandRegistry } from '../../services/command/CommandRegistry';
import { KeybindingManager } from '../../services/command/KeybindingManager';
import { MenuRegistry, type IMenu, type IMenuItem } from '../../services/command/MenuRegistry';
import { useContextKeyService } from '../../services/command/ContextKeyService';
import { cn } from '../../utils/cn';

const Menubar = MenubarPrimitive.Root;
const MenubarMenu = MenubarPrimitive.Menu;
const MenubarTrigger = MenubarPrimitive.Trigger;
const MenubarPortal = MenubarPrimitive.Portal;
const MenubarContent = MenubarPrimitive.Content;
const MenubarItem = MenubarPrimitive.Item;
const MenubarSeparator = MenubarPrimitive.Separator;
const MenubarSub = MenubarPrimitive.Sub;
const MenubarSubTrigger = MenubarPrimitive.SubTrigger;
const MenubarSubContent = MenubarPrimitive.SubContent;
const MenubarCheckboxItem = MenubarPrimitive.CheckboxItem;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;
const MenubarRadioItem = MenubarPrimitive.RadioItem;

// Recursive component to render menu items
const RecursiveMenuItem: React.FC<{ item: IMenuItem }> = ({ item }) => {
  // Subscribe to context changes to re-evaluate 'when' clause
  useContextKeyService(); 
  
  const isVisible = item.when ? useContextKeyService.getState().evaluate(item.when) : true;
  if (!isVisible) return null;

  if (item.type === 'separator') {
    return <MenubarSeparator className="h-px bg-slate-700/50 my-1 mx-2" />;
  }

  if (item.type === 'submenu' && item.submenuId) {
    const submenu = MenuRegistry.getMenu(item.submenuId);
    if (!submenu || submenu.items.length === 0) return null;

    return (
      <MenubarSub>
        <MenubarSubTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white outline-none rounded-sm cursor-default select-none transition-colors data-[state=open]:bg-blue-600 data-[state=open]:text-white">
          <span>{item.label}</span>
          <ChevronRight className="w-3.5 h-3.5 ml-2 opacity-60" />
        </MenubarSubTrigger>
        <MenubarPortal>
          <MenubarSubContent 
            className="min-w-[220px] bg-[#1e1e1e] border border-slate-700/50 rounded-md shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
            sideOffset={2}
            alignOffset={-4}
          >
            {submenu.items.map((subItem, idx) => (
              <RecursiveMenuItem key={subItem.id || idx} item={subItem} />
            ))}
          </MenubarSubContent>
        </MenubarPortal>
      </MenubarSub>
    );
  }

  if (item.type === 'command' && item.commandId) {
    const command = CommandRegistry.getCommand(item.commandId);
    if (!command) return null;

    const label = item.label || command.title;
    const isEnabled = CommandRegistry.isCommandEnabled(item.commandId);
    const keybinding = KeybindingManager.getCommandKeybinding(item.commandId);

    return (
      <MenubarItem 
        className={cn(
          "flex items-center justify-between w-full px-3 py-1.5 text-xs outline-none rounded-sm cursor-default select-none transition-colors",
          isEnabled 
            ? "text-slate-300 hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white"
            : "text-slate-500 hover:bg-transparent cursor-not-allowed"
        )}
        disabled={!isEnabled}
        onSelect={(e) => {
          if (!isEnabled) {
            e.preventDefault();
            return;
          }
          CommandRegistry.executeCommand(item.commandId!);
        }}
      >
        <span>{label}</span>
        {keybinding && (
          <span className="ml-6 text-[10px] tracking-widest opacity-60 font-mono">
            {keybinding.replace(/\+/g, ' ')}
          </span>
        )}
      </MenubarItem>
    );
  }

  return null;
};

// Main MenuBar Component
export const IDEMenuBar: React.FC<{ menuIds: string[] }> = ({ menuIds }) => {
  return (
    <Menubar className="flex items-center h-8 px-2 bg-[#181818] border-b border-black/20">
      {menuIds.map(menuId => {
        const menu = MenuRegistry.getMenu(menuId);
        if (!menu || menu.items.length === 0) return null;

        const title = menuId.replace('menubar/', '');

        return (
          <MenubarMenu key={menuId}>
            <MenubarTrigger className="px-2.5 py-1 text-xs text-slate-300 font-medium hover:bg-white/10 hover:text-slate-100 focus:bg-white/10 focus:text-slate-100 data-[state=open]:bg-white/10 data-[state=open]:text-slate-100 outline-none rounded-md cursor-default select-none transition-colors">
              {title}
            </MenubarTrigger>
            <MenubarPortal>
              <MenubarContent 
                className="min-w-[220px] bg-[#1e1e1e] border border-slate-700/50 rounded-md shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                align="start"
                sideOffset={4}
              >
                {menu.items.map((item, idx) => (
                  <RecursiveMenuItem key={item.id || idx} item={item} />
                ))}
              </MenubarContent>
            </MenubarPortal>
          </MenubarMenu>
        );
      })}
    </Menubar>
  );
};
