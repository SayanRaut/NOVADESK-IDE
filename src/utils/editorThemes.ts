export function registerMonacoThemes(monaco: any) {
  monaco.editor.defineTheme('codeic-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'ff2a5f', fontStyle: 'bold' },
      { token: 'string', foreground: 'c4f042' },
      { token: 'number', foreground: 'a78bfa' },
      { token: 'type', foreground: '38bdf8' },
      { token: 'class', foreground: '38bdf8' },
      { token: 'function', foreground: 'e879f9' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'variable', foreground: 'f8fafc' },
    ],
    colors: {
      'editor.background': '#111111',
      'editor.foreground': '#f8fafc',
      'editor.lineHighlightBackground': '#1e1e1e',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#c4f042',
      'editorIndentGuide.background': '#1e293b',
      'editorIndentGuide.activeBackground': '#334155',
      'editorSuggestWidget.background': '#0f172a',
      'editorSuggestWidget.border': '#1e293b',
      'editorSuggestWidget.selectedBackground': '#1e293b',
    }
  });

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
    default: return 'codeic-dark';
  }
}
