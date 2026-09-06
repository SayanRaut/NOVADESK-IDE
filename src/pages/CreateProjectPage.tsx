import { useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import BackgroundParticles from '../components/animations/BackgroundParticles';
import { 
  ArrowLeft, 
  Sparkles, 
  Code2, 
  Layers, 
  Globe, 
  Terminal, 
  Check, 
  Wand2, 
  Lightbulb
} from 'lucide-react';

export function CreateProjectPage() {
  const { navigateTo, startPrototypeGeneration } = useNavigation();

  const [projectName, setProjectName] = useState('my-nextjs-app');
  const [template, setTemplate] = useState('nextjs');
  const [prompt, setPrompt] = useState(
    'Build a full-stack Next.js 15 SaaS application with user authentication, dashboard analytics, pricing tiers, and modern dark glassmorphic styling.'
  );

  const templates = [
    {
      id: 'nextjs',
      title: 'Next.js 15 Full-Stack',
      desc: 'Next.js 15 App Router, React 19, Tailwind CSS, and edge REST route handlers.',
      icon: Globe,
      color: 'from-lime-400/20 to-emerald-500/20 text-[#c4f042] border-lime-400/30',
    },
    {
      id: 'react',
      title: 'React + Vite',
      desc: 'Modern SPA with React 18, Tailwind CSS, and fast Vite compilation.',
      icon: Code2,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'html',
      title: 'Fullstack Web',
      desc: 'Clean HTML5, Tailwind CSS, and interactive vanilla JavaScript.',
      icon: Globe,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'python',
      title: 'Python Backend',
      desc: 'FastAPI REST service with CORS, Pydantic models, and auto docs.',
      icon: Terminal,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    },
  ];

  const suggestionChips = [
    'Crypto Price Tracker with Real-Time Charts & Dark Mode',
    'SaaS Pricing Calculator with Monthly/Annual Discount Toggle',
    'Kanban Project Task Board with Column Filtering',
    'AI Chat Interface with Streaming Markdown and Code Copy',
    'E-Commerce Product Catalog with Cart and Checkout Modal',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = projectName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (!cleanName) return;

    startPrototypeGeneration({
      name: cleanName,
      template,
      prompt: prompt.trim(),
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 overflow-x-hidden flex flex-col">
      <BackgroundParticles
        particleCount={300}
        particleSpread={15}
        speed={0.12}
        particleColors={['#c4f042', '#38bdf8', '#818cf8']}
        moveParticlesOnHover={false}
        alphaParticles={true}
        particleBaseSize={70}
        cameraDistance={40}
        blurAmount="12px"
      />

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-white/10 bg-slate-950/60 backdrop-blur-xl px-8 h-18 flex items-center justify-between">
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles size={14} className="text-[#c4f042]" />
          <span>NovaDesk AI Project Architect</span>
        </div>
      </header>

      {/* Main Studio */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col gap-8">
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#c4f042]/10 text-[#c4f042] border border-[#c4f042]/30 mb-1">
            <Wand2 size={13} />
            <span>Autonomous Prototyping</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            What do you want to build?
          </h1>
          <p className="text-sm text-slate-400">
            Tell NovaDesk your vision. The AI architect will create the files, design the layout, and launch your working sandbox codespace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Project Details */}
          <div className="rounded-3xl p-7 bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col gap-6 shadow-2xl">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Project Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. crypto-dashboard"
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/15 px-4 text-sm text-white font-mono placeholder:text-slate-600 outline-none focus:border-[#c4f042] transition"
                />
                <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-mono">
                  server_workspaces/{projectName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || '...'}
                </span>
              </div>
            </div>

            {/* Stack Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Select Architecture / Tech Stack
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((t) => {
                  const Icon = t.icon;
                  const isSelected = template === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-white/[0.08] border-[#c4f042] shadow-lg shadow-[#c4f042]/10 ring-1 ring-[#c4f042]/50'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#c4f042] text-black flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center bg-gradient-to-tr ${t.color}`}>
                          <Icon size={18} />
                        </div>
                        <span className="font-bold text-sm text-white">{t.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Prompt Studio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  AI Prompt & Requirements
                </label>
                <span className="text-[11px] text-[#c4f042] flex items-center gap-1 font-medium">
                  <Sparkles size={12} /> Natural Language Driven
                </span>
              </div>

              <textarea
                required
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your prototype in detail: pages, components, color scheme, interactions, and data models..."
                className="w-full rounded-2xl bg-black/50 border border-white/15 p-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-[#c4f042] transition resize-none leading-relaxed"
              />

              {/* Suggestions */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Lightbulb size={13} className="text-amber-400" />
                  <span>Inspiration prompts:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(chip)}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 transition text-left cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Layers size={15} className="text-emerald-400" />
              <span>Creates a dedicated server codespace with instant sandbox execution.</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-extrabold text-sm shadow-xl shadow-lime-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 shrink-0"
            >
              <Sparkles size={18} />
              <span>Generate Prototype with AI ✨</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
