import { motion, AnimatePresence } from 'framer-motion';
import Dock from './animations/Dock';
import { Files, Search, GitBranch, Play, Blocks, Sparkles, Settings, UserCircle, LogOut } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import type { ActivityItem } from '../contexts/SidebarContext';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import { useState, useRef, useEffect } from 'react';

const topItems: { id: ActivityItem; icon: React.ElementType; label: string }[] = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'source-control', icon: GitBranch, label: 'Source Control' },
  { id: 'run-debug', icon: Play, label: 'Run & Debug' },
  { id: 'extensions', icon: Blocks, label: 'Extensions' },
  { id: 'ai', icon: Sparkles, label: 'AI Workspace' },
];

const bottomItems: { id: ActivityItem | 'profile'; icon: React.ElementType; label: string }[] = [
  { id: 'profile', icon: UserCircle, label: 'Profile' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function ActivityBar() {
  const { activeActivity, setActiveActivity } = useSidebar();
  const { isSidebarOpen, setSidebarOpen, isAISidebarOpen, setAISidebarOpen } = useLayout();
  const { user, logout } = useAuth();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActivityClick = (id: ActivityItem | 'profile') => {
    if (id === 'profile') {
      setIsProfileOpen(!isProfileOpen);
      return;
    }

    if (id === 'ai') {
      if (!isAISidebarOpen) setAISidebarOpen(true);
      else setAISidebarOpen(false);
      return;
    }

    if (activeActivity === id) {
      setSidebarOpen(!isSidebarOpen);
    } else {
      setActiveActivity(id);
      if (!isSidebarOpen) setSidebarOpen(true);
    }
  };

  const ActivityIcon = ({ id, icon: Icon, label }: { id: ActivityItem | 'profile'; icon: React.ElementType; label: string }) => {
    const isActive = id === 'profile' ? isProfileOpen : activeActivity === id && (id === 'ai' ? isAISidebarOpen : isSidebarOpen);
    
    return (
      <motion.button
        onClick={() => handleActivityClick(id)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center w-10 h-10 mx-1 text-slate-400 hover:text-slate-100 transition-colors group"
        title={label}
      >
        <Icon className={cn("w-5 h-5 transition-colors duration-150", isActive ? "text-[#c4f042]" : "")} strokeWidth={1.5} />
        {isActive && id !== 'profile' && (
          <motion.div
            layoutId="active-activity-indicator"
            className="absolute bottom-0 w-8 h-0.5 bg-[#c4f042]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className="relative z-40 w-full h-12 glass-activity-bar border-b border-white/5 flex flex-row items-center justify-between px-4 select-none">
      <div className="flex flex-row items-center h-full">
        <Dock 
          items={topItems.map(item => ({
            id: item.id,
            icon: <item.icon strokeWidth={1.5} />,
            label: item.label,
            onClick: () => handleActivityClick(item.id),
            isActive: activeActivity === item.id || (item.id === 'ai' && isAISidebarOpen)
          }))}
          panelHeight={48}
          baseItemSize={38}
          magnification={50}
        />
      </div>
      <div className="flex flex-row items-center h-full relative" ref={profileRef}>
        {bottomItems.map(item => (
          <ActivityIcon key={item.id} {...item} />
        ))}

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-64 p-5 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col gap-4"
            >
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <div className="w-12 h-12 rounded-full bg-[#c4f042] flex items-center justify-center text-black text-lg font-bold">
                  {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-sm font-medium text-slate-200 mt-2 truncate w-full text-center">
                  {user?.display_name || 'User'}
                </div>
                <div className="text-xs text-slate-400 truncate w-full text-center">
                  {user?.email || 'No email available'}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-medium border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
