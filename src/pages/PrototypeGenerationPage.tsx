import { useEffect, useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { getApiBaseUrl } from '../config/api';
import BackgroundParticles from '../components/animations/BackgroundParticles';
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  FileCode, 
  Check, 
  ArrowRight
} from 'lucide-react';

interface Stage {
  title: string;
  desc: string;
  status: 'pending' | 'active' | 'completed';
}

export function PrototypeGenerationPage() {
  const { prototypeReq, navigateTo, openCodespace } = useNavigation();

  const [stages, setStages] = useState<Stage[]>([
    { title: 'Analyzing Prompt & Requirements', desc: 'Parsing components, styling, and data needs', status: 'active' },
    { title: 'Architecting Project Tree', desc: 'Designing file dependencies and package manifest', status: 'pending' },
    { title: 'Synthesizing Fullstack Code', desc: 'Generating working components and interactive logic', status: 'pending' },
    { title: 'Configuring Cloud Codespace', desc: 'Saving files to server and booting sandbox', status: 'pending' },
  ]);

  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [streamLog, setStreamLog] = useState<string>('Initializing NovaDesk AI Architect...\n');
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!prototypeReq) {
      navigateTo('home');
      return;
    }

    let isMounted = true;

    const runGeneration = async () => {
      try {
        setStreamLog((prev) => prev + `[Planner] Project: ${prototypeReq.name}\n[Planner] Stack: ${prototypeReq.template}\n[Planner] Prompt: "${prototypeReq.prompt.slice(0, 80)}..."\n\n`);

        // Advance to stage 2
        setTimeout(() => {
          if (!isMounted) return;
          setStages((s) => [
            { ...s[0], status: 'completed' },
            { ...s[1], status: 'active' },
            s[2],
            s[3],
          ]);
          setStreamLog((prev) => prev + `[Architect] Analyzing tech stack dependencies...\n[Architect] Scaffolding ${prototypeReq.template} file structure...\n`);
        }, 500);

        // Advance to stage 3
        setTimeout(() => {
          if (!isMounted) return;
          setStages((s) => [
            { ...s[0], status: 'completed' },
            { ...s[1], status: 'completed' },
            { ...s[2], status: 'active' },
            s[3],
          ]);
          setStreamLog((prev) => prev + `[Coder] Writing package manifests & configuration...\n[Coder] Synthesizing UI components and styles...\n`);
        }, 1100);

        // Call backend prototype generation endpoint
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/ai/prototype`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prototypeReq),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        if (!isMounted) return;

        setGeneratedPath(data.path);
        const files: string[] = data.files || [];

        // Animate files appearing quickly
        files.forEach((file, index) => {
          setTimeout(() => {
            if (!isMounted) return;
            setCreatedFiles((prev) => [...prev, file]);
            setStreamLog((prev) => prev + `[FS] Generated: ${file}\n`);
          }, 1400 + index * 120);
        });

        // Advance to stage 4 and complete
        const finishDelay = 1500 + files.length * 120;
        setTimeout(() => {
          if (!isMounted) return;
          setStages((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
          setStreamLog((prev) => prev + `\n✨ Codespace ready at server_workspaces/${data.name}!\n`);
          setIsDone(true);

          // Auto-launch into IDE
          setTimeout(() => {
            if (isMounted) {
              openCodespace(data.name, data.path);
            }
          }, 1200);
        }, finishDelay);

      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Generation failed');
        setStreamLog((prev) => prev + `\n[Error] ${err.message}\n`);
      }
    };

    runGeneration();

    return () => {
      isMounted = false;
    };
  }, [prototypeReq]);

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 overflow-x-hidden flex flex-col justify-between">
      <BackgroundParticles
        particleCount={350}
        particleSpread={16}
        speed={0.2}
        particleColors={['#c4f042', '#38bdf8', '#a855f7']}
        moveParticlesOnHover={false}
        alphaParticles={true}
        particleBaseSize={80}
        cameraDistance={40}
        blurAmount="12px"
      />

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-white/10 bg-slate-950/60 backdrop-blur-xl px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#c4f042] text-black flex items-center justify-center font-bold">
            <Sparkles size={18} />
          </div>
          <span className="font-extrabold text-lg text-white">NovaDesk AI Studio</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#c4f042] animate-ping" />
          <span>Synthesizing Codespace</span>
        </div>
      </header>

      {/* Center Studio Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col gap-8 justify-center">
        {/* Title */}
        <div className="text-center max-w-xl mx-auto flex flex-col items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            {isDone ? (
              <>
                <span className="text-emerald-400">Prototype Created!</span>
                <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />
              </>
            ) : (
              <>
                <span>Architecting Your Prototype</span>
                <Loader2 className="w-6 h-6 text-[#c4f042] animate-spin" />
              </>
            )}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Target: <span className="text-white">server_workspaces/{prototypeReq?.name}</span>
          </p>
          {error && (
            <div className="mt-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-xs text-rose-200">
              {error}
            </div>
          )}
        </div>

        {/* 2-Column Progress & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Stages */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col gap-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Architectural Milestones
              </h3>

              <div className="flex flex-col gap-4">
                {stages.map((stage, idx) => (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="mt-0.5 shrink-0">
                      {stage.status === 'completed' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : stage.status === 'active' ? (
                        <div className="w-6 h-6 rounded-full bg-[#c4f042]/20 text-[#c4f042] border border-[#c4f042]/40 flex items-center justify-center">
                          <Loader2 size={13} className="animate-spin" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-xs font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${stage.status === 'completed' ? 'text-slate-200' : stage.status === 'active' ? 'text-white' : 'text-slate-500'}`}>
                        {stage.title}
                      </h4>
                      <p className="text-xs text-slate-400">{stage.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Created Files List */}
            <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/10 backdrop-blur-xl flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Synthesized Files
                </h3>
                <span className="text-xs font-bold text-[#c4f042]">{createdFiles.length} files</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {createdFiles.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Synthesizing file structure...</p>
                ) : (
                  createdFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs animate-fadeIn">
                      <div className="flex items-center gap-2 text-slate-300 font-mono">
                        <FileCode size={14} className="text-blue-400" />
                        <span>{file}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">Ready</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Code Streaming Log Terminal */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/70 backdrop-blur-2xl p-6 flex flex-col gap-4 shadow-2xl h-[420px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">NovaDesk AI Compiler Engine</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Live Stream
                </span>
              </div>

              <pre className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-[#c4f042]/20">
                {streamLog}
              </pre>

              {isDone && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Loading IDE workspace...</span>
                  <button
                    onClick={() => {
                      if (prototypeReq && generatedPath) {
                        openCodespace(prototypeReq.name, generatedPath);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#c4f042] text-black font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition cursor-pointer"
                  >
                    <span>Open in IDE</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-white/5 py-4 text-center text-xs text-slate-500">
        NovaDesk AI Prototyping Platform &bull; Server Sandbox
      </footer>
    </div>
  );
}
