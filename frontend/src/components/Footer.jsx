import React from "react";
import { Sparkles, Globe, Share2, Layers, Heart, Terminal } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800/80 pt-16 pb-12 px-5 text-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
        
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-xl font-extrabold text-white tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>NovaDesk</span>
          </div>
          <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
            The next-generation AI code studio for building production-ready full-stack web applications at breakneck speed.
          </p>

          {/* System Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>All Systems Operational</span>
          </div>
        </div>

        {/* Column 1: Product */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Product</h4>
          <ul className="space-y-2.5 text-xs text-zinc-400">
            <li><a href="#features" className="hover:text-white transition-colors">AI Code Studio</a></li>
            <li><a href="#examples" className="hover:text-white transition-colors">Templates & Showcase</a></li>
            <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
            <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Plans</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
          </ul>
        </div>

        {/* Column 2: Resources */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2.5 text-xs text-zinc-400">
            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Prompting Guide</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Community Discord</a></li>
            <li><a href="#" className="hover:text-white transition-colors">GitHub Repository</a></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div>
          <h4 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider">Company</h4>
          <ul className="space-y-2.5 text-xs text-zinc-400">
            <li><a href="#" className="hover:text-white transition-colors">About NovaDesk</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div>
          © {new Date().getFullYear()} NovaDesk Inc. All rights reserved.
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-zinc-300 transition-colors" aria-label="Global Network" title="Global Network">
            <Globe className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-zinc-300 transition-colors" aria-label="Share" title="Share NovaDesk">
            <Share2 className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
