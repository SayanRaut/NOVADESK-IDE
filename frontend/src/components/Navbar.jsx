import React, { useState } from "react";
import { Sparkles, ArrowRight, Menu, X, Rocket } from "lucide-react";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">
            Nova<span className="text-violet-400">Desk</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#examples" className="hover:text-violet-300 transition-colors">
            Examples
          </a>
          <a href="#how-it-works" className="hover:text-violet-300 transition-colors">
            How it works
          </a>
          <a href="#features" className="hover:text-violet-300 transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-violet-300 transition-colors">
            Pricing
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors">
            Sign In
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02]"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Start Workspace</span>
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-white"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 p-5 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3 text-sm text-zinc-300">
            <a
              href="#examples"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-violet-400"
            >
              Examples
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-violet-400"
            >
              How it works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-violet-400"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-violet-400"
            >
              Pricing
            </a>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs text-center"
            >
              Start Workspace
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;