import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'abyss' | 'tomorrow-night-blue' | 'hc-black' | 'hc-light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
  customBackground: string | null;
  setCustomBackground: (url: string | null) => void;
  backgroundBlur: number;
  setBackgroundBlur: (blur: number) => void;
  editorOpacity: number;
  setEditorOpacity: (opacity: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  minimapEnabled: boolean;
  setMinimapEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('novadesk:theme') as Theme) || 'dark');
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');
  const [customBackground, setCustomBackground] = useState<string | null>(() => localStorage.getItem('novadesk:customBackground'));
  const [backgroundBlur, setBackgroundBlur] = useState<number>(() => {
    const saved = localStorage.getItem('novadesk:backgroundBlur');
    return saved !== null ? Number(saved) : 0;
  });
  const [editorOpacity, setEditorOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('novadesk:editorOpacity');
    return saved !== null ? Number(saved) : 0.9;
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('novadesk:fontSize');
    return saved !== null ? Number(saved) : 13;
  });
  const [minimapEnabled, setMinimapEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('novadesk:minimapEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    // Only handle things that need to run once on mount or need side effects here
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

  // Handle custom background persistence and CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    if (customBackground) {
      localStorage.setItem('novadesk:customBackground', customBackground);
      root.style.setProperty('--custom-bg-image', `url(${customBackground})`);
    } else {
      localStorage.removeItem('novadesk:customBackground');
      root.style.removeProperty('--custom-bg-image');
    }

    localStorage.setItem('novadesk:backgroundBlur', backgroundBlur.toString());
    root.style.setProperty('--custom-bg-blur', `${backgroundBlur}px`);

    localStorage.setItem('novadesk:editorOpacity', editorOpacity.toString());
    root.style.setProperty('--editor-bg-opacity', customBackground ? editorOpacity.toString() : '1');
    
    if (customBackground) {
      root.classList.add('has-custom-bg');
    } else {
      root.classList.remove('has-custom-bg');
    }
  }, [customBackground, backgroundBlur, editorOpacity]);

  useEffect(() => {
    localStorage.setItem('novadesk:fontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('novadesk:minimapEnabled', String(minimapEnabled));
  }, [minimapEnabled]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, actualTheme,
      customBackground, setCustomBackground,
      backgroundBlur, setBackgroundBlur,
      editorOpacity, setEditorOpacity,
      fontSize, setFontSize,
      minimapEnabled, setMinimapEnabled
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
