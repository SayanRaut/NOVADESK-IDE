
import { motion, AnimatePresence } from 'framer-motion';
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
        className="relative flex items-center justify-center w-12 h-12 text-slate-400 hover:text-slate-100 transition-colors group"
        title={label}
      >
        <Icon className={cn("w-6 h-6 transition-colors duration-150", isActive ? "text-blue-400" : "")} strokeWidth={1.5} />
        {isActive && id !== 'profile' && (
          <motion.div
            layoutId="active-activity-indicator"
            className="absolute left-0 w-0.5 h-12 bg-blue-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className="w-12 h-full bg-slate-900 border-r border-slate-800 flex flex-col items-center justify-between py-2 select-none">
      <div className="flex flex-col w-full">
        {topItems.map(item => (
          <ActivityIcon key={item.id} {...item} />
        ))}
      </div>
      <div className="flex flex-col w-full relative" ref={profileRef}>
        {bottomItems.map(item => (
          <ActivityIcon key={item.id} {...item} />
        ))}

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-14 bottom-12 w-64 p-5 bg-slate-950 border border-slate-700/50 rounded-xl shadow-2xl z-50 flex flex-col gap-4"
            >
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
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
