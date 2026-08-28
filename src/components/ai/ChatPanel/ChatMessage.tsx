import { useState, useCallback } from 'react';
import { Check, Copy, RotateCcw, ThumbsUp, ThumbsDown, Trash2, Bot, User, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { UIMessage } from '../../../contexts/AIContext';
import { useAI } from '../../../contexts/AIContext';
import { CodeBlock } from '../CodeBlock';

interface ChatMessageProps {
  message: UIMessage;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const { regenerate, setMessages, sendMessage } = useAI();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isStreaming = message.isStreaming;

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.content]);

  const remove = useCallback(() => {
    setMessages(prev => prev.filter(m => m.id !== message.id));
  }, [message.id, setMessages]);

  if (isUser) {
    return (
      <div className="flex gap-3 group">
        <div className="flex-1 flex flex-col items-end gap-1">
          <div className="max-w-[85%] bg-[#c4f042]/10 border border-[#c4f042]/20 text-slate-200 rounded-xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          {/* Hover actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copy} className="p-1 rounded text-slate-600 hover:text-slate-400 transition-colors" title="Copy">
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
            <button onClick={remove} className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-[#c4f042] flex items-center justify-center shrink-0 mt-0.5">
          <User size={14} className="text-black" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-red-900/50 border border-red-700/50 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={14} className="text-red-400" />
        </div>
        <div className="flex-1 bg-red-950/30 border border-red-800/30 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-red-300">
          {message.content}
          <button
            onClick={regenerate}
            className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
          >
            <RotateCcw size={11} /> Try again
          </button>
        </div>
      </div>
    );
  }

  // Model message
  return (
    <div className="flex gap-3 group">
      <div className="w-7 h-7 rounded-full bg-[#c4f042] flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={14} className="text-black" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 leading-relaxed">
          {isStreaming && !message.content ? (
            <div className="flex items-center gap-2 h-7 text-xs text-[#c4f042] bg-[#c4f042]/10 border border-[#c4f042]/20 px-3 py-1 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-[#c4f042] animate-ping shrink-0" />
              <span className="font-medium">Generating code for workspace...</span>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? '');

                  const code = String(children).replace(/\n$/, '');
                  
                  // Detect if this is a fenced code block by checking if parent has pre
                  if (className?.startsWith('language-')) {
                    return <CodeBlock language={match?.[1]} code={code} />;
                  }
                  return (
                    <code className="glass-panel text-pink-400 px-1.5 py-0.5 rounded text-[12px] font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  // CodeBlock handles its own <pre>, so just render the child
                  return <>{children}</>;
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-2 space-y-1 text-slate-300">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-2 space-y-1 text-slate-300">{children}</ol>;
                },
                blockquote({ children }) {
                  return <blockquote className="border-l-2 border-blue-500/50 pl-3 text-slate-400 italic my-2">{children}</blockquote>;
                },
                h1({ children }) { return <h1 className="text-lg font-bold text-slate-100 mb-2">{children}</h1>; },
                h2({ children }) { return <h2 className="text-base font-semibold text-slate-100 mb-2">{children}</h2>; },
                h3({ children }) { return <h3 className="text-sm font-semibold text-slate-200 mb-1">{children}</h3>; },
                hr() { return <hr className="border-slate-800 my-3" />; },
                a({ href, children }) {
                  return <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{children}</a>;
                },
                table({ children }) {
                  return <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse border border-slate-800">{children}</table></div>;
                },
                th({ children }) { return <th className="border border-slate-800 px-2 py-1 glass-panel text-slate-300 font-medium text-left">{children}</th>; },
                td({ children }) { return <td className="border border-slate-800 px-2 py-1 text-slate-400">{children}</td>; },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-[#c4f042] ml-0.5 animate-pulse align-middle" />
          )}
          
          {message.artifact?.requestFeedback && !isStreaming && (
            <div className="mt-4 p-3 glass-panel rounded-lg border border-[#c4f042]/30">
              <div className="text-sm text-slate-300 mb-3">
                <span className="font-semibold text-[#c4f042]">Artifact Generated:</span> {message.artifact.path.split(/[\\/]/).pop()}
              </div>
              {message.artifact.path.endsWith('Plan.md') ? (
                <div className="text-xs text-slate-400 italic text-center p-2 bg-black/20 rounded">
                  Please review the plan in the editor tab. You will find the Proceed and Feedback buttons there.
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => sendMessage('/approve_plan')}
                    className="px-3 py-1.5 bg-[#c4f042] hover:bg-[#a3cc3b] text-black rounded text-xs font-medium transition-colors flex-1"
                  >
                    Proceed
                  </button>
                  <button
                    onClick={() => sendMessage('I want to make changes to the plan.')}
                    className="px-3 py-1.5 glass-panel hover:bg-[#333] text-slate-300 rounded text-xs font-medium transition-colors flex-1"
                  >
                    Feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover actions - only for completed messages */}
        {!isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copy} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-500 hover:text-slate-300 hover:glass-panel transition-colors">
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={regenerate} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-500 hover:text-slate-300 hover:glass-panel transition-colors">
              <RotateCcw size={11} /> Regenerate
            </button>
            <button
              onClick={() => setLiked(l => l === true ? null : true)}
              className={`p-1 rounded text-[11px] transition-colors hover:glass-panel ${liked === true ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ThumbsUp size={11} />
            </button>
            <button
              onClick={() => setLiked(l => l === false ? null : false)}
              className={`p-1 rounded text-[11px] transition-colors hover:glass-panel ${liked === false ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <ThumbsDown size={11} />
            </button>
            <button onClick={remove} className="p-1 rounded text-[11px] text-slate-500 hover:text-red-400 hover:glass-panel transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
