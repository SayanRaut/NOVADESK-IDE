import React from "react";
import { MessageSquare, Wand2, Eye, Rocket, CheckCircle2, ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Describe Your Vision",
    description: "Write what you want to build using plain English or paste component mockups. Choose your preferred frameworks and styling libraries.",
    badge: "Natural Language Input",
    color: "from-blue-500 to-cyan-500",
    bgAccent: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    number: "02",
    icon: Wand2,
    title: "AI Engine Writes Code",
    description: "NovaDesk plans full component hierarchies, writes modular React code, configures Tailwind styles, and wires state management seamlessly.",
    badge: "Autonomous Generation",
    color: "from-violet-500 to-purple-500",
    bgAccent: "bg-violet-500/10 text-violet-400 border-violet-500/20"
  },
  {
    number: "03",
    icon: Eye,
    title: "Instant Live Sandbox",
    description: "Test your application in real-time right inside the browser with hot reload. Edit code directly or instruct the AI to tweak styles and logic.",
    badge: "Interactive Preview",
    color: "from-pink-500 to-rose-500",
    bgAccent: "bg-pink-500/10 text-pink-400 border-pink-500/20"
  },
  {
    number: "04",
    icon: Rocket,
    title: "Deploy to Production",
    description: "Publish your web app with one click to global edge network with custom SSL, environment variables, and custom domain setup.",
    badge: "1-Click Launch",
    color: "from-emerald-500 to-teal-500",
    bgAccent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-5 bg-zinc-950 text-white border-t border-b border-zinc-800/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
            Seamless Workflow
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How NovaDesk Works
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg mt-4">
            Go from zero to a live, production-ready web application in four effortless steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 flex flex-col justify-between hover:border-zinc-700 transition-all group"
              >
                <div>
                  {/* Top Step Number & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black font-mono text-zinc-700 group-hover:text-violet-500 transition-colors">
                      {step.number}
                    </span>
                    <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${step.bgAccent}`}>
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} p-0.5 mb-6 shadow-lg`}>
                    <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Footer Check Indicator */}
                <div className="pt-6 mt-6 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-violet-400" />
                  <span>Automated & Instant</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;
