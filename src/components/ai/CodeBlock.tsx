import { useState, useCallback } from 'react';
import { Check, Copy, ChevronDown, ChevronUp, ExternalLink, FileCode, Zap } from 'lucide-react';
import hljs from 'highlight.js';
import { useEditor } from '../../contexts/EditorContext';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const { openFile, currentPath } = useEditor();
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');
  // ALWAYS hidden/collapsed by default under the Generation section
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if first line contains a filename header (e.g., "### File: src/Counter.tsx", "// File: ...", "# File: ...", "File: ...")
  const firstLine = lines[0] || '';
  const fileMatch = firstLine.match(/(?:(?:###|\/\/|#)\s*File:\s*|File:\s*)([^\r\n]+)/i);
  const detectedFileName = fileMatch ? fileMatch[1].trim() : null;

  // Clean code without the header line if detected
  const cleanCode = detectedFileName ? lines.slice(1).join('\n') : code;
  const totalLines = cleanCode.split('\n').length;

  const highlighted = isExpanded
    ? (language && hljs.getLanguage(language)
        ? hljs.highlight(cleanCode, { language }).value
        : hljs.highlightAuto(cleanCode).value)
    : '';

  const copy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(cleanCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [cleanCode]);

  const handleOpenFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!detectedFileName) return;
    const target = currentPath ? `${currentPath.replace(/[\\/]$/, '')}/${detectedFileName.replace(/^[\\/]/, '')}` : detectedFileName;
    openFile(target);
  }, [detectedFileName, currentPath, openFile]);

  return (
    <div className="my-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/80 overflow-hidden font-mono text-[12px] shadow-sm">
      {/* Generation Bar - Hidden by default under this small section */}
      <div 
        onClick={() => setIsExpanded(c => !c)}
        className="flex items-center justify-between px-3.5 py-2 bg-[#161616] hover:bg-[#202020] border-b border-[var(--border-color)]/60 cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#c4f042]/15 border border-[#c4f042]/30 text-[#c4f042] text-[10px] font-sans font-semibold uppercase tracking-wider shrink-0">
            <Zap size={11} className="fill-[#c4f042]" />
            <span>Generation</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
            {detectedFileName ? (
              <>
                <FileCode size={13} className="text-[#c4f042] shrink-0" />
                <span className="truncate text-slate-200">{detectedFileName}</span>
              </>
            ) : (
              <span className="uppercase text-slate-400">{language || 'Code'}</span>
            )}
            <span className="text-[11px] text-slate-500 shrink-0 font-normal">
              ({totalLines} {totalLines === 1 ? 'line' : 'lines'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {detectedFileName && (
            <button
              onClick={handleOpenFile}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#c4f042]/10 hover:bg-[#c4f042]/20 border border-[#c4f042]/30 text-[11px] text-[#c4f042] transition-colors font-sans font-medium"
              title="Open file in workspace editor"
            >
              <ExternalLink size={12} />
              <span>Open in Editor</span>
            </button>
          )}

          <button
            onClick={copy}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors font-sans"
            title="Copy code"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <span className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-sans px-1">
            {isExpanded ? (
              <>
                <ChevronUp size={13} /> Hide
              </>
            ) : (
              <>
                <ChevronDown size={13} /> View Code
              </>
            )}
          </span>
        </div>
      </div>

      {/* Code Content - Hidden until user explicitly clicks View Code */}
      {isExpanded && (
        <div className="overflow-x-auto border-t border-[var(--border-color)]/40 bg-[#0d0d0d]">
          <pre className="p-3.5 text-[12px] leading-[1.55] text-slate-200">
            <code
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      )}
    </div>
  );
};
