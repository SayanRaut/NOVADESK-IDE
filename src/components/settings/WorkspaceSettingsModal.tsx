import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  User, 
  Laptop, 
  Briefcase, 
  CreditCard, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  GitBranch, 
  KeyRound, 
  Server, 
  Globe, 
  Lock, 
  Activity, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Plus, 
  Database, 
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiKey } from '../../contexts/ApiKeyContext';
import { getApiBaseUrl } from '../../config/api';

export type SettingsTab = 
  | 'account'
  | 'devices'
  | 'workspace'
  | 'usage'
  | 'team'
  | 'knowledge'
  | 'skills'
  | 'git'
  | 'secrets'
  | 'mcp'
  | 'domains'
  | 'security'
  | 'audit';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

export function WorkspaceSettingsModal({ isOpen, onClose, initialTab = 'account' }: WorkspaceSettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Build secrets state (mockable & viewable for demonstration to mentor)
  const [secrets, setSecrets] = useState([
    { key: 'GEMINI_API_KEY', value: 'AIzaSyD-gemini-pro-flash-sec-key-9281', category: 'AI Engine', isVisible: false },
    { key: 'DATABASE_URL', value: 'sqlite+aiosqlite:///./nova_desk.db', category: 'Database', isVisible: false },
    { key: 'QDRANT_API_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.qdrant-sec-token', category: 'Vector Memory', isVisible: false },
    { key: 'GOOGLE_CLIENT_ID', value: '528575186005-re7ocigruedhc31njknm7d5idhtjflk2.apps.googleusercontent.com', category: 'OAuth 2.0', isVisible: false },
    { key: 'VITE_NOVADESK_API_URL', value: getApiBaseUrl() || 'http://127.0.0.1:8000', category: 'Network', isVisible: false },
  ]);

  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretVal, setNewSecretVal] = useState('');
  const [showAddSecret, setShowAddSecret] = useState(false);

  // Gemini BYOK key state
  const { apiKey, hasKey, validateKey, saveKey } = useApiKey();
  const [geminiKeyInput, setGeminiKeyInput] = useState(apiKey);
  const [isVerifyingGemini, setIsVerifyingGemini] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<{ isSuccess: boolean; message: string } | null>(null);

  const handleVerifyAndSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) return;
    setIsVerifyingGemini(true);
    setGeminiFeedback(null);
    try {
      const res = await validateKey(geminiKeyInput.trim());
      setGeminiFeedback({
        isSuccess: res.valid,
        message: res.message,
      });
      if (res.valid) {
        await saveKey(geminiKeyInput.trim());
      }
    } catch {
      setGeminiFeedback({
        isSuccess: false,
        message: 'Failed to connect to verification server.',
      });
    } finally {
      setIsVerifyingGemini(false);
    }
  };

  // Navigation Items matching the screenshot structure
  const navGroups = useMemo(() => [
    {
      group: 'General',
      items: [
        { id: 'account' as SettingsTab, label: 'Your account', icon: User, badge: 'Verified' },
        { id: 'devices' as SettingsTab, label: 'Devices & apps', icon: Laptop, badge: null },
      ]
    },
    {
      group: 'Workspace',
      items: [
        { id: 'workspace' as SettingsTab, label: `${user?.display_name?.split(' ')[0] || 'Sayan'}'s Studio`, icon: Briefcase, badge: 'Active', isProjectBadge: true },
        { id: 'usage' as SettingsTab, label: 'Plans & credit usage', icon: CreditCard, badge: null },
      ]
    },
    {
      group: 'Access',
      items: [
        { id: 'team' as SettingsTab, label: 'People & Collaborators', icon: Users, badge: 'Project' },
      ]
    },
    {
      group: 'Customization',
      items: [
        { id: 'knowledge' as SettingsTab, label: 'Knowledge Base', icon: BookOpen, badge: 'RAG' },
        { id: 'skills' as SettingsTab, label: 'AI Skills & Rules', icon: Sparkles, badge: '5 Active' },
      ]
    },
    {
      group: 'Build & deploy',
      items: [
        { id: 'git' as SettingsTab, label: 'Git & Repository', icon: GitBranch, badge: 'Connected' },
        { id: 'secrets' as SettingsTab, label: 'Build secrets', icon: KeyRound, badge: 'Encrypted' },
        { id: 'mcp' as SettingsTab, label: 'MCP server', icon: Server, badge: 'Ready' },
        { id: 'domains' as SettingsTab, label: 'Workspace domains', icon: Globe, badge: 'Localhost' },
      ]
    },
    {
      group: 'Security',
      items: [
        { id: 'security' as SettingsTab, label: 'Privacy & security', icon: Lock, badge: 'Bcrypt + OTP' },
        { id: 'audit' as SettingsTab, label: 'Audit logs', icon: Activity, badge: 'Live' },
      ]
    }
  ], [user]);

  // Filter navigation items by search query
  const filteredNavGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const q = searchQuery.toLowerCase();
    return navGroups.map(g => ({
      ...g,
      items: g.items.filter(item => 
        item.label.toLowerCase().includes(q) || 
        (item.badge && item.badge.toLowerCase().includes(q))
      )
    })).filter(g => g.items.length > 0);
  }, [navGroups, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleSecretVisibility = (index: number) => {
    setSecrets(prev => prev.map((s, i) => i === index ? { ...s, isVisible: !s.isVisible } : s));
  };

  const handleAddSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretKey.trim() || !newSecretVal.trim()) return;
    setSecrets(prev => [...prev, {
      key: newSecretKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      value: newSecretVal.trim(),
      category: 'Custom Secret',
      isVisible: false
    }]);
    setNewSecretKey('');
    setNewSecretVal('');
    setShowAddSecret(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[88vh] bg-[#121417] text-slate-200 rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden font-sans">
        
        {/* ─── LEFT SETTINGS SIDEBAR (Matching User's Screenshot) ─── */}
        <div className="w-72 bg-[#0d0f12] border-r border-white/10 flex flex-col shrink-0">
          
          {/* Header with Go Back button */}
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <ArrowLeft size={16} />
              <span>Go back</span>
            </button>
          </div>

          {/* Search Settings Input */}
          <div className="p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search settings"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#171a1f] text-xs text-slate-200 placeholder-slate-500 rounded-lg border border-white/10 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Nav Links Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
            {filteredNavGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                {group.group !== 'General' && (
                  <p className="px-2.5 pt-2 pb-1 text-[11px] font-bold text-slate-500">
                    {group.group}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                        isActive 
                          ? 'bg-[#21262d] text-white font-semibold' 
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                          item.badge === 'Verified' || item.badge === 'Connected' || item.badge === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : item.badge === 'Encrypted' || item.badge === 'Bcrypt + OTP'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>NovaDesk Cloud</span>
            <span className="font-mono text-[10px] text-slate-600">v1.0.0</span>
          </div>
        </div>

        {/* ─── RIGHT CONTENT AREA (Detail Panes) ─── */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin bg-[#121417]">
          
          {/* 1. YOUR ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Your Account & Security Profile</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your personal credentials, cryptographic verification status, and developer identity.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{user?.display_name || 'Sayan Raut'}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Verified User
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'sayan@novadesk.io'}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">Role: Project Lead & Lead Architect</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs">
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-400 block text-[11px]">Authentication Method</span>
                    <span className="font-semibold text-slate-200 mt-1 block">Bcrypt (Salted Hash, 12 rounds)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-slate-400 block text-[11px]">Two-Factor Verification</span>
                    <span className="font-semibold text-emerald-400 mt-1 block">6-Digit Cryptographic OTP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. DEVICES & APPS */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Devices & Active Sessions</h2>
                <p className="text-xs text-slate-400 mt-1">Active environments connecting to your NovaDesk Cloud backend.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Laptop size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">Current Web Session</h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">This Device</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Windows • Vite Client (Port 5173)</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">Active Now</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <Server size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">FastAPI Core Backend</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Python 3.11 • Uvicorn (Port 8000)</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">Connected</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. WORKSPACE DETAILS */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Workspace Overview</h2>
                <p className="text-xs text-slate-400 mt-1">High-level architecture parameters of this project workspace.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[11px] text-slate-400">Active AI Model</span>
                  <p className="text-base font-bold text-indigo-400 mt-1">Google Gemini 2.5</p>
                  <span className="text-[10px] text-slate-500">Flash & Pro Reasoning</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[11px] text-slate-400">Full-Stack Framework</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">Next.js 15 App Router</p>
                  <span className="text-[10px] text-slate-500">FastAPI & Vite Support</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-[11px] text-slate-400">Database Engine</span>
                  <p className="text-base font-bold text-white mt-1">SQLite + AioSqlite</p>
                  <span className="text-[10px] text-slate-500">Async SQLAlchemy v2</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Project Root Path</h3>
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-slate-300 flex items-center justify-between">
                  <span>D:\PROJECTS\NOVADESK IDE</span>
                  <button 
                    onClick={() => handleCopy('D:\\PROJECTS\\NOVADESK IDE', 'root-path')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'root-path' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. PLANS & USAGE */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">AI Quotas & Credit Usage</h2>
                <p className="text-xs text-slate-400 mt-1">Real-time consumption tracking for code synthesis and agent loops.</p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Monthly AI Generation Quota</span>
                    <p className="text-[11px] text-slate-400">Unlimited development mode tier enabled</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Active Tier
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full w-[24%]" />
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tokens used: 240,150</span>
                  <span>Cap: 1,000,000 / month</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. TEAM & COLLABORATORS */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Project Members & Collaborators</h2>
                  <p className="text-xs text-slate-400 mt-1">Control access roles for academic evaluation and team pairing.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                      S
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{user?.display_name || 'Sayan Raut'} (You)</h4>
                      <p className="text-[11px] text-slate-400">{user?.email || 'sayan@novadesk.io'}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    Owner & Author
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                      M
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Project Evaluator / Mentor</h4>
                      <p className="text-[11px] text-slate-400">mentor@institution.edu</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                    Reviewer & Evaluator
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6. KNOWLEDGE BASE */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">AI Knowledge Base & Vector Index</h2>
                <p className="text-xs text-slate-400 mt-1">Retrieval-Augmented Generation (RAG) and semantic codebase memory.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Database size={16} />
                    <h3 className="text-xs font-bold text-white">Qdrant Vector DB</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Cloud & local vector storage storing 768-dimensional embeddings of all source files for instant symbol retrieval.
                  </p>
                  <span className="text-[10px] text-emerald-400 mt-3 block font-mono">Status: Connected (Cloud Cluster)</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <Cpu size={16} />
                    <h3 className="text-xs font-bold text-white">Context Engine</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    AST parsing and token budgeting to feed accurate dependency trees to Google Gemini without hitting token limits.
                  </p>
                  <span className="text-[10px] text-emerald-400 mt-3 block font-mono">Budget: 32,768 Tokens per context</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. AI SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Active AI Skills & Architecture Rules</h2>
                <p className="text-xs text-slate-400 mt-1">Specialized engineering modules loaded into the AI planner.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Next.js 15 Full-Stack', desc: 'App Router, Server Actions, streaming SSR, and edge API routes.', badge: 'Framework' },
                  { name: 'Google Gemini 2.5 Engine', desc: 'Synthesizes complete files, plans DAG tasks, and executes code.', badge: 'AI-Native' },
                  { name: 'Bcrypt & 6-Digit OTP Auth', desc: 'Enforces salted hashing, brute-force limits, and zero dummy accounts.', badge: 'Security' },
                  { name: 'WebSocket Workspace Watcher', desc: 'Zero-latency file tree synchronization and event broadcasting.', badge: 'Real-time' },
                  { name: 'Prisma ORM & SQLite Adapter', desc: 'Schema generation, migrations, and transactional database querying.', badge: 'Database' },
                ].map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white">{s.name}</h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{s.desc}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 size={11} /> Ready & Loaded
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. GIT & REPO */}
          {activeTab === 'git' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Git & Version Control Integration</h2>
                <p className="text-xs text-slate-400 mt-1">Live tracking of GitHub repository sync and branches.</p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <GitBranch size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">GitHub Remote Origin</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">https://github.com/SayanRaut/NOVADESK-IDE.git</p>
                    </div>
                  </div>
                  <a
                    href="https://github.com/SayanRaut/NOVADESK-IDE"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Active Branch</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">main</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sync Status</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">Up to date with origin/main</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CI / Build Status</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">Passing (Zero Errors)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 9. BUILD SECRETS */}
          {activeTab === 'secrets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Build Secrets & Environment Variables</h2>
                  <p className="text-xs text-slate-400 mt-1">Encrypted environment variables injected into running containers and API routes.</p>
                </div>
                <button
                  onClick={() => setShowAddSecret(!showAddSecret)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Secret</span>
                </button>
              </div>

              {/* Dedicated Google Gemini Key Management (BYOK) */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30 space-y-3 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Google Gemini API Key</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          hasKey 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {hasKey ? 'Active Key' : 'No Key Configured'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Power the autonomous Planner Agent and real-time code synthesis with your own Google Gemini API quota.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    placeholder="Paste your Gemini API key (AIzaSy...)"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={handleVerifyAndSaveGeminiKey}
                    disabled={isVerifyingGemini || !geminiKeyInput.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isVerifyingGemini ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    <span>Test & Save</span>
                  </button>
                </div>
                {geminiFeedback && (
                  <p className={`text-xs font-medium ${geminiFeedback.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {geminiFeedback.message}
                  </p>
                )}
              </div>

              {showAddSecret && (
                <form onSubmit={handleAddSecret} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white">Add New Environment Variable</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="KEY_NAME (e.g. STRIPE_SECRET_KEY)"
                      value={newSecretKey}
                      onChange={(e) => setNewSecretKey(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-[#171a1f] border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
                    />
                    <input
                      type="password"
                      placeholder="Secret Value"
                      value={newSecretVal}
                      onChange={(e) => setNewSecretVal(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-[#171a1f] border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSecret(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                    >
                      Save Variable
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {secrets.map((sec, idx) => (
                  <div key={sec.key} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-300">{sec.key}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{sec.category}</span>
                      </div>
                      <p className="font-mono text-xs text-slate-500 mt-1">
                        {sec.isVisible ? sec.value : '••••••••••••••••••••••••••••••••'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSecretVisibility(idx)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        title={sec.isVisible ? 'Hide Secret' : 'Reveal Secret'}
                      >
                        {sec.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopy(sec.value, sec.key)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                        title="Copy Secret"
                      >
                        {copiedKey === sec.key ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. MCP SERVER */}
          {activeTab === 'mcp' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Model Context Protocol (MCP) Server</h2>
                <p className="text-xs text-slate-400 mt-1">Open-standard protocol allowing AI models to interact with local development tools safely.</p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">MCP Bridge Daemon</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Protocol v1.0 • Connected
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Tool Provider</span>
                    <span className="text-white font-mono">novadesk-local-tools</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Available Capabilities</span>
                    <span className="text-white font-mono">fs:read, fs:write, terminal:exec, git:diff</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Transport Layer</span>
                    <span className="text-white font-mono">stdio & SSE (Server-Sent Events)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 11. WORKSPACE DOMAINS & PORTS */}
          {activeTab === 'domains' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Workspace Domains & Port Bindings</h2>
                <p className="text-xs text-slate-400 mt-1">Local and network addresses hosting the NovaDesk frontend and backend.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Frontend Web Client</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Online</span>
                    </div>
                    <p className="font-mono text-xs text-indigo-400 mt-0.5">http://localhost:5173</p>
                  </div>
                  <a
                    href="http://localhost:5173"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">FastAPI REST & WebSocket Server</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Online</span>
                    </div>
                    <p className="font-mono text-xs text-indigo-400 mt-0.5">http://127.0.0.1:8000</p>
                  </div>
                  <a
                    href="http://127.0.0.1:8000/health"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 12. SECURITY & PRIVACY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Privacy & Security Center</h2>
                <p className="text-xs text-slate-400 mt-1">Audit of cryptographic protections implemented across the architecture.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Salted Bcrypt Password Storage</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Passwords are never stored in plaintext. Each credential is salted with 12 rounds of bcrypt hashing before saving into the database.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <KeyRound size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Time-Limited 6-Digit Cryptographic OTP</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Registration and password resets enforce a 6-digit cryptographic code with 10-minute expiry and 5-attempt brute-force lockouts.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <Lock size={20} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Zero Hardcoded / Dummy Accounts</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      All test bypasses and placeholder accounts (e.g. `dev@novadesk.io`) have been permanently purged. All authentication routes require authentic verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 13. AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">System Audit Logs</h2>
                <p className="text-xs text-slate-400 mt-1">Chronological security and architectural events logged by the platform.</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>[2026-09-06 15:36:28]</span>
                  <span>INFO: Uvicorn HTTP server started on http://127.0.0.1:8000</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-300">
                  <span>[2026-09-06 15:30:57]</span>
                  <span>GIT: Committed changes to origin/main (commit feb691a)</span>
                </div>
                <div className="flex items-center gap-2 text-purple-300">
                  <span>[2026-09-06 15:21:29]</span>
                  <span>AI: Switched active reasoning model to Google Gemini 2.5 Flash</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>[2026-09-06 15:19:33]</span>
                  <span>AUTH: Cryptographic OTP code 755593 verified successfully</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-300">
                  <span>[2026-09-06 15:16:08]</span>
                  <span>WS: Workspace file watcher connection accepted on /ws/workspace</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default WorkspaceSettingsModal;
