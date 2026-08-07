import { useState, useEffect } from 'react';
import { GitCompare, FileDiff, ArrowRight } from 'lucide-react';
import { useEditor } from '../../contexts/EditorContext';

export function GitDiffViewer({ uri }: { uri: string }) {
  const { currentPath, refreshVersion } = useEditor();
  const [diff, setDiff] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Parse base and compare from uri: git-diff://branches?base=main&compare=feature
  const searchParams = new URLSearchParams(uri.split('?')[1] || '');
  const base = searchParams.get('base') || 'main';
  const compare = searchParams.get('compare') || 'feature';

  useEffect(() => {
    const fetchDiff = async () => {
      if (!window.electronAPI) return;
      setLoading(true);
      const diffOut = await window.electronAPI.gitDiffBranches(base, compare);
      if (diffOut) {
        setDiff(diffOut);
      } else {
        setDiff('');
      }
      setLoading(false);
    };
    fetchDiff();
  }, [currentPath, refreshVersion, base, compare]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#1e1e1e] text-slate-400">
        Loading differences between {base} and {compare}...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] overflow-hidden text-slate-200 p-8">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4 shrink-0">
        <GitCompare className="w-8 h-8 text-[#c4f042]" />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Branch Differences</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 font-mono">
            <span className="bg-white/10 px-2 py-0.5 rounded">{base}</span>
            <ArrowRight className="w-4 h-4" />
            <span className="bg-white/10 px-2 py-0.5 rounded text-[#c4f042]">{compare}</span>
          </div>
        </div>
      </div>
      
      {diff.trim() === '' ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <FileDiff className="w-16 h-16 mb-4 opacity-50" />
          <p>No differences found between these branches.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-black/40 rounded-lg border border-white/10 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
          {diff.split('\n').map((line, i) => {
            if (line.startsWith('+') && !line.startsWith('+++')) {
              return <div key={i} className="text-emerald-400 bg-emerald-400/10 px-1 -mx-1">{line}</div>;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              return <div key={i} className="text-rose-400 bg-rose-400/10 px-1 -mx-1">{line}</div>;
            } else if (line.startsWith('@@')) {
              return <div key={i} className="text-blue-400 mt-2 mb-1">{line}</div>;
            } else if (line.startsWith('diff --git')) {
              return <div key={i} className="text-slate-300 font-bold mt-4 mb-1 border-t border-white/10 pt-4 first:mt-0 first:pt-0 first:border-0">{line}</div>;
            }
            return <div key={i} className="text-slate-400 px-1">{line}</div>;
          })}
        </div>
      )}
    </div>
  );
}
