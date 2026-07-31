
import { motion } from 'framer-motion';
import { Files, Search, GitBranch, Play, Blocks, Sparkles, Settings } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import type { ActivityItem } from '../contexts/SidebarContext';
import { useLayout } from '../contexts/LayoutContext';
import { cn } from '../utils/cn';

const topItems: { id: ActivityItem; icon: React.ElementType; label: string }[] = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'source-control', icon: GitBranch, label: 'Source Control' },
  { id: 'run-debug', icon: Play, label: 'Run & Debug' },
  { id: 'extensions', icon: Blocks, label: 'Extensions' },
  { id: 'ai', icon: Sparkles, label: 'AI Workspace' },
];

const bottomItems: { id: ActivityItem; icon: React.ElementType; label: string }[] = [
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function ActivityBar() {
  const { activeActivity, setActiveActivity } = useSidebar();
  const { isSidebarOpen, setSidebarOpen, isAISidebarOpen, setAISidebarOpen } = useLayout();

  const handleActivityClick = (id: ActivityItem) => {
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

  const ActivityIcon = ({ id, icon: Icon, label }: { id: ActivityItem; icon: React.ElementType; label: string }) => {
    const isActive = activeActivity === id && (id === 'ai' ? isAISidebarOpen : isSidebarOpen);
    
    return (
      <button
        onClick={() => handleActivityClick(id)}
        className="relative flex items-center justify-center w-12 h-12 text-slate-400 hover:text-slate-100 transition-colors group"
        title={label}
      >
        <Icon className={cn("w-6 h-6 transition-transform duration-150", isActive ? "text-blue-400" : "")} strokeWidth={1.5} />
        {isActive && (
          <motion.div
            layoutId="active-activity-indicator"
            className="absolute left-0 w-0.5 h-12 bg-blue-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </button>
    );
  };

  return (
    <div className="w-12 h-full bg-slate-900 border-r border-slate-800 flex flex-col items-center justify-between py-2 select-none">
      <div className="flex flex-col w-full">
        {topItems.map(item => (
          <ActivityIcon key={item.id} {...item} />
        ))}
      </div>
      <div className="flex flex-col w-full">
        {bottomItems.map(item => (
          <ActivityIcon key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}
