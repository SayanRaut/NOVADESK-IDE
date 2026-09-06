import { useRef, useEffect } from 'react';
import { 
  User, 
  Inbox, 
  Settings, 
  SunMoon, 
  HelpCircle, 
  BookOpen, 
  Users, 
  Download, 
  Home, 
  LogOut, 
  ChevronRight 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  displayName?: string;
  onOpenSettings?: () => void;
  onSignOut?: () => void;
  onNavigateHome?: () => void;
}

export function UserProfileDropdown({
  isOpen,
  onClose,
  email = 'sayanraut2005@gmail.com',
  displayName = 'Sayan',
  onOpenSettings,
  onSignOut,
  onNavigateHome,
}: UserProfileDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initial = (displayName || email || 'S').trim().charAt(0).toUpperCase();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-3 mb-2 w-64 bg-[#18191d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-slate-100 animate-fade-in flex flex-col font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Profile Info (Matches Photo 2) */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 mb-1">
        <div className="w-8 h-8 rounded-full bg-[#2e7d32] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
          {initial}
        </div>
        <div className="truncate">
          <p className="text-xs font-semibold text-white truncate">
            {email}
          </p>
        </div>
      </div>

      {/* Main Items */}
      <div className="space-y-0.5">
        <button
          onClick={() => {
            onOpenSettings?.();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <User size={15} className="text-slate-400" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => {
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Inbox size={15} className="text-slate-400" />
            <span>Inbox</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" />
        </button>

        <button
          onClick={() => {
            onOpenSettings?.();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Settings size={15} className="text-slate-400" />
            <span>Settings</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Ctrl .</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <SunMoon size={15} className="text-slate-400" />
            <span>Appearance</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            <ChevronRight size={13} />
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 my-1.5" />

      {/* Support & Community Section */}
      <div className="space-y-0.5">
        <a
          href="https://github.com/SayanRaut/NOVADESK-IDE/issues"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={15} className="text-slate-400" />
            <span>Support</span>
          </div>
          <ChevronRight size={13} className="text-slate-500" />
        </a>

        <a
          href="https://github.com/SayanRaut/NOVADESK-IDE#readme"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <BookOpen size={15} className="text-slate-400" />
            <span>Documentation</span>
          </div>
          <ChevronRight size={13} className="text-slate-500" />
        </a>

        <a
          href="https://github.com/SayanRaut/NOVADESK-IDE"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <Users size={15} className="text-slate-400" />
          <span>Community</span>
        </a>

        <button
          onClick={() => onClose()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <Download size={15} className="text-slate-400" />
          <span>Download apps</span>
        </button>

        <button
          onClick={() => {
            onNavigateHome?.();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <Home size={15} className="text-slate-400" />
          <span>Homepage</span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 my-1.5" />

      {/* Sign Out Option */}
      <button
        onClick={() => {
          onSignOut?.();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
      >
        <LogOut size={15} />
        <span>Sign out</span>
      </button>
    </div>
  );
}
