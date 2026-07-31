import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEditor } from '../../contexts/EditorContext';
import { useTheme } from '../../contexts/ThemeContext';

export function MonacoEditor({ groupId }: { groupId: string }) {
  const { editorGroups, fileContents, setFileContents, setFileDirty, setCursorPosition, activeGroupId } = useEditor();
  const { actualTheme } = useTheme();
  
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const group = editorGroups.find(g => g.id === groupId);
  const activeFile = group?.activeFile;
  const isFocused = groupId === activeGroupId;

  // Load file content when active file changes
  useEffect(() => {
    if (!activeFile) return;

    if (fileContents[activeFile] !== undefined) {
      setContent(fileContents[activeFile]);
      return;
    }

    const loadContent = async () => {
      setLoading(true);
      try {
        if (window.electronAPI) {
          const text = await window.electronAPI.readFile(activeFile);
          setContent(text);
          setFileContents(prev => ({ ...prev, [activeFile]: text }));
        }
      } catch (err) {
        console.error("Failed to read file", err);
      }
      setLoading(false);
    };

    loadContent();
  }, [activeFile, fileContents, setFileContents]);

  // Sync content if modified from another split pane
  useEffect(() => {
    if (activeFile && fileContents[activeFile] !== undefined && fileContents[activeFile] !== content) {
      setContent(fileContents[activeFile]);
    }
  }, [activeFile, fileContents]);

  const handleBeforeMount = (monacoInstance: any) => {
    monacoInstance.editor.defineTheme('novadesk-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.lineHighlightBackground': '#2a2d2e',
      }
    });
    monacoInstance.editor.defineTheme('novadesk-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f0f0f0',
      }
    });

    // Mock Hover Provider architecture
    monacoInstance.languages.registerHoverProvider('*', {
      provideHover: (_model: any, _position: any) => {
        // Just a placeholder to prove the architecture works
        return null;
      }
    });

    // Mock CodeLens Provider architecture
    monacoInstance.languages.registerCodeLensProvider('*', {
      provideCodeLenses: (_model: any, _token: any) => {
        return {
          lenses: [
            {
              range: { startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 1 },
              id: "First Line",
              command: { id: "", title: "NovaDesk Editor Engine Active" }
            }
          ],
          dispose: () => {}
        };
      },
      resolveCodeLens: (_model: any, codeLens: any, _token: any) => codeLens
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFile) return;
    setContent(value);
    setFileContents(prev => ({ ...prev, [activeFile]: value }));
    setFileDirty(activeFile, true);
  };

  const handleMount = (editor: any) => {
    editor.onDidChangeCursorPosition((e: any) => {
      if (isFocused) {
        setCursorPosition({
          line: e.position.lineNumber,
          column: e.position.column
        });
      }
    });
    
    // Gain focus on mount if it's the active group
    if (isFocused) {
      editor.focus();
    }
    
    editor.onDidFocusEditorWidget(() => {
      // Could notify context that this group should be active, but let's keep it simple
    });
  };

  if (!activeFile) return null;

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-500">Loading {activeFile.split(/[\\/]/).pop()}...</div>;
  }

  // Determine basic language from extension
  const ext = activeFile.split('.').pop()?.toLowerCase() || '';
  let language = 'plaintext';
  if (['ts', 'tsx'].includes(ext)) language = 'typescript';
  else if (['js', 'jsx'].includes(ext)) language = 'javascript';
  else if (ext === 'json') language = 'json';
  else if (ext === 'md') language = 'markdown';
  else if (['html', 'htm'].includes(ext)) language = 'html';
  else if (ext === 'css') language = 'css';
  else if (ext === 'py') language = 'python';

  return (
    <div className="flex-1 overflow-hidden relative">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={handleEditorChange}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
        theme={actualTheme === 'dark' ? 'novadesk-dark' : 'novadesk-light'}
        options={{
          minimap: { enabled: true, renderCharacters: false },
          wordWrap: 'on',
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          padding: { top: 16 },
          scrollBeyondLastLine: true,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: true,
          bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
          autoIndent: 'full',
          folding: true,
          multiCursorModifier: 'alt',
          renderLineHighlight: 'all',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          
          quickSuggestions: true,
          parameterHints: { enabled: true },
          suggestOnTriggerCharacters: true,
          codeLens: true,
          hover: { enabled: true },
          overviewRulerLanes: 3,
          hideCursorInOverviewRuler: false,
          glyphMargin: true,
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'always'
          }
        }}
      />
    </div>
  );
}
