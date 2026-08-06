import React from 'react';
import { IDEMenuBar } from './menubar/MenuBar';

export const MenuBar = () => {
  const menuIds = [
    'menubar/file',
    'menubar/edit',
    'menubar/view',
    'menubar/go',
    'menubar/run',
    'menubar/terminal',
    'menubar/window',
    'menubar/help'
  ];

  return (
    <div className="flex items-center px-4 h-8 bg-transparent border-b border-white/5 rounded-none z-20">
      <IDEMenuBar menuIds={menuIds} />
    </div>
  );
};
