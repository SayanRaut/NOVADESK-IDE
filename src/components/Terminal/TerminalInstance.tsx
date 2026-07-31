import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import 'xterm/css/xterm.css';
import { cn } from '../../utils/cn';

type Props = {
  id: string;
  isActive: boolean;
};

export function TerminalInstance({ id, isActive }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
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
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      cursorBlink: true,
      allowTransparency: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    
    try {
      const webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
    } catch (e) {
      console.warn('WebGL addon could not be loaded, falling back to canvas/dom renderer', e);
    }

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
      } catch (e) {
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
