import React, { useState } from "react";
import { ExternalLink, Code2, Sparkles, Star, Play, Terminal, Layers } from "lucide-react";

const PROJECTS = [
  {
    id: "saas-analytics",
    title: "MetricsHub - SaaS Analytics",
    category: "SaaS",
    description: "Real-time subscription metrics, revenue forecasting, churn analytics, and automated cohort reports.",
    tech: ["React 19", "Tailwind CSS", "Recharts", "Supabase"],
    stars: "1.4k",
    prompt: "Build an enterprise SaaS analytics dashboard with revenue charts and churn breakdown",
    gradient: "from-blue-600/20 to-indigo-600/20",
    accentColor: "border-blue-500/40 text-blue-400"
  },
  {
    id: "ai-copilot",
    title: "PromptDesk - AI Studio",
    category: "AI/ML",
    description: "Multi-modal prompt playground with history, side-by-side model comparison, and token usage tracking.",
    tech: ["Next.js 15", "Tailwind CSS", "OpenAI API", "Zustand"],
    stars: "2.8k",
    prompt: "Create an AI studio interface with side-by-side model outputs and streaming response support",
    gradient: "from-violet-600/20 to-purple-600/20",
    accentColor: "border-violet-500/40 text-violet-400"
  },
  {
    id: "ecommerce",
    title: "VibeStore - Modern E-Commerce",
    category: "E-Commerce",
    description: "Ultra-fast headless shop with dynamic filter sidebar, sliding cart drawer, and Stripe checkout.",
    tech: ["React", "Tailwind CSS", "Stripe SDK", "Framer Motion"],
    stars: "950",
    prompt: "Design a high-converting minimalist fashion store with cart drawer and filterable grid",
    gradient: "from-emerald-600/20 to-teal-600/20",
    accentColor: "border-emerald-500/40 text-emerald-400"
  },
  {
    id: "devtools",
    title: "KanbanPulse - Agile Workspace",
    category: "DevTools",
    description: "Collaborative project management board with drag-and-drop swimlanes, subtasks, and time tracking.",
    tech: ["React", "Tailwind CSS", "dnd-kit", "WebSockets"],
    stars: "1.9k",
    prompt: "Build a drag-and-drop kanban board with custom status columns and task modal details",
    gradient: "from-amber-600/20 to-orange-600/20",
    accentColor: "border-amber-500/40 text-amber-400"
  }
];

const CATEGORIES = ["All", "SaaS", "AI/ML", "E-Commerce", "DevTools"];

function ExampleProjects() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCodeId, setActiveCodeId] = useState(null);

  const filteredProjects = activeCategory === "All"
    ? PROJECTS
    : PROJECTS.filter(p => p.category === activeCategory);

  return (
    <section id="examples" className="py-24 px-5 bg-zinc-950 text-white relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Project Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Built with NovaDesk AI
            </h2>
            <p className="text-zinc-400 text-base mt-2 max-w-xl">
              Explore production apps generated from simple natural language prompts in under a minute.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-6 hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-violet-900/10 overflow-hidden"
            >
              {/* Card Background Glow */}
              <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${project.gradient} blur-3xl group-hover:opacity-100 opacity-60 transition-opacity pointer-events-none`} />

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-800 border ${project.accentColor}`}>
                    {project.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{project.stars}</span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-zinc-100 group-hover:text-violet-300 transition-colors mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  {project.description}
                </p>

                {/* Prompt Quote Pill */}
                <div className="p-3 mb-6 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 font-mono flex items-start gap-2">
                  <Terminal className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">"{project.prompt}"</span>
                </div>
              </div>

              <div>
                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((t) => (
                    <span key={t} className="px-2.5 py-1 text-xs font-mono rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Actions Row */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/60">
                  <button
                    onClick={() => setActiveCodeId(activeCodeId === project.id ? null : project.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    <Code2 className="w-4 h-4 text-violet-400" />
                    <span>{activeCodeId === project.id ? "Hide Prompt" : "View Prompt & Stack"}</span>
                  </button>

                  <a
                    href="#generate"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium border border-violet-500/30 transition-colors ml-auto"
                  >
                    <span>Remix App</span>
                    <Play className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Expanded Code / Specs Box */}
                {activeCodeId === project.id && (
                  <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-violet-500/30 text-xs font-mono text-zinc-300 animate-in fade-in duration-200">
                    <div className="text-violet-400 font-semibold mb-1">Generated System Architecture:</div>
                    <div className="text-zinc-400 space-y-1">
                      <p>• Components: Header, Sidebar, DataGrid, ChartWidget, FilterBar</p>
                      <p>• State Management: Zustand store with localStorage sync</p>
                      <p>• Styling: Tailwind v4 container queries & dynamic dark theme</p>
                      <p>• API: Async REST client with TypeScript request interfaces</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default ExampleProjects;
