import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { cn } from '../../utils/cn';
import { useTheme } from '../../contexts/ThemeContext';

const darkTheme = {
  background: '#1a1a1a',
  foreground: '#f3f3f3',
  cursor: '#f3f3f3',
  selectionBackground: '#333333',
  black: '#000000',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#8b5cf6',
  cyan: '#06b6d4',
  white: '#ffffff',
};

const lightTheme = {
  background: '#f9fafb',
  foreground: '#111111',
  cursor: '#111111',
  selectionBackground: '#e5e7eb',
  black: '#000000',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  magenta: '#8b5cf6',
  cyan: '#06b6d4',
  white: '#ffffff',
};

const abyssTheme = {
  ...darkTheme,
  background: '#000c18',
  foreground: '#6688cc',
  cursor: '#6688cc',
  selectionBackground: '#18253a',
};

const tomorrowNightBlueTheme = {
  ...darkTheme,
  background: '#002451',
  foreground: '#ffffff',
  cursor: '#ffffff',
  selectionBackground: '#003f8e',
};

const hcBlackTheme = {
  ...darkTheme,
  background: '#000000',
  foreground: '#ffffff',
  cursor: '#ffffff',
  selectionBackground: '#004400',
};

const hcLightTheme = {
  ...lightTheme,
  background: '#ffffff',
  foreground: '#000000',
  cursor: '#000000',
  selectionBackground: '#bbbbbb',
};

function getTerminalTheme(theme: string) {
  switch (theme) {
    case 'abyss': return abyssTheme;
    case 'tomorrow-night-blue': return tomorrowNightBlueTheme;
    case 'hc-black': return hcBlackTheme;
    case 'hc-light': return hcLightTheme;
    case 'light': return lightTheme;
    case 'dark': 
    default: return darkTheme;
  }
}

type Props = {
  id: string;
  isActive: boolean;
};

export function TerminalInstance({ id, isActive }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme, customBackground, fontSize } = useTheme();

  useEffect(() => {
    if (!terminalRef.current) return;

    const termTheme = getTerminalTheme(theme);
    if (customBackground) {
      termTheme.background = 'transparent';
    }

    const term = new Terminal({
      theme: termTheme,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: fontSize,
      cursorBlink: true,
      allowTransparency: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    
    // Using standard DOM renderer for maximum compatibility with Electron CSP

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    if (window.electronAPI) {
      const cleanupData = window.electronAPI.onTerminalData((payload) => {
        if (payload.id === id) term.write(payload.data);
      });

      term.onData((data) => {
        window.electronAPI?.writeTerminal(id, data);
      });

      return () => {
        cleanupData();
        term.dispose();
      };
    } else {
      term.write('No electronAPI found.\r\n');
      return () => term.dispose();
    }
  }, [id]);

  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      if (!terminalRef.current || terminalRef.current.offsetWidth === 0) return;
      try {
        fitAddonRef.current?.fit();
        if (window.electronAPI && xtermRef.current) {
          window.electronAPI.resizeTerminal(id, xtermRef.current.cols, xtermRef.current.rows);
        }
      } catch {
        // ignore
      }
    };

    handleResize(); // Initial fit when becoming active

    const observer = new ResizeObserver(handleResize);
    if (terminalRef.current) observer.observe(terminalRef.current);

    // Focus when active
    xtermRef.current?.focus();

    return () => observer.disconnect();
  }, [isActive, id]);

  useEffect(() => {
    if (xtermRef.current) {
      const termTheme = getTerminalTheme(theme);
      if (customBackground) {
        termTheme.background = 'transparent';
      }
      xtermRef.current.options.theme = termTheme;
      xtermRef.current.options.fontSize = fontSize;
      fitAddonRef.current?.fit();
    }
  }, [theme, customBackground, fontSize]);

  return (
    <div 
      className={cn(
        "w-full h-full absolute inset-0", 
        isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none -z-10"
      )} 
      ref={terminalRef} 
    />
  );
}
