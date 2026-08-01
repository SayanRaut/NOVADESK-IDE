export function registerMonacoThemes(monaco: any) {
  monaco.editor.defineTheme('novadesk-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.lineHighlightBackground': '#2a2d2e',
    }
  });

  monaco.editor.defineTheme('novadesk-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.lineHighlightBackground': '#f0f0f0',
    }
  });

  monaco.editor.defineTheme('abyss', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#000c18',
      'editor.lineHighlightBackground': '#081220',
    }
  });

  monaco.editor.defineTheme('tomorrow-night-blue', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#002451',
      'editor.lineHighlightBackground': '#001633',
    }
  });
}

export function getEditorTheme(theme: string): string {
  switch (theme) {
    case 'abyss': return 'abyss';
    case 'tomorrow-night-blue': return 'tomorrow-night-blue';
    case 'hc-black': return 'hc-black';
    case 'hc-light': return 'hc-light';
    case 'light': return 'novadesk-light';
    case 'dark':
    default: return 'novadesk-dark';
  }
}
