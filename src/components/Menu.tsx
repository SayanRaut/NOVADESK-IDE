import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

export interface MenuItemProps {
  label: string;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

interface MenuProps {
  label: string;
  items: MenuItemProps[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onHover: () => void;
}

export function Menu({ label, items, isOpen, onToggle, onClose, onHover }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative h-full" ref={menuRef}>
      <div 
        className={cn(
          "px-2.5 h-full flex items-center cursor-default transition-colors",
          isOpen ? "glass-panel text-slate-100" : "hover:glass-panel hover:text-slate-100"
        )}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onMouseEnter={onHover}
      >
        {label}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 mt-0 py-1 w-48 glass-panel border border-slate-700/50 shadow-2xl rounded-md z-50 overflow-hidden"
          >
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={`divider-${index}`} className="h-px bg-slate-700/50 my-1 mx-2" />;
              }
              return (
                <div
                  key={item.label}
                  className={cn(
                    "px-4 py-1.5 flex items-center justify-between cursor-pointer",
                    item.disabled ? "text-slate-500 cursor-not-allowed" : "text-slate-300 hover:bg-blue-600 hover:text-white"
                  )}
                  onClick={() => {
                    if (!item.disabled && item.onClick) {
                      item.onClick();
                      onClose();
                    }
                  }}
                >
                  <span>{item.label}</span>
                  {item.shortcut && <span className="text-[10px] opacity-60 ml-4">{item.shortcut}</span>}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


