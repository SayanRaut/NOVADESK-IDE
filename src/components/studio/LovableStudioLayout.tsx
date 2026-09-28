import { useState } from 'react';
import { 
  Eye, 
  Code2, 
  RotateCw, 
  Monitor, 
  Smartphone, 
  Share2, 
  Zap, 
  Send, 
  Plus, 
  Mic, 
  Bookmark, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  FileText, 
  Folder, 
  Search, 
  Download, 
  Sparkles, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Bell, 
  ArrowLeft,
  Compass
} from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { ProjectProgressMonitor } from '../monitor/ProjectProgressMonitor';

interface LovableStudioLayoutProps {
  projectName?: string;
  onBack?: () => void;
}

export function LovableStudioLayout({
  projectName = 'Your Financial Hub',
  onBack,
}: LovableStudioLayoutProps) {
  const { navigateTo } = useNavigation();
  const [activeMode, setActiveMode] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedFile, setSelectedFile] = useState('src/pages/Index.tsx');
  const [inputMessage, setInputMessage] = useState('');
  const [isThinkingOpen, setIsThinkingOpen] = useState(true);
  const [showHelpTip, setShowHelpTip] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('Dashboard');
  const [showMonitor, setShowMonitor] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121316] text-slate-100 font-sans overflow-hidden select-none">
      
      {/* ─── TOP BAR (Matches Photos 4 & 5) ─── */}
      <header className="h-12 bg-[#18191d] border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-20">
        
        {/* Left: Project title & Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack || (() => navigateTo('home'))}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft size={16} />
          </button>
          
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
            <span>{projectName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Page Selector */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-slate-300 border border-white/5 cursor-pointer hover:bg-white/10">
            <span>Homepage</span>
            <ChevronDown size={13} className="text-slate-400" />
          </div>
        </div>

        {/* Center: Mode Switcher (Preview vs Code - Photos 4 & 5) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
          <button
            onClick={() => setActiveMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeMode === 'preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>

          <button
            onClick={() => setActiveMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeMode === 'code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 size={13} />
            <span>Code</span>
          </button>
        </div>

        {/* Right: Device toggle, Share, Upgrade, Publish */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/5">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1 rounded ${deviceMode === 'desktop' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'} cursor-pointer`}
              title="Desktop View"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1 rounded ${deviceMode === 'mobile' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'} cursor-pointer`}
              title="Mobile View"
            >
              <Smartphone size={14} />
            </button>
            <button
              className="p-1 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Reload Frame"
            >
              <RotateCw size={14} />
            </button>
          </div>

          <button 
            onClick={() => setShowMonitor(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-300 border border-emerald-500/30 shadow-sm transition cursor-pointer"
            title="Open Autonomous Step Progress Inspector"
          >
            <Compass size={13} className="text-emerald-400 animate-spin-slow" />
            <span>Progress Monitor</span>
          </button>

          <button 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/5 transition cursor-pointer"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>

          <button 
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-900/50 hover:bg-purple-900 border border-purple-500/40 text-xs font-bold text-purple-200 shadow-sm transition cursor-pointer"
          >
            <Zap size={13} className="fill-purple-300" />
            <span>Upgrade</span>
          </button>

          <button 
            className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm transition cursor-pointer"
          >
            Publish
          </button>
        </div>
      </header>

      {/* ─── MAIN WORKSPACE SPLIT ─── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ─── LEFT PANEL: AI Chat Builder (Lovable Style) ─── */}
        <div className="w-80 md:w-96 bg-[#151619] border-r border-white/10 flex flex-col justify-between shrink-0">
          
          {/* Chat Stream & Action Cards Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* User Prompt Message */}
            <div className="flex flex-col items-end">
              <div className="max-w-[85%] bg-white/10 border border-white/10 rounded-2xl rounded-tr-xs p-3 text-xs text-slate-100 shadow-sm leading-relaxed">
                add gradient colors in background with stark iconic style floating in in blur ..
              </div>
            </div>

            {/* Collapsible Thinking Block */}
            <div className="rounded-xl bg-black/40 border border-white/5 overflow-hidden">
              <button
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-400" />
                  <span>Finished thinking</span>
                </div>
                <ChevronRight size={13} className={`transform transition ${isThinkingOpen ? 'rotate-90' : ''}`} />
              </button>

              {isThinkingOpen && (
                <div className="px-3 pb-3 text-xs text-slate-400 border-t border-white/5 pt-2 leading-relaxed font-mono text-[11px]">
                  I'll add floating gradient orbs with blur effects for a striking visual style.
                </div>
              )}
            </div>

            {/* AI Action Card 1: Add floating gradient background */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Add floating gradient background</span>
                <Bookmark size={14} className="text-slate-500 hover:text-white cursor-pointer" />
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 py-1 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/5 transition cursor-pointer">
                  Details
                </button>
                <button className="flex-1 py-1 px-3 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-xs font-bold text-white transition cursor-pointer">
                  Preview
                </button>
              </div>
            </div>

            {/* AI Action Card 2: Applied theme Verdant */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Applied theme Verdant</span>
                <Bookmark size={14} className="text-slate-500 hover:text-white cursor-pointer" />
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 py-1 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/5 transition cursor-pointer">
                  Details
                </button>
                <button className="flex-1 py-1 px-3 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1">
                  <Check size={12} />
                  <span>Previewing</span>
                </button>
              </div>
            </div>

            {/* Floating Help Popover Tooltip (Matches Photo 4) */}
            {showHelpTip && (
              <div className="p-3.5 rounded-2xl bg-[#1e2025] border border-blue-500/30 shadow-lg space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Help moved here</span>
                  <button onClick={() => setShowHelpTip(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    &times;
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Help now lives in the plus menu. Open it whenever you need it.
                </p>
                <button
                  onClick={() => setShowHelpTip(false)}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition cursor-pointer"
                >
                  Got it
                </button>
              </div>
            )}
          </div>

          {/* Bottom Chat Composer Box (Matches Photos 4 & 5) */}
          <div className="p-3 border-t border-white/10 bg-[#18191d] space-y-2">
            {/* Pill */}
            <div className="flex items-center justify-between px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 w-fit">
              <span className="text-[11px] font-medium mr-1.5">Add reference</span>
              <span className="cursor-pointer hover:text-white font-bold">&times;</span>
            </div>

            {/* Input field */}
            <div className="relative flex flex-col gap-2 p-2 rounded-xl bg-black/40 border border-white/10 focus-within:border-blue-500 transition">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Lovable..."
                rows={2}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none resize-none font-sans"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer">
                    <Plus size={15} />
                  </button>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-slate-300 font-semibold cursor-pointer hover:bg-white/10">
                    <span>Build</span>
                    <ChevronDown size={11} className="text-slate-400" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer">
                    <Mic size={15} />
                  </button>
                  <button 
                    disabled={!inputMessage.trim()}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL: Live Preview OR Code Mode ─── */}
        <div className="flex-1 flex overflow-hidden bg-[#0d0e11]">
          
          {activeMode === 'preview' ? (
            /* ══════ PHOTO 4: LIVE APPLICATION PREVIEW (BankFlow Financial Hub) ══════ */
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 bg-[#0f1013]">
              <div className={`mx-auto w-full transition-all ${deviceMode === 'mobile' ? 'max-w-md border-x border-white/10 shadow-2xl my-2 rounded-3xl overflow-hidden' : 'max-w-6xl'} flex flex-col gap-6`}>
                
                {/* BankFlow App Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                      <Wallet size={18} />
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-white">BankFlow</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search transactions, bills, accounts..."
                        className="pl-8 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 outline-none w-64"
                      />
                    </div>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 relative cursor-pointer">
                      <Bell size={16} />
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
                    </button>
                    <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        AJ
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-xs font-bold text-white leading-tight">Alex Johnson</p>
                        <p className="text-[10px] text-slate-500">alex.johnson@email.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Navigation Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['Dashboard', 'Transactions', 'Accounts', 'Budgets', 'Bills', 'Rewards', 'Alerts', 'Settings'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveSubTab(tab)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                        activeSubTab === tab
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Dashboard Heading */}
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">Dashboard</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Welcome back! Here's your financial overview.</p>
                </div>

                {/* 4 Financial Stat Cards (Matches Photo 4) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Balance */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Total Balance</span>
                      <Wallet size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">$184,187.50</h3>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <TrendingUp size={12} />
                        <span>+2.5% from last month</span>
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Monthly Income */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Monthly Income</span>
                      <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">$5,823.45</h3>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <span>+$200 from last month</span>
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Monthly Expenses */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Monthly Expenses</span>
                      <TrendingDown size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">$705.96</h3>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <span>-12% from last month</span>
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Net Cashflow */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold">Net Cashflow</span>
                      <CreditCard size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">$5,117.49</h3>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <span>Positive flow</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your Accounts Section (Matches 4 colored cards in Photo 4) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Your Accounts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Chase Bank (Teal/Emerald Card) */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex flex-col justify-between h-32 shadow-md relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Chase Bank</span>
                        <CreditCard size={18} className="opacity-80" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium opacity-80">Checking ****4821</p>
                        <h4 className="text-xl font-black mt-0.5">$12,847.50</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Available Balance</span>
                      </div>
                    </div>

                    {/* Bank of America (Emerald Card) */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-slate-950 flex flex-col justify-between h-32 shadow-md relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Bank of America</span>
                        <DollarSign size={18} className="opacity-80" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium opacity-80">Savings ****7832</p>
                        <h4 className="text-xl font-black mt-0.5">$45,230.00</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Available Balance</span>
                      </div>
                    </div>

                    {/* American Express (Purple Card) */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex flex-col justify-between h-32 shadow-md relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">American Express</span>
                        <CreditCard size={18} className="opacity-80" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-purple-200">Credit Card ****1234</p>
                        <h4 className="text-xl font-black mt-0.5">-$2,340.00</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">Current Balance Due</span>
                      </div>
                    </div>

                    {/* Fidelity (Cyan Card) */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex flex-col justify-between h-32 shadow-md relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Fidelity</span>
                        <TrendingUp size={18} className="opacity-80" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium opacity-80">Investment ****9876</p>
                        <h4 className="text-xl font-black mt-0.5">$128,450.00</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Available Balance</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Recent Transactions & Budget Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">Recent Transactions</h4>
                      <span className="text-xs text-emerald-400 font-semibold hover:underline cursor-pointer">View All</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <TrendingDown size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Whole Foods</p>
                          <p className="text-[11px] text-slate-400">Food & Dining</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white">-$127.43</p>
                        <p className="text-[10px] text-slate-500">Dec 21, 2024</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">Budget Overview</h4>
                      <span className="text-xs text-emerald-400 font-semibold hover:underline cursor-pointer">Manage</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Food & Dining</span>
                          <span className="text-white font-mono font-bold">$212.68 / $600.00</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-[35%] bg-emerald-400 rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">Shopping</span>
                          <span className="text-white font-mono font-bold">$234.99 / $400.00</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-[58%] bg-cyan-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* ══════ PHOTO 5: CODE EXPLORER + MONACO DIFF VIEW ══════ */
            <div className="flex-1 flex h-full overflow-hidden">
              
              {/* File Tree Explorer Column (Matches Photo 5) */}
              <div className="w-64 bg-[#141518] border-r border-white/10 flex flex-col shrink-0">
                <div className="p-3 border-b border-white/10">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search code"
                      className="w-full pl-7 pr-3 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
                  {/* Public folder */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-400 hover:text-white cursor-pointer">
                    <ChevronDown size={13} />
                    <Folder size={14} className="text-slate-400" />
                    <span>public</span>
                  </div>
                  <div className="pl-6 space-y-1 text-[11px] text-slate-400">
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> favicon.ico</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> placeholder.svg</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> robots.txt</p>
                  </div>

                  {/* Src folder */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-400 hover:text-white cursor-pointer">
                    <ChevronDown size={13} />
                    <Folder size={14} className="text-blue-400" />
                    <span className="font-semibold text-white">src</span>
                  </div>
                  <div className="pl-6 space-y-1 text-[11px] text-slate-400">
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><Folder size={12} /> components</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><Folder size={12} /> context</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><Folder size={12} /> hooks</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><Folder size={12} /> pages</p>
                    <p 
                      onClick={() => setSelectedFile('src/pages/Index.tsx')}
                      className={`cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                        selectedFile === 'src/pages/Index.tsx' ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40' : 'hover:text-white'
                      }`}
                    >
                      <FileText size={12} />
                      <span>Index.tsx</span>
                    </p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> App.css</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> main.tsx</p>
                  </div>

                  {/* Config files */}
                  <div className="pt-2 border-t border-white/5 pl-2 space-y-1 text-[11px] text-slate-400">
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> package.json</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> tailwind.config.ts</p>
                    <p className="hover:text-white cursor-pointer flex items-center gap-1.5"><FileText size={12} /> README.md</p>
                  </div>
                </div>
              </div>

              {/* Code Editor Pane (Photo 5) */}
              <div className="flex-1 flex flex-col h-full bg-[#111215] overflow-hidden">
                <div className="h-9 bg-[#18191d] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-400" />
                      <span>{selectedFile}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Read only</span>
                    <button className="p-1 rounded hover:text-white cursor-pointer" title="Download file">
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                {/* Monaco Editor Code Display with Diff Additions */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
                  <pre className="space-y-0.5">
                    <code>
                      <span className="text-slate-600 select-none mr-4">1</span><span className="text-purple-400">import</span> &#123; DashboardLayout &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">"@/components/layout/DashboardLayout"</span>;<br/>
                      <span className="text-slate-600 select-none mr-4">2</span><span className="text-purple-400">import</span> &#123; StatCard &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">"@/components/dashboard/StatCard"</span>;<br/>
                      <span className="text-slate-600 select-none mr-4">3</span><span className="text-purple-400">import</span> &#123; AccountCard &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">"@/components/dashboard/AccountCard"</span>;<br/>
                      <span className="text-slate-600 select-none mr-4">4</span><span className="text-purple-400">import</span> &#123; RecentTransactions &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">"@/components/dashboard/RecentTransactions"</span>;<br/>
                      <span className="text-slate-600 select-none mr-4">5</span><span className="text-purple-400">import</span> &#123; SpendingChart &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">"@/components/dashboard/SpendingChart"</span>;<br/>
                      <span className="text-slate-600 select-none mr-4">6</span><span className="text-purple-400">import</span> &#123; useBanking &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">"@/context/BankingContext"</span>;<br/>
                      <span className="text-slate-600 select-none mr-4">7</span><span className="text-purple-400">import</span> &#123; Wallet, TrendingUp, CreditCard &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">"lucide-react"</span>;<br/>
                      <span className="text-slate-600 select-none mr-4">8</span><br/>
                      {/* Diff highlight line */}
                      <div className="bg-emerald-950/40 border-l-2 border-emerald-500 py-0.5 -mx-4 px-4 text-emerald-200">
                        <span className="text-emerald-500 select-none mr-3">+</span><span className="text-purple-400">const</span> <span className="text-yellow-300">Dashboard</span> = () =&gt; &#123;
                      </div>
                      <span className="text-slate-600 select-none mr-4">10</span>  <span className="text-purple-400">const</span> &#123;<br/>
                      <span className="text-slate-600 select-none mr-4">11</span>    accounts,<br/>
                      <span className="text-slate-600 select-none mr-4">12</span>    transactions,<br/>
                      <span className="text-slate-600 select-none mr-4">13</span>    budgets,<br/>
                      <span className="text-slate-600 select-none mr-4">14</span>    monthlyIncome,<br/>
                      <span className="text-slate-600 select-none mr-4">15</span>    monthlyExpenses<br/>
                      <span className="text-slate-600 select-none mr-4">16</span>  &#125; = <span className="text-yellow-300">useBanking</span>();<br/>
                      <span className="text-slate-600 select-none mr-4">17</span><br/>
                      <span className="text-slate-600 select-none mr-4">18</span>  <span className="text-purple-400">return</span> (<br/>
                      <span className="text-slate-600 select-none mr-4">19</span>    &lt;<span className="text-blue-400">DashboardLayout</span>&gt;<br/>
                      <span className="text-slate-600 select-none mr-4">20</span>      &lt;<span className="text-blue-400">div</span> <span className="text-cyan-300">className</span>=<span className="text-emerald-300">"space-y-6"</span>&gt;<br/>
                      <span className="text-slate-600 select-none mr-4">21</span>        &lt;<span className="text-blue-400">h1</span> <span className="text-cyan-300">className</span>=<span className="text-emerald-300">"text-3xl font-bold"</span>&gt;Dashboard&lt;/<span className="text-blue-400">h1</span>&gt;<br/>
                      <span className="text-slate-600 select-none mr-4">22</span>      &lt;/<span className="text-blue-400">div</span>&gt;<br/>
                      <span className="text-slate-600 select-none mr-4">23</span>    &lt;/<span className="text-blue-400">DashboardLayout</span>&gt;<br/>
                      <span className="text-slate-600 select-none mr-4">24</span>  );<br/>
                      <span className="text-slate-600 select-none mr-4">25</span>&#125;;<br/>
                    </code>
                  </pre>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      <ProjectProgressMonitor
        isOpen={showMonitor}
        onClose={() => setShowMonitor(false)}
        projectName={projectName}
        defaultMode="extension"
      />
    </div>
  );
}
