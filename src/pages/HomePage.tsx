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
  LogOut, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  Code2,
  BookOpen
} from 'lucide-react';

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
  const { openCodespace, startPrototypeGeneration, navigateTo } = useNavigation();
  const { user, logout } = useAuth();
  
  const [codespaces, setCodespaces] = useState<CodespaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'templates'>('dashboard');

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

  // Filtered codespaces based on search query
  const filteredCodespaces = useMemo(() => {
    if (!searchQuery.trim()) return codespaces;
    const q = searchQuery.toLowerCase();
    return codespaces.filter(c => c.name.toLowerCase().includes(q) || c.stack.toLowerCase().includes(q));
  }, [codespaces, searchQuery]);

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
        <div className="p-3">
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

          <div className="pt-4 mt-2 border-t border-slate-100">
            {!sidebarCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Workspace
              </p>
            )}

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

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className={`flex items-center justify-between ${sidebarCollapsed ? 'flex-col gap-2' : ''}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.display_name || 'Developer'}
                    </p>
                    <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || 'Cloud Account'}</p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Ready</span>
            </div>

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

          {/* ─── MY PROJECTS / CODESPACES SECTION ─── */}
          <section ref={projectsSectionRef} className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <FolderCode size={20} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">My Projects & Workspaces</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {filteredCodespaces.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchCodespaces}
                  title="Reload Projects"
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition cursor-pointer"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={() => handleCreateBlank('nextjs')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Workspace</span>
                </button>
              </div>
            </div>

            {/* Grid of Project Cards */}
            {isLoading && codespaces.length === 0 ? (
              <div className="p-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center gap-3 text-slate-500 text-xs font-medium">
                <RefreshCw size={16} className="animate-spin text-indigo-600" />
                <span>Loading your workspaces...</span>
              </div>
            ) : filteredCodespaces.length === 0 ? (
              <div className="p-12 rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <FolderCode size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {searchQuery ? 'No matching projects found' : 'No projects created yet'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                    {searchQuery 
                      ? `Try searching for another keyword or clear the search input.`
                      : 'Generate your first full-stack application using the prompt generator above, or create a blank sandbox.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => handleCreateBlank('nextjs')}
                    className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
                  >
                    Create Starter Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCodespaces.map((c) => {
                  const isNext = c.stack?.toLowerCase().includes('next') || c.name.includes('next') || c.name.includes('web-app');
                  const isPython = c.stack?.toLowerCase().includes('python');

                  return (
                    <div
                      key={c.name}
                      onClick={() => openCodespace(c.name, c.path)}
                      className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            isNext 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                              : isPython
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isNext ? 'Full-Stack' : isPython ? 'FastAPI' : 'React'}
                          </span>

                          <button
                            onClick={(e) => handleDelete(e, c.name)}
                            title="Delete Project"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {c.name}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                          {c.path}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>{c.fileCount || 0} files</span>
                        </span>

                        <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>Open IDE</span>
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Quick Add Sandbox Card */}
                <div
                  onClick={() => handleCreateBlank('nextjs')}
                  className="group bg-white/60 hover:bg-white p-5 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-[150px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Create Blank Sandbox</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Start fresh from an empty template</p>
                  </div>
                </div>
              </div>
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
    </div>
  );
}

export default HomePage;
