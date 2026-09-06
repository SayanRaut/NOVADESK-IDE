import React, { useState } from "react";
import { Sparkles, ArrowRight, Paperclip, Sliders, Code2, Zap, Check } from "lucide-react";

const TEMPLATES = [
  "Build an AI-powered SaaS Analytics Dashboard",
  "Create a real-time Kanban project board with drag and drop",
  "Generate a modern E-commerce storefront with cart & checkout",
  "Design a dark-mode Developer Portfolio with interactive blog"
];

const TECH_STACKS = ["React", "Tailwind CSS", "Next.js", "Node.js", "Supabase", "TypeScript"];

function PromptBox() {
  const [prompt, setPrompt] = useState("");
  const [selectedStack, setSelectedStack] = useState(["React", "Tailwind CSS"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStackMenu, setShowStackMenu] = useState(false);

  const toggleStack = (tech) => {
    if (selectedStack.includes(tech)) {
      if (selectedStack.length > 1) {
        setSelectedStack(selectedStack.filter(item => item !== tech));
      }
    } else {
      setSelectedStack([...selectedStack, tech]);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`Starting NovaDesk AI generation for: "${prompt}"`);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-zinc-900/90 p-2 sm:p-3 border border-zinc-800 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-violet-500/50 hover:shadow-violet-500/10">
      <form onSubmit={handleGenerate} className="relative flex flex-col gap-3 p-4 sm:p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
        
        {/* Main Textarea Input */}
        <div className="relative flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-violet-400 mt-1 shrink-0 animate-pulse" />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the application you want to build... (e.g. 'Build a real-time collaborative code editor with chat')"
            rows={3}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 resize-none outline-none text-base sm:text-lg font-normal leading-relaxed"
          />
        </div>

        {/* Tech Stack Pills & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStackMenu(!showStackMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Stack ({selectedStack.length})</span>
            </button>

            {selectedStack.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20"
              >
                <Code2 className="w-3 h-3 text-violet-400" />
                {tech}
              </span>
            ))}

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Attach wireframe or schema"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Attach Spec</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isGenerating || !prompt.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                : "bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-violet-300" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate App</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Stack Selection Dropdown Drawer */}
        {showStackMenu && (
          <div className="p-3 mt-1 rounded-xl bg-zinc-900 border border-zinc-800 animate-in fade-in duration-200">
            <div className="text-xs font-semibold text-zinc-400 mb-2">Select Tech Stack Components:</div>
            <div className="flex flex-wrap gap-2">
              {TECH_STACKS.map((tech) => {
                const isSelected = selectedStack.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleStack(tech)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {/* Suggested Template Chips */}
      <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0">Try:</span>
        <div className="flex items-center gap-2 shrink-0">
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(tmpl)}
              className="text-xs px-3 py-1 rounded-full bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-violet-300 border border-zinc-700/40 transition-colors whitespace-nowrap"
            >
              {tmpl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromptBox;
