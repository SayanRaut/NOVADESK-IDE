export type Preferences = {
  theme: 'dark' | 'midnight' | 'light';
  fontSize: number;
  tabSize: 2 | 4 | 8;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  terminalFontSize: number;
  terminalCursorBlink: boolean;
};

const key = 'novadesk_preferences';

export const defaultPreferences: Preferences = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  autoSave: false,
  terminalFontSize: 13,
  terminalCursorBlink: true,
};

export const readPreferences = (): Preferences => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<Preferences>;
    return { ...defaultPreferences, ...stored };
  } catch {
    return defaultPreferences;
  }
};

export const applyPreferences = (preferences: Preferences) => {
  localStorage.setItem(key, JSON.stringify(preferences));
  document.documentElement.dataset.theme = preferences.theme;
  window.dispatchEvent(new Event('novadesk:settings'));
};

export const initializePreferences = () => {
  document.documentElement.dataset.theme = readPreferences().theme;
};
