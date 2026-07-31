import { useEffect, useState } from 'react';
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';
import { useTheme } from '../../contexts/ThemeContext';

interface DiffEditorProps {
  originalContent: string;
  modifiedContent: string;
  language?: string;
  filePath: string;
  onAccept?: () => void;
  onReject?: () => void;
}

export function DiffEditor({
  originalContent,
  modifiedContent,
  language = 'plaintext',
  filePath,
  onAccept,
  onReject
}: DiffEditorProps) {
  const { actualTheme } = useTheme();

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      <div className="flex justify-between items-center px-4 py-2 bg-[#252526] text-slate-300 border-b border-[#333]">
        <div className="text-sm font-medium">
          Previewing changes for: <span className="text-blue-400">{filePath}</span>
        </div>
        <div className="flex gap-2">
          {onReject && (
            <button
              onClick={onReject}
              className="px-3 py-1 text-xs rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
            >
              Reject
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              className="px-3 py-1 text-xs rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
            >
              Accept
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <MonacoDiffEditor
          height="100%"
          language={language}
          original={originalContent}
          modified={modifiedContent}
          theme={actualTheme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            renderSideBySide: true,
            minimap: { enabled: false },
            readOnly: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
