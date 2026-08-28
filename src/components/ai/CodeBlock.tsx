import { useState, useCallback } from 'react';
import { Check, Copy, ChevronDown, ChevronUp, Code2 } from 'lucide-react';
import hljs from 'highlight.js';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');
  const isMultiLine = lines.length > 3;
  // Collapse by default if longer than 3 lines to keep chat generation clean and compact
  const [collapsed, setCollapsed] = useState(isMultiLine);

  const highlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;

  const previewCode = lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '');
  const previewHighlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(previewCode, { language }).value
    : hljs.highlightAuto(previewCode).value;

  const copy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="my-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] overflow-hidden font-mono text-[12px] shadow-sm">
      {/* Header Bar */}
      <div 
        onClick={() => isMultiLine && setCollapsed(c => !c)}
        className="flex items-center justify-between px-3.5 py-1.5 bg-[#1a1a1a]/80 hover:bg-[#222]/80 border-b border-[var(--border-color)] cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <Code2 size={13} className="text-[#c4f042]" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            {language || 'code'}
          </span>
          <span className="text-[11px] text-slate-500">
            ({lines.length} {lines.length === 1 ? 'line' : 'lines'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isMultiLine && (
            <span className="flex items-center gap-1 text-[11px] text-[#c4f042] hover:underline font-sans">
              {collapsed ? (
                <>
                  <ChevronDown size={13} /> Expand
                </>
              ) : (
                <>
                  <ChevronUp size={13} /> Collapse
                </>
              )}
            </span>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto">
        <pre className="p-3 text-[12px] leading-[1.5] text-slate-200">
          <code
            dangerouslySetInnerHTML={{ __html: collapsed ? previewHighlighted : highlighted }}
          />
        </pre>
      </div>
    </div>
  );
};
