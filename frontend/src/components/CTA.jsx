import React from "react";
import { Sparkles, ArrowRight, Check, Zap, Rocket } from "lucide-react";

function CTA() {
  return (
    <section className="py-24 px-5 bg-zinc-950 text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-violet-600/30 via-purple-600/20 to-indigo-600/30 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 sm:p-14 border border-violet-500/30 shadow-2xl text-center flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>Start Building Free • No Credit Card Required</span>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight mb-6">
          Ready to build your next big idea with{" "}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            NovaDesk?
          </span>
        </h2>

        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
          Join thousands of developers, founders, and creators generating high-performance web applications with AI in seconds.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Rocket className="w-4 h-4" />
            <span>Launch NovaDesk Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#examples"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors"
          >
            <span>Explore Examples</span>
          </a>
        </div>

        {/* Feature List */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 pt-6 border-t border-zinc-800/80 w-full">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>5 Free Projects / Month</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Full Source Code Export</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Instant Edge Deployment</span>
          </div>
        </div>

      </div>
    </section>
  );
}

export default CTA;
