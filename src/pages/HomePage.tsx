import { useEffect, useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../config/api';
import BackgroundParticles from '../components/animations/BackgroundParticles';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Code2, 
  Terminal, 
  Layers, 
  LogOut, 
  RefreshCw, 
  FolderCode, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Clock,
  ChevronRight
} from 'lucide-react';

interface CodespaceItem {
  name: string;
  path: string;
  fileCount: number;
  stack: string;
  updatedAt: number;
  isActive: boolean;
}

export function HomePage() {
  const { openCodespace, startPrototypeGeneration } = useNavigation();
  const { user, logout } = useAuth();
  const [codespaces, setCodespaces] = useState<CodespaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);

  // Central Lovable-style Generation Bar State
  const [promptInput, setPromptInput] = useState('');
  const [selectedStack, setSelectedStack] = useState<'nextjs' | 'react' | 'python' | 'html'>('nextjs');
  const [selectedModel, setSelectedModel] = useState<'Gemini 2.5 Flash' | 'Gemini 2.5 Pro'>('Gemini 2.5 Flash');

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

  const handleCreateBlank = async (template = 'nextjs') => {
    setIsCreatingBlank(true);
    try {
      const prefix = template === 'nextjs' ? 'next-app' : 'codespace';
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

    // Generate project name from prompt
    const slug = cleanPrompt
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .slice(0, 3)
      .join('-');
    const projectName = `${slug || 'fullstack-app'}-${Math.random().toString(36).slice(2, 6)}`;

    startPrototypeGeneration({
      name: projectName,
      template: selectedStack,
      prompt: cleanPrompt,
    });
  };

  const handleDelete = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete codespace "${name}"? This cannot be undone.`)) return;
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

  const promptSuggestions = [
    { label: 'Next.js 15 SaaS with Auth & Database', stack: 'nextjs', prompt: 'Build a full-stack Next.js 15 SaaS app with user authentication, dashboard analytics, pricing tiers, and modern dark glassmorphism.' },
    { label: 'E-Commerce Store with Cart & Checkout', stack: 'nextjs', prompt: 'Create an e-commerce storefront in Next.js 15 with product catalog, filtering, dynamic shopping cart drawer, and checkout summary.' },
    { label: 'Real-Time WebSocket Chat Application', stack: 'nextjs', prompt: 'Build a real-time chat application with WebSocket streaming, channel switching, user presence indicator, and syntax-highlighted code sharing.' },
    { label: 'Interactive Crypto Portfolio Tracker', stack: 'react', prompt: 'Build an interactive cryptocurrency dashboard with live price ticker cards, sparkline charts, and dark modern styling.' },
    { label: 'FastAPI Microservice with REST Endpoints', stack: 'python', prompt: 'Scaffold a Python FastAPI service with Pydantic v2 models, JWT authentication, CORS middleware, and automated OpenAPI docs.' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 overflow-x-hidden flex flex-col selection:bg-lime-400 selection:text-black">
      {/* Background Ambience */}
      <BackgroundParticles
        particleCount={300}
        particleSpread={15}
        speed={0.14}
        particleColors={['#c4f042', '#38bdf8', '#a855f7']}
        moveParticlesOnHover={false}
        alphaParticles={true}
        particleBaseSize={75}
        cameraDistance={38}
        blurAmount="12px"
      />

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full border-b border-white/10 bg-slate-950/75 backdrop-blur-xl px-6 lg:px-12 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center text-black font-extrabold shadow-lg shadow-lime-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">NovaDesk</span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-lime-400/20 text-[#c4f042] border border-lime-400/30">
                Full-Stack Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Lovable & Windsurf-Style AI Architecture</p>
          </div>
        </div>

        {/* Center Pill: Active LLM Model */}
        <button
          type="button"
          onClick={() => setSelectedModel(selectedModel === 'Gemini 2.5 Flash' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash')}
          title="Click to switch Gemini model"
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span className="font-semibold text-white">{selectedModel}</span>
          <span className="text-[10px] text-slate-500">• Switch Model</span>
        </button>

        {/* Right Side: Status & Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <Zap size={13} className="text-emerald-400" />
            <span>WebSockets Live</span>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-lime-400 to-emerald-500 text-black font-bold text-xs flex items-center justify-center shadow-md shadow-lime-500/20 shrink-0">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1.5 justify-end">
                <p className="text-xs font-bold text-white">{user?.display_name || 'Developer'}</p>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Verified
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user?.email || 'Cloud Account'}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer border border-white/5"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-10 flex flex-col gap-12">
        
        {/* HERO + LOVABLE AI CREATOR BAR */}
        <div className="flex flex-col items-center text-center gap-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/25 text-xs text-lime-400 backdrop-blur-md">
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '8s' }} />
            <span className="font-semibold">Fullstack Web App Studio • Powered by Gemini 2.5</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.15]">
            Build full-stack web applications at the{' '}
            <span className="bg-gradient-to-r from-[#c4f042] via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              speed of thought
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
            Prompt your vision. NovaDesk synthesizes Next.js 15 App Router architecture, UI components, and API routes in real-time.
          </p>

          {/* Central Interactive Console (Lovable Style) */}
          <form 
            onSubmit={handleLaunchPrompt}
            className="w-full max-w-3xl mt-2 p-3 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col gap-3 focus-within:border-lime-400/50 transition-all duration-300"
          >
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleLaunchPrompt();
                }
              }}
              placeholder="What full-stack application do you want to build? (e.g. Build a SaaS landing page with dark mode, user auth, and pricing calculator...)"
              className="w-full bg-transparent px-4 py-3 text-sm sm:text-base text-white placeholder-slate-500 outline-none resize-none leading-relaxed"
            />

            {/* Controls Row: Stack Selector & Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 px-2 border-t border-white/10">
              {/* Stack Selector Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedStack('nextjs')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedStack === 'nextjs'
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-black shadow-md shadow-lime-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe size={13} />
                  <span>Next.js 15 (Recommended)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStack('react')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedStack === 'react'
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-black shadow-md shadow-lime-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 size={13} />
                  <span>React + Vite</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStack('python')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedStack === 'python'
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-black shadow-md shadow-lime-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal size={13} />
                  <span>FastAPI</span>
                </button>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-extrabold text-xs shadow-lg shadow-lime-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer ml-auto"
              >
                <Sparkles size={15} />
                <span>Generate Application</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Inspiration Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Inspirations:</span>
            {promptSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPromptInput(item.prompt);
                  setSelectedStack(item.stack as any);
                }}
                className="text-[11px] font-medium px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-lime-300 border border-white/10 hover:border-lime-400/30 transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* CODESPACES & PROJECTS DASHBOARD */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <FolderCode size={20} className="text-lime-400" />
              <h2 className="text-xl font-bold tracking-tight text-white">Your Cloud Codespaces</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono">
                {codespaces.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchCodespaces}
                title="Refresh Codespaces"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer border border-white/10"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => handleCreateBlank('nextjs')}
                disabled={isCreatingBlank}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition cursor-pointer shadow-sm"
              >
                <Plus size={15} />
                <span>{isCreatingBlank ? 'Creating...' : 'New Next.js Codespace'}</span>
              </button>
            </div>
          </div>

          {/* Grid of Codespace Cards */}
          {isLoading && codespaces.length === 0 ? (
            <div className="p-12 rounded-3xl border border-white/10 bg-white/[0.02] flex items-center justify-center gap-3 text-slate-400 text-sm">
              <RefreshCw size={18} className="animate-spin text-lime-400" />
              <span>Connecting to cloud storage...</span>
            </div>
          ) : codespaces.length === 0 ? (
            <div className="p-12 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                <FolderCode size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">No Active Codespaces Yet</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Enter a prompt above to generate a full-stack Next.js web application, or create a blank codespace to code manually.
                </p>
              </div>
              <button
                onClick={() => handleCreateBlank('nextjs')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-bold text-xs shadow-lg shadow-lime-500/20 hover:scale-[1.02] transition cursor-pointer"
              >
                Create Next.js 15 Starter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {codespaces.map((c) => {
                const isNext = c.stack?.toLowerCase().includes('next') || c.name.includes('next');
                const isPython = c.stack?.toLowerCase().includes('python');

                return (
                  <div
                    key={c.name}
                    onClick={() => openCodespace(c.name, c.path)}
                    className="group relative overflow-hidden rounded-3xl p-6 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-lime-400/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${
                          isNext 
                            ? 'bg-lime-400/10 text-lime-400 border-lime-400/20' 
                            : isPython
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                            : 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                        }`}>
                          {isNext ? 'Next.js 15' : isPython ? 'FastAPI' : 'React Vite'}
                        </span>

                        <button
                          onClick={(e) => handleDelete(e, c.name)}
                          title="Delete Codespace"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Project Name & Path */}
                      <h3 className="text-base font-bold text-white group-hover:text-lime-300 transition-colors truncate">
                        {c.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                        {c.path}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{c.fileCount || 0} files</span>
                      </span>

                      <span className="font-bold text-lime-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Launch IDE</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Create Next.js Quick Card */}
              <div
                onClick={() => handleCreateBlank('nextjs')}
                className="group relative overflow-hidden rounded-3xl p-6 border border-dashed border-white/15 hover:border-lime-400/40 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[170px]"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lime-400 group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Create New Sandbox</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Scaffold an empty Next.js project</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM STATUS FOOTER (Windsurf & Lovable Vibe) */}
        <footer className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Cpu size={13} className="text-lime-400" />
              <span>Model: Google Gemini 2.5 Flash</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Globe size={13} className="text-cyan-400" />
              <span>Framework: Next.js 15 App Router</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Security: Bcrypt + OTP Verified</span>
            </span>
          </div>
          <div>
            <span>NovaDesk Cloud Architecture • Production Ready</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
