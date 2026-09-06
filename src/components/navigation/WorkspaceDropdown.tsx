import { useRef, useEffect } from 'react';
import { 
  UserPlus, 
  Settings, 
  Plus, 
  Zap, 
  ChevronRight 
} from 'lucide-react';

interface WorkspaceDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName?: string;
  planName?: string;
  memberCount?: number;
  creditsLeft?: number;
  onOpenSettings?: () => void;
  onInviteMembers?: () => void;
  onNewWorkspace?: () => void;
  onUpgrade?: () => void;
}

export function WorkspaceDropdown({
  isOpen,
  onClose,
  workspaceName = "Sayan's Lovable",
  planName = "Free Plan",
  memberCount = 3,
  creditsLeft = 5,
  onOpenSettings,
  onInviteMembers,
  onNewWorkspace,
  onUpgrade,
}: WorkspaceDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  const initial = (workspaceName || 'S').trim().charAt(0).toUpperCase();

  return (
    <div
      ref={ref}
      className="absolute top-full left-3 mt-2 w-72 bg-[#18191d] border border-white/10 rounded-2xl shadow-2xl p-3 z-50 text-slate-100 animate-fade-in flex flex-col gap-2.5 font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Workspace Header Card */}
      <div className="flex items-center gap-3 p-1.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0">
          {initial}
        </div>
        <div className="truncate">
          <h4 className="text-sm font-bold text-white tracking-tight truncate">
            {workspaceName}
          </h4>
          <p className="text-xs text-slate-400">
            {planName} &bull; {memberCount} members
          </p>
        </div>
      </div>

      {/* Action Buttons: Invite & Settings */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            onInviteMembers?.();
            onClose();
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-semibold text-slate-200 transition cursor-pointer"
        >
          <UserPlus size={14} className="text-slate-400" />
          <span>Invite members</span>
        </button>

        <button
          onClick={() => {
            onOpenSettings?.();
            onClose();
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-semibold text-slate-200 transition cursor-pointer"
        >
          <Settings size={14} className="text-slate-400" />
          <span>Settings</span>
        </button>
      </div>

      {/* Credits Card */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Credits</span>
          <button 
            onClick={() => onUpgrade?.()}
            className="flex items-center gap-0.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <span>{creditsLeft} left</span>
            <ChevronRight size={13} className="text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, (creditsLeft / 10) * 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Daily credits reset at midnight UTC</span>
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 my-0.5" />

      {/* New Workspace Option */}
      <button
        onClick={() => {
          onNewWorkspace?.();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
      >
        <Plus size={15} className="text-slate-400" />
        <span>New workspace</span>
      </button>

      {/* Divider */}
      <div className="h-px bg-white/5 my-0.5" />

      {/* Turn Pro CTA */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-white fill-white" />
          <span className="text-xs font-bold text-white">Turn Pro</span>
        </div>

        <button
          onClick={() => {
            onUpgrade?.();
            onClose();
          }}
          className="px-3 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold shadow-xs transition cursor-pointer"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}
