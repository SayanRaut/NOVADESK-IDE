import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../config/api';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowRight, 
  FolderCode, 
  RefreshCw, 
  Search, 
  LayoutDashboard, 
  Boxes, 
  Wand2, 
  Shuffle, 
  ChevronRight, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  Code2,
  BookOpen,
  Settings,
  BrainCircuit,
  Key,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Star,
  MoreHorizontal,
  Link as LinkIcon,
  ChevronDown,
  Check,
  ExternalLink,
  Laptop,
  Compass
} from 'lucide-react';
import { WorkspaceSettingsModal, type SettingsTab } from '../components/settings/WorkspaceSettingsModal';
import { ProjectPlannerModal } from '../components/planner/ProjectPlannerModal';
import { ProjectProgressMonitor } from '../components/monitor/ProjectProgressMonitor';
import { WorkspaceDropdown } from '../components/navigation/WorkspaceDropdown';
import { UserProfileDropdown } from '../components/navigation/UserProfileDropdown';
import { useApiKey } from '../contexts/ApiKeyContext';

interface CodespaceItem {
  name: string;
  path: string;
  fileCount: number;
  stack: string;
  updatedAt: number;
  isActive: boolean;
}

interface SuggestionItem {
  id: string;
  category: 'Trending' | 'SaaS' | 'AI & Automation' | 'Full-Stack' | 'E-Commerce';
  title: string;
  description: string;
  prompt: string;
  tags: string[];
}

// Comprehensive catalog of application suggestions
const SUGGESTIONS_CATALOG: SuggestionItem[] = [
  {
    id: 's1',
    category: 'Trending',
    title: 'AI Prompt Engineering Studio',
    description: 'Visual workbench with prompt versioning, token comparison, latency benchmarking, and test fixtures.',
    prompt: 'Build a modern AI prompt testing and comparison workbench with model latency graphs, variable substitution, version comparison, and copyable SDK code snippets.',
    tags: ['Next.js', 'AI Studio', 'Analytics']
  },
  {
    id: 's2',
    category: 'SaaS',
    title: 'Customer Feedback & Roadmap Board',
    description: 'Public feature voting board with user submission form, status columns, and changelog release feed.',
    prompt: 'Create a feature request and public roadmap platform with upvoting, markdown changelog updates, tag filtering, and admin moderation panel.',
    tags: ['SaaS', 'Roadmap', 'Voting']
  },
  {
    id: 's3',
    category: 'AI & Automation',
    title: 'Smart Meeting Notes & Action Tracker',
    description: 'Real-time transcript summarizer with auto-detected action items, owner assignment, and export.',
    prompt: 'Build a meeting intelligence dashboard with AI summary breakdown, key action items checklist, speaker tags, and export to PDF/Markdown.',
    tags: ['AI Agent', 'Productivity', 'Export']
  },
  {
    id: 's4',
    category: 'E-Commerce',
    title: 'Modern Minimalist Lifestyle Store',
    description: 'High-aesthetic storefront with sticky cart drawer, product variant picker, reviews, and checkout breakdown.',
    prompt: 'Create a boutique e-commerce web app with sleek product cards, interactive cart drawer, color and size selector, review rating stars, and order summary.',
    tags: ['Storefront', 'Cart', 'Tailwind']
  },
  {
    id: 's5',
    category: 'Full-Stack',
    title: 'Real-Time Team Kanban & Task Hub',
    description: 'Drag-and-drop workflow board with priority tags, activity log stream, and member avatars.',
    prompt: 'Build a responsive project management board with drag-and-drop columns (Backlog, In Progress, Review, Done), priority labels, and instant filter by assignee.',
    tags: ['Full-Stack', 'Kanban', 'Real-time']
  },
  {
    id: 's6',
    category: 'Trending',
    title: 'Developer API Status & Uptime Monitor',
    description: 'Real-time service health board with 90-day incident timeline, response time metrics, and alert cards.',
    prompt: 'Create an incident response and system status portal with uptime percent gauges, historical incident log, response latency charts, and email notification signup.',
    tags: ['DevTools', 'Status', 'Metrics']
  },
  {
    id: 's7',
    category: 'SaaS',
    title: 'Invoice & Subscription Billing Hub',
    description: 'Interactive invoice generator with tax calculation, PDF download preview, and client payment links.',
    prompt: 'Build a freelance and agency invoicing web application with line-item tax calculation, customizable branding logos, payment status tags, and printable invoice layout.',
    tags: ['Finance', 'Billing', 'PDF']
  },
  {
    id: 's8',
    category: 'AI & Automation',
    title: 'AI Resume & Portfolio Builder',
    description: 'Two-column resume editor with live markdown preview, template switching, and keyword scoring.',
    prompt: 'Build an ATS-optimized resume builder with live split-screen preview, multiple sleek typography themes, PDF export, and instant AI bullet point polishing.',
    tags: ['AI Builder', 'Resume', 'Preview']
  },
  {
    id: 's9',
    category: 'Full-Stack',
    title: 'Collaborative Markdown Knowledge Base',
    description: 'Hierarchical doc tree with instant search, syntax highlighting, callouts, and table of contents.',
    prompt: 'Create a developer documentation hub with sidebar folder hierarchy, full-text search with keyboard shortcuts, copyable code blocks, and dark/light toggle.',
    tags: ['Docs', 'Search', 'Markdown']
  },
  {
    id: 's10',
    category: 'E-Commerce',
    title: 'Digital Asset & Template Marketplace',
    description: 'Creator marketplace with audio/visual previews, creator profiles, licensing badges, and cart.',
    prompt: 'Build a digital marketplace for UI components and design assets with live preview modals, tag filters, user ratings, and instant purchase checkout.',
    tags: ['Marketplace', 'Assets', 'Checkout']
  },
  {
    id: 's11',
    category: 'Trending',
    title: 'Crypto Portfolio & DeFi Token Tracker',
    description: 'Live price tracker with candlestick visuals, portfolio percentage breakdown, and profit/loss cards.',
    prompt: 'Build an interactive cryptocurrency portfolio tracker with real-time price tickers, portfolio distribution donut chart, 24h gain/loss highlights, and watchlists.',
    tags: ['Web3', 'Charts', 'Fintech']
  },
  {
    id: 's12',
    category: 'SaaS',
    title: 'Employee Onboarding & Training Portal',
    description: 'Step-by-step checklist with progress rings, required document uploads, and company FAQ.',
    prompt: 'Create an employee onboarding dashboard with gamified checklist progress, team member directory, department resources library, and welcoming celebration cards.',
    tags: ['HR', 'Onboarding', 'Gamified']
  }
];

