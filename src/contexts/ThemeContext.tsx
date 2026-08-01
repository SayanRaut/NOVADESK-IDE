import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'abyss' | 'tomorrow-night-blue' | 'hc-black' | 'hc-light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('novadesk:theme') as Theme;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('novadesk:theme', theme);
    
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'abyss', 'tomorrow-night-blue', 'hc-black', 'hc-light');
    
    let resolved = theme;
    
    root.classList.add(resolved);
    
    const isLight = resolved === 'light' || resolved === 'hc-light';
    setActualTheme(isLight ? 'light' : 'dark');

    if (window.electronAPI) {
      window.electronAPI.setTheme(resolved);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
