import React from "react";
import PromptBox from "./PromptBox";
import { Sparkles, Zap, ShieldCheck, Cpu, ArrowRight } from "lucide-react";

function Hero() {
  return (
    <section className="relative pt-28 pb-20 px-5 overflow-hidden bg-zinc-950 text-white border-b border-zinc-800/80">
      {/* Glow Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/20 to-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto text-center flex flex-col items-center">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold tracking-wide mb-6 backdrop-blur-md shadow-inner">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>NovaDesk 2.0 AI Code Engine is Live</span>
          <span className="text-zinc-500">•</span>
          <a href="#features" className="text-white hover:text-violet-300 underline underline-offset-2 flex items-center gap-1">
            See What's New <ArrowRight className="w-3 h-3 inline" />
          </a>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Turn your ideas into <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            full-stack web apps
          </span>{" "}
          instantly.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed mb-10">
          Describe what you want to build. NovaDesk generates modular React code, Tailwind styling, state logic, and database integrations in seconds.
        </p>

        {/* Prompt Input Box Container */}
        <div className="w-full mb-12">
          <PromptBox />
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-4">
          <div className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <Zap className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <p className="text-xs font-semibold text-zinc-200">Sub-second generation</p>
              <p className="text-[11px] text-zinc-500">Instant component creation</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <Cpu className="w-5 h-5 text-violet-400" />
            <div className="text-left">
              <p className="text-xs font-semibold text-zinc-200">Production-ready code</p>
              <p className="text-[11px] text-zinc-500">Clean, modular React & TS</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-xs font-semibold text-zinc-200">1-Click Live Preview</p>
              <p className="text-[11px] text-zinc-500">Hot reload sandbox included</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;