export function HomePage() {
  const { openCodespace, openStudio, startPrototypeGeneration, navigateTo } = useNavigation();
  const { user, logout } = useAuth();
  
  const [codespaces, setCodespaces] = useState<CodespaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'templates'>('dashboard');

  // Sidebar Popovers (Photo 2 & Photo 3)
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isUserProfileDropdownOpen, setIsUserProfileDropdownOpen] = useState(false);

  // Photo 1 Projects Header & Filter States
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'grid' | 'list'>('card');
  const [projectSearch, setProjectSearch] = useState('');
  const [sortFilter, setSortFilter] = useState<'edited' | 'created' | 'name'>('edited');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'me' | 'shared'>('all');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'sort' | 'visibility' | 'status' | 'owner' | null>(null);
  const [starredProjects, setStarredProjects] = useState<string[]>([]);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);

  // Workspace Settings Modal State (Lovable-style settings)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('workspace');

  const openSettings = (tab: SettingsTab = 'workspace') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  // Bring-Your-Own-Key & AI Planner Modal
  const { hasKey, maskedKey } = useApiKey();
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [monitorMode, setMonitorMode] = useState<'extension' | 'dashboard'>('extension');

  // Prompt Generator State
  const [promptInput, setPromptInput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Suggestions System State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [displayedSuggestions, setDisplayedSuggestions] = useState<SuggestionItem[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const projectsSectionRef = useRef<HTMLDivElement>(null);

  // Function to randomize and shuffle suggestions
  const shuffleSuggestions = () => {
    setIsShuffling(true);
    setTimeout(() => {
      // Pick 4 diverse suggestions
      const shuffled = [...SUGGESTIONS_CATALOG].sort(() => 0.5 - Math.random()).slice(0, 4);
      setDisplayedSuggestions(shuffled);
      setIsShuffling(false);
    }, 200);
  };

  useEffect(() => {
    shuffleSuggestions();
  }, []);

  const fetchCodespaces = async () => {
    setIsLoading(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/fs/codespaces`);
      if (res.ok) {
        const data = await res.json();
        setCodespaces(data);
      }
    } catch (e) {
      console.warn('Failed to load codespaces:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodespaces();
  }, []);

  // Filtered suggestions based on category
  const filteredSuggestions = useMemo(() => {
    if (selectedCategory === 'All') return displayedSuggestions;
    return SUGGESTIONS_CATALOG.filter(item => item.category === selectedCategory).slice(0, 4);
  }, [selectedCategory, displayedSuggestions]);

  // Filtered codespaces based on search query and sort filter
  const filteredCodespaces = useMemo(() => {
    let list = [...codespaces];
    const q = (projectSearch || searchQuery).trim().toLowerCase();
    if (q) {
      list = list.filter(c => c.name.toLowerCase().includes(q) || (c.stack && c.stack.toLowerCase().includes(q)));
    }
    if (sortFilter === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortFilter === 'created') {
      list.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
    } else {
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return list;
  }, [codespaces, searchQuery, projectSearch, sortFilter]);

  const handleCreateBlank = async (template = 'nextjs') => {
    setIsCreatingBlank(true);
    try {
      const prefix = template === 'nextjs' ? 'web-app' : 'codespace';
      const name = `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/fs/codespaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, template }),
      });
      if (res.ok) {
        const data = await res.json();
        openCodespace(data.name, data.path);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingBlank(false);
    }
  };

  const handleLaunchPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = promptInput.trim();
    if (!cleanPrompt) return;

    // Generate clean slug for project name
    const slug = cleanPrompt
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .join('-');
    const projectName = `${slug || 'web-app'}-${Math.random().toString(36).slice(2, 6)}`;

    // Default to Next.js fullstack generation seamlessly
    startPrototypeGeneration({
      name: projectName,
      template: 'nextjs',
      prompt: cleanPrompt,
    });
  };

  // Inspire Me randomizer
  const handleInspireMe = () => {
    const randomItem = SUGGESTIONS_CATALOG[Math.floor(Math.random() * SUGGESTIONS_CATALOG.length)];
    setPromptInput(randomItem.prompt);
    promptTextareaRef.current?.focus();
  };

  // AI Prompt Enhancer
  const handleEnhancePrompt = () => {
    if (!promptInput.trim()) {
      handleInspireMe();
      return;
    }
    setIsEnhancing(true);
    setTimeout(() => {
      const enhanced = `${promptInput.trim()}. Include robust authentication, responsive navigation with mobile drawer, modular component architecture, Tailwind CSS styling with smooth transitions, and complete type safety.`;
      setPromptInput(enhanced);
      setIsEnhancing(false);
      promptTextareaRef.current?.focus();
    }, 300);
  };

  const handleApplySuggestion = (item: SuggestionItem) => {
    setPromptInput(item.prompt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
    promptTextareaRef.current?.focus();
    promptTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${name}"? This will permanently remove its files.`)) return;
    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/api/fs/codespaces/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      setCodespaces((prev) => prev.filter((c) => c.name !== name));
    } catch (err) {
      console.error('Failed to delete codespace:', err);
    }
  };

  const scrollToProjects = () => {
    setActiveTab('projects');
    projectsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ─── LEFT HAND SIDEBAR (Collapsible) ─── */}
      <aside 
        className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 shrink-0 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                  NovaDesk
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">
                  AI Studio
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles size={18} />
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Quick Action: New Project CTA */}
        <div className="p-3 pb-1">
          <button
            onClick={() => handleCreateBlank('nextjs')}
            disabled={isCreatingBlank}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-3 shadow-sm hover:shadow transition-all cursor-pointer ${
              sidebarCollapsed ? 'px-0' : ''
            }`}
            title="Create New Project"
          >
            <Plus size={16} className="shrink-0" />
            {!sidebarCollapsed && <span>{isCreatingBlank ? 'Creating...' : 'New Project'}</span>}
          </button>
        </div>

        {/* Workspace Quick Pill (Matches Lovable Photo 3) */}
        <div className="relative px-3 pb-2">
          <button
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition cursor-pointer hover:bg-slate-100/80 bg-slate-50 border border-slate-200/80 ${
              sidebarCollapsed ? 'justify-center p-1.5' : ''
            }`}
            title="Workspace Menu"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                {user?.display_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              {!sidebarCollapsed && (
                <span className="truncate text-slate-800 font-bold">
                  {user?.display_name?.split(' ')[0] || 'Sayan'}'s Lovable
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          <WorkspaceDropdown
            isOpen={isWorkspaceDropdownOpen}
            onClose={() => setIsWorkspaceDropdownOpen(false)}
            workspaceName={`${user?.display_name?.split(' ')[0] || 'Sayan'}'s Lovable`}
            planName="Free Plan"
            memberCount={3}
            creditsLeft={5}
            onOpenSettings={() => {
              setIsWorkspaceDropdownOpen(false);
              openSettings('workspace');
            }}
            onInviteMembers={() => {
              setIsWorkspaceDropdownOpen(false);
              openSettings('workspace');
            }}
            onNewWorkspace={() => {
              setIsWorkspaceDropdownOpen(false);
              handleCreateBlank('nextjs');
            }}
            onUpgrade={() => {
              setIsWorkspaceDropdownOpen(false);
              openSettings('account');
            }}
          />
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button
            onClick={scrollToProjects}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderCode size={18} className={activeTab === 'projects' ? 'text-indigo-600' : 'text-slate-400'} />
              {!sidebarCollapsed && <span>My Projects</span>}
            </div>
            {!sidebarCollapsed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {codespaces.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('templates');
              shuffleSuggestions();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Boxes size={18} className={activeTab === 'templates' ? 'text-indigo-600' : 'text-slate-400'} />
            {!sidebarCollapsed && <span>AI Blueprints</span>}
          </button>

          <button
            onClick={() => setIsPlannerOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-slate-600 hover:bg-blue-50 hover:text-blue-900"
            title="AI Autonomous Project Planner"
          >
            <BrainCircuit size={18} className="text-blue-600 shrink-0" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>AI Planner</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  DAG
                </span>
              </div>
            )}
          </button>

          <button
            onClick={() => {
              setMonitorMode('extension');
              setShowMonitorModal(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
            title="Autonomous Project Progress Monitor"
          >
            <Compass size={18} className="text-emerald-600 shrink-0" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Progress Monitor</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Live
                </span>
              </div>
            )}
          </button>

          <div className="pt-4 mt-2 border-t border-slate-100">
            {!sidebarCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Workspace
              </p>
            )}

            <button
              onClick={() => openSettings('git')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <Settings size={18} className="text-slate-400" />
              {!sidebarCollapsed && <span>Project Settings</span>}
            </button>

            <button
              onClick={() => navigateTo('create')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <Code2 size={18} className="text-slate-400" />
              {!sidebarCollapsed && <span>Template Gallery</span>}
            </button>

            <a
              href="https://github.com/SayanRaut/NOVADESK-IDE"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            >
              <BookOpen size={18} className="text-slate-400" />
              {!sidebarCollapsed && <span>Documentation</span>}
            </a>
          </div>
        </div>

        {/* Sidebar Footer / User Profile (Matches Lovable Photo 2) */}
        <div className="relative p-3 border-t border-slate-100 bg-slate-50/50">
          <div className={`flex items-center justify-between ${sidebarCollapsed ? 'flex-col gap-2' : ''}`}>
            <div 
              onClick={() => setIsUserProfileDropdownOpen(!isUserProfileDropdownOpen)}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-80 transition flex-1"
              title="Click to view User Profile & Account Menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#2e7d32] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'S'}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.display_name || 'Sayan'}
                    </p>
                    <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || 'sayanraut2005@gmail.com'}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsUserProfileDropdownOpen(!isUserProfileDropdownOpen)}
              title="User Menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          <UserProfileDropdown
            isOpen={isUserProfileDropdownOpen}
            onClose={() => setIsUserProfileDropdownOpen(false)}
            email={user?.email || 'sayanraut2005@gmail.com'}
            displayName={user?.display_name || 'Sayan'}
            onOpenSettings={() => {
              setIsUserProfileDropdownOpen(false);
              openSettings('account');
            }}
            onSignOut={logout}
            onNavigateHome={() => {
              setIsUserProfileDropdownOpen(false);
              setActiveTab('dashboard');
            }}
          />
        </div>
      </aside>

      {/* ─── MAIN CONTENT VIEWPORT (Scrollable) ─── */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col bg-[#f8fafc]">
        
        {/* Top Header Bar (Minimal, No Model Selector) */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 sm:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects or blueprints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Gemini Key Status Pill */}
            <button
              onClick={() => openSettings('secrets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer shadow-2xs ${
                hasKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title="Configure Google Gemini API Key"
            >
              <Key size={12} />
              <span>{hasKey ? `Gemini Key: ${maskedKey}` : 'Set Gemini Key'}</span>
            </button>

            <button
              onClick={() => setIsPlannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Launch AI Project Planner Agent"
            >
              <BrainCircuit size={14} className="text-blue-600" />
              <span className="hidden sm:inline">AI Planner</span>
            </button>

            {/* Autonomous Progress Monitor Glass Button */}
            <button
              onClick={() => {
                setMonitorMode('extension');
                setShowMonitorModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-button-primary rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Launch Autonomous Project Progress Monitor"
            >
              <Compass size={14} className="text-white animate-spin-slow" />
              <span className="hidden sm:inline">Progress Monitor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => openSettings('workspace')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Open Workspace & Project Settings"
            >
              <Settings size={14} className="text-slate-500" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => handleCreateBlank('nextjs')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Project</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div className="max-w-6xl w-full mx-auto px-6 sm:px-10 py-10 space-y-12">
          
          {/* ─── HERO & PROMPT GENERATOR SECTION ─── */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 shadow-sm">
                <Sparkles size={13} className="text-indigo-600" />
                <span>AI Full-Stack Generator</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                What do you want to build today?
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Describe your application. NovaDesk synthesizes full-stack architecture, clean UI components, and API routes in real-time.
              </p>
            </div>

            {/* Central Prompt Card (Clean, No Next.js Selector) */}
            <form
              onSubmit={handleLaunchPrompt}
              className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all p-3 flex flex-col gap-3"
            >
              <textarea
                ref={promptTextareaRef}
                rows={4}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleLaunchPrompt();
                  }
                }}
                placeholder="Ask NovaDesk to build anything (e.g. Build an analytics SaaS dashboard with user authentication, revenue graphs, export to CSV, and light theme styling...)"
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none resize-none leading-relaxed"
              />

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 px-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInspireMe}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition cursor-pointer"
                    title="Randomize and inject an app idea"
                  >
                    <Wand2 size={13} className="text-indigo-500" />
                    <span>Inspire Me</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition cursor-pointer"
                    title="Enrich your prompt with production specifications"
                  >
                    <Sparkles size={13} className={isEnhancing ? 'animate-spin text-indigo-500' : 'text-slate-400'} />
                    <span>{isEnhancing ? 'Enhancing...' : 'Enhance'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlannerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                    title="Generate an autonomous DAG task breakdown plan before generating"
                  >
                    <BrainCircuit size={13} className="text-blue-600" />
                    <span>Plan Project</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!promptInput.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer ml-auto"
                >
                  <Sparkles size={14} />
                  <span>Generate Application</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </section>

          {/* ─── DYNAMIC REFRESHABLE SUGGESTIONS SECTION ─── */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Suggested Application Blueprints</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                    Live Ideas
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select an idea or refresh to discover new full-stack architectures.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Category Pills */}
                <div className="hidden sm:flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                  {['All', 'Trending', 'SaaS', 'AI & Automation', 'Full-Stack', 'E-Commerce'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Shuffle / Refresh Button */}
                <button
                  onClick={shuffleSuggestions}
                  disabled={isShuffling}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 text-xs font-semibold shadow-xs transition cursor-pointer"
                  title="Shuffle suggestions"
                >
                  <Shuffle size={13} className={isShuffling ? 'animate-spin text-indigo-600' : ''} />
                  <span>Refresh Ideas</span>
                </button>
              </div>
            </div>

            {/* Suggestion Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuggestions.map((item) => {
                const isCopied = copiedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleApplySuggestion(item)}
                    className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-indigo-600 font-semibold group-hover:underline flex items-center gap-1">
                          {isCopied ? 'Loaded to Prompt!' : 'Use Blueprint'}
                          <ChevronRight size={13} />
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─── MY PROJECTS / PHOTO 1 LAYOUT ─── */}
          <section ref={projectsSectionRef} className="space-y-4 pt-2">
            
            {/* Header: Title + Create Dropdown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {filteredCodespaces.length}
                </span>
                <button
                  onClick={fetchCodespaces}
                  title="Reload Projects"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create</span>
                  <ChevronDown size={14} className={`transition-transform ${isCreateDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCreateDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-40 animate-fade-in font-sans"
                    onClick={() => setIsCreateDropdownOpen(false)}
                  >
                    <button
                      onClick={() => handleCreateBlank('nextjs')}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Plus size={14} className="text-slate-400" />
                      <span>New Blank Sandbox</span>
                    </button>
                    <button
                      onClick={() => {
                        promptTextareaRef.current?.focus();
                        promptTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Sparkles size={14} className="text-indigo-500" />
                      <span>Generate with AI</span>
                    </button>
                    <button
                      onClick={() => setIsPlannerOpen(true)}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <BrainCircuit size={14} className="text-blue-500" />
                      <span>Autonomous AI Planner</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => openSettings('git')}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <ExternalLink size={14} className="text-slate-400" />
                      <span>Import from GitHub</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Toolbar (Matches Photo 1: Search, Filter Dropdowns, View Switchers) */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-1">
              
              {/* Left Side: Search + Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                
                {/* Search projects... */}
                <div className="relative w-48 sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-500 outline-none shadow-2xs transition"
                  />
                </div>

                {/* Filter: Last edited ▾ */}
                <div className="relative">
                  <button
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'sort' ? null : 'sort')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-medium shadow-2xs transition cursor-pointer"
                  >
                    <span>
                      {sortFilter === 'edited' ? 'Last edited' : sortFilter === 'created' ? 'Created date' : 'Name A-Z'}
                    </span>
                    <ChevronDown size={13} className="text-slate-400" />
                  </button>
                  {activeFilterDropdown === 'sort' && (
                    <div className="absolute left-0 mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 animate-fade-in">
                      {[
                        { id: 'edited', label: 'Last edited' },
                        { id: 'created', label: 'Created date' },
                        { id: 'name', label: 'Name A-Z' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSortFilter(opt.id as any);
                            setActiveFilterDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between cursor-pointer ${
                            sortFilter === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {sortFilter === opt.id && <Check size={12} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter: Any visibility ▾ */}
                <div className="relative">
                  <button
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'visibility' ? null : 'visibility')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-medium shadow-2xs transition cursor-pointer"
                  >
                    <span>
                      {visibilityFilter === 'all' ? 'Any visibility' : visibilityFilter === 'public' ? 'Public' : 'Private'}
                    </span>
                    <ChevronDown size={13} className="text-slate-400" />
                  </button>
                  {activeFilterDropdown === 'visibility' && (
                    <div className="absolute left-0 mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 animate-fade-in">
                      {[
                        { id: 'all', label: 'Any visibility' },
                        { id: 'public', label: 'Public' },
                        { id: 'private', label: 'Private' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setVisibilityFilter(opt.id as any);
                            setActiveFilterDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between cursor-pointer ${
                            visibilityFilter === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {visibilityFilter === opt.id && <Check size={12} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter: Any status ▾ */}
                <div className="relative">
                  <button
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'status' ? null : 'status')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-medium shadow-2xs transition cursor-pointer"
                  >
                    <span>
                      {statusFilter === 'all' ? 'Any status' : statusFilter === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <ChevronDown size={13} className="text-slate-400" />
                  </button>
                  {activeFilterDropdown === 'status' && (
                    <div className="absolute left-0 mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 animate-fade-in">
                      {[
                        { id: 'all', label: 'Any status' },
                        { id: 'active', label: 'Active' },
                        { id: 'inactive', label: 'Inactive' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setStatusFilter(opt.id as any);
                            setActiveFilterDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between cursor-pointer ${
                            statusFilter === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {statusFilter === opt.id && <Check size={12} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter: All owners ▾ */}
                <div className="relative">
                  <button
                    onClick={() => setActiveFilterDropdown(activeFilterDropdown === 'owner' ? null : 'owner')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-medium shadow-2xs transition cursor-pointer"
                  >
                    <span>
                      {ownerFilter === 'all' ? 'All owners' : ownerFilter === 'me' ? 'Owned by me' : 'Shared'}
                    </span>
                    <ChevronDown size={13} className="text-slate-400" />
                  </button>
                  {activeFilterDropdown === 'owner' && (
                    <div className="absolute left-0 mt-1.5 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 animate-fade-in">
                      {[
                        { id: 'all', label: 'All owners' },
                        { id: 'me', label: 'Owned by me' },
                        { id: 'shared', label: 'Shared' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setOwnerFilter(opt.id as any);
                            setActiveFilterDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between cursor-pointer ${
                            ownerFilter === opt.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {ownerFilter === opt.id && <Check size={12} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: View Switcher (Filter, Card, Grid, List) */}
              <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl shadow-2xs">
                <button
                  onClick={() => {
                    setSortFilter('edited');
                    setVisibilityFilter('all');
                    setStatusFilter('all');
                    setOwnerFilter('all');
                    setProjectSearch('');
                  }}
                  title="Reset Filters"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button
                  onClick={() => setViewMode('card')}
                  title="Card View (Photo 1)"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'card'
                      ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Compact Grid"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Boxes size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List View"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-slate-100 text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Subtitle / Section Status (Matches Photo 1: Inactive 60+ days) */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Inactive 60+ days
              </span>
            </div>

            {/* ─── CARDS VIEW (Matches Photo 1 Layout) ─── */}
            {viewMode === 'card' && (
              filteredCodespaces.length === 0 ? (
                <div className="p-12 rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FolderCode size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {projectSearch ? 'No matching projects found' : 'No projects created yet'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                      {projectSearch 
                        ? 'Try searching for another keyword or clear the search filter.'
                        : 'Generate your first full-stack application using the prompt generator above, or create a blank sandbox.'}
                    </p>
                  </div>
                  {!projectSearch && (
                    <button
                      onClick={() => handleCreateBlank('nextjs')}
                      className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer flex items-center gap-2"
                    >
                      <Plus size={14} />
                      <span>Create Starter Project</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredCodespaces.map((c) => {
                    const isNext = c.stack?.toLowerCase().includes('next') || c.name.includes('next') || c.name.includes('web-app');
                    const initial = c.name.charAt(0).toUpperCase();
                    const isStarred = starredProjects.includes(c.name);

                    return (
                      <div
                        key={c.name}
                        onClick={() => openStudio(c.name, c.path)}
                        className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                      >
                        {/* Preview Canvas */}
                        <div className="h-56 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 relative overflow-hidden flex flex-col justify-between border-b border-white/5 select-none">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">
                              {isNext ? 'Next.js App' : 'Full-Stack'}
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStarredProjects(prev =>
                                  prev.includes(c.name)
                                    ? prev.filter(id => id !== c.name)
                                    : [...prev, c.name]
                                );
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 transition cursor-pointer"
                              title="Star Project"
                            >
                              <Star 
                                size={16} 
                                className={isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} 
                              />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xl font-black text-white tracking-tight truncate">{c.name}</h4>
                            <p className="text-xs text-slate-300 line-clamp-2">
                              Interactive full-stack workspace with live code editing and preview.
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
                            <span>{c.fileCount || 0} source files</span>
                            <span className="text-indigo-300 font-medium">Ready to build</span>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <div className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-2">
                              <Laptop size={14} />
                              <span>Open in Lovable Studio</span>
                              <ArrowRight size={13} />
                            </div>
                          </div>
                        </div>

                        {/* Footer (Matches Photo 1) */}
                        <div className="p-3.5 px-4 flex items-center justify-between bg-white">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-7 h-7 rounded-full bg-[#2e7d32] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                              {initial}
                            </div>
                            <div className="truncate">
                              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {c.name}
                              </h4>
                              <p className="text-[11px] text-slate-400">Recently edited</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(`${window.location.origin}/studio?project=${encodeURIComponent(c.name)}`);
                                setCopiedProjectId(c.name);
                                setTimeout(() => setCopiedProjectId(null), 2000);
                              }}
                              title="Copy Link"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              {copiedProjectId === c.name ? <Check size={14} className="text-emerald-600" /> : <LinkIcon size={14} />}
                            </button>
                            
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenu(activeActionMenu === c.name ? null : c.name);
                                }}
                                title="More actions"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              >
                                <MoreHorizontal size={14} />
                              </button>

                              {activeActionMenu === c.name && (
                                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-40 animate-fade-in font-sans">
                                  <button
                                    onClick={() => {
                                      setActiveActionMenu(null);
                                      openStudio(c.name, c.path);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Laptop size={13} />
                                    <span>Open in Studio</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveActionMenu(null);
                                      openCodespace(c.name, c.path);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Code2 size={13} />
                                    <span>Open in IDE</span>
                                  </button>
                                  <div className="my-1 border-t border-slate-100" />
                                  <button
                                    onClick={(e) => {
                                      setActiveActionMenu(null);
                                      handleDelete(e, c.name);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete Project</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ─── COMPACT GRID VIEW ─── */}
            {viewMode === 'grid' && (
              filteredCodespaces.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-xs text-slate-500">
                  No projects available. Create one to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCodespaces.map(c => (
                    <div 
                      key={c.name}
                      onClick={() => openCodespace(c.name, c.path)}
                      className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {c.stack || 'Next.js'}
                        </span>
                        <span className="text-[11px] text-slate-400">{c.fileCount || 0} files</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 truncate">{c.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1 truncate">{c.path}</p>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                        <span>Open Workspace</span>
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ─── LIST VIEW ─── */}
            {viewMode === 'list' && (
              filteredCodespaces.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-xs text-slate-500">
                  No projects available. Create one to get started.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Visibility</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Last Edited</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredCodespaces.map(c => (
                        <tr 
                          key={c.name}
                          onClick={() => openCodespace(c.name, c.path)}
                          className="hover:bg-slate-50/80 cursor-pointer transition"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-[#2e7d32] text-white font-bold text-[10px] flex items-center justify-center">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{c.name}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">Private</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">Active</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">Recently</td>
                          <td className="px-4 py-3 text-right font-semibold text-indigo-600">Open IDE</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </section>

          {/* Footer Information */}
          <footer className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 size={13} />
                <span>NovaDesk Cloud v1.0</span>
              </span>
              <span>•</span>
              <span>Encrypted & OTP Verified</span>
            </div>
            <div>
              <span>AI-Powered Full-Stack Architecture</span>
            </div>
          </footer>

        </div>
      </main>

      {/* ─── WORKSPACE & PROJECT SETTINGS MODAL (Lovable / Windsurf Style) ─── */}
      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />

      {/* ─── AI PROJECT PLANNER AGENT MODAL ─── */}
      <ProjectPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        initialPrompt={promptInput}
        initialTemplate="nextjs"
      />

      {/* ─── AUTONOMOUS PROJECT PROGRESS MONITOR (Web Extension / Dashboard) ─── */}
      <ProjectProgressMonitor
        isOpen={showMonitorModal}
        onClose={() => setShowMonitorModal(false)}
        projectName={codespaces[0]?.name || 'default-project'}
        defaultMode={monitorMode}
      />
    </div>
  );
}

export default HomePage;
