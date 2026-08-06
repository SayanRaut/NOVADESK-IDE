import { useState, useCallback } from 'react';
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import hljs from 'highlight.js';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const highlighted = language && hljs.getLanguage(language)
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;

  const lines = code.split('\n');
  const isLong = lines.length > 40;
  const displayCode = collapsed ? lines.slice(0, 10).join('\n') + '\n...' : code;
  const displayHighlighted = collapsed
    ? (language && hljs.getLanguage(language)
        ? hljs.highlight(displayCode, { language }).value
        : hljs.highlightAuto(displayCode).value)
    : highlighted;

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="my-3 rounded-lg border border-slate-800 glass-panel overflow-hidden font-mono text-[13px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 glass-panel border-b border-slate-800">
        <span className="text-xs text-slate-400 uppercase tracking-wider">
          {language ?? 'text'}
        </span>
        <div className="flex items-center gap-2">
          {isLong && (
            <button
              onClick={() => setCollapsed(c => !c)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-[13px] leading-[1.6] text-slate-200">
          <code
            dangerouslySetInnerHTML={{ __html: displayHighlighted }}
          />
        </pre>
      </div>
    </div>
  );
};
