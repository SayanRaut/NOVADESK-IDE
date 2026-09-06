import { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Layers, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  X, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  FileCode,
  ExternalLink
} from 'lucide-react';
import { http } from '../../services/http';
import { useApiKey } from '../../contexts/ApiKeyContext';
import { useNavigation } from '../../contexts/NavigationContext';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  agent: string;
  depends_on: string[];
  target_files?: string[];
  estimated_complexity?: 'Low' | 'Medium' | 'High';
}

interface PlanResponse {
  ok: boolean;
  project_name: string;
  template: string;
  plan: {
    goal: string;
    summary: string;
    architecture: {
      stack: string[];
      patterns?: string[];
      key_features?: string[];
    };
    tasks: TaskItem[];
  };
  markdown: string;
  tasks: TaskItem[];
  architecture: {
    stack: string[];
    patterns?: string[];
    key_features?: string[];
  };
}

interface ProjectPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialTemplate?: string;
}

export const ALL_GEMINI_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Recommended, High Speed)', badge: 'Recommended' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', badge: 'Latest' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Hybrid Reasoning)', badge: 'Fastest' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High Throughput)', badge: 'High Quota' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Production Standard)', badge: 'Stable' },
  { id: 'gemini-pro-latest', name: 'Gemini Pro Latest (Deep Reasoning)', badge: 'Pro' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Deep Reasoning 2M)', badge: 'Reasoning' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Ultra Low Latency)', badge: 'Lite' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Preview)', badge: 'Preview' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Legacy)', badge: 'Legacy' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy)', badge: 'Legacy' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Legacy)', badge: 'Legacy' },
];

export function ProjectPlannerModal({
  isOpen,
  onClose,
  initialPrompt = '',
  initialTemplate = 'react',
}: ProjectPlannerModalProps) {
  const { apiKey, hasKey, maskedKey, status: keyStatus, validateKey, saveKey } = useApiKey();
  const { startPrototypeGeneration } = useNavigation();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [template, setTemplate] = useState(initialTemplate);
  const [projectName, setProjectName] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningStage, setPlanningStage] = useState<'idle' | 'analyzing' | 'architecting' | 'validating'>('idle');
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'markdown'>('visualizer');

  // Key inline edit state
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKey, setCustomKey] = useState(apiKey);
  const [keyValidationMsg, setKeyValidationMsg] = useState<string | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialTemplate) setTemplate(initialTemplate);
  }, [initialPrompt, initialTemplate]);

  useEffect(() => {
    setCustomKey(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleTestAndSaveKey = async () => {
    if (!customKey.trim()) return;
    setIsTestingKey(true);
    setKeyValidationMsg('Testing connection with Google Gemini...');
    try {
      const result = await validateKey(customKey.trim());
      setKeyValidationMsg(result.message);
      if (result.valid) {
        await saveKey(customKey.trim());
        setTimeout(() => setShowKeyInput(false), 1200);
      }
    } catch {
      setKeyValidationMsg('Failed to verify API key.');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Please provide a project description or goal.');
      return;
    }

    setErrorMessage(null);
    setIsPlanning(true);
    setPlanningStage('analyzing');

    // Simulate animated step progression for smooth UX
    const timer1 = setTimeout(() => setPlanningStage('architecting'), 1000);
    const timer2 = setTimeout(() => setPlanningStage('validating'), 2200);

    try {
      const resp = await http.post<PlanResponse>('/api/ai/plan', {
        prompt: prompt.trim(),
        template,
        project_name: projectName.trim() || undefined,
        api_key: apiKey.trim() || undefined,
        model_id: selectedModel,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (resp.data && resp.data.ok) {
        setPlanResult(resp.data);
      } else {
        setErrorMessage('Failed to formulate plan. Please try again.');
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const msg = err?.response?.data?.detail || err?.message || 'Error formulating project plan.';
      setErrorMessage(msg);
    } finally {
      setIsPlanning(false);
      setPlanningStage('idle');
    }
  };

  const handleCopyMarkdown = () => {
    if (!planResult) return;
    navigator.clipboard.writeText(planResult.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecutePlan = () => {
    if (!planResult) return;
    startPrototypeGeneration({
      name: planResult.project_name || 'nova-app',
      template,
      prompt,
      apiKey: apiKey.trim() || undefined,
      plan: planResult.plan,
    });
    onClose();
  };

  const getAgentBadge = (agent: string) => {
    const a = (agent || 'coder').toLowerCase();
    if (a.includes('arch') || a.includes('setup')) {
      return {
        label: 'Architect',
        icon: <Layers size={13} />,
        className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
      };
    }
    if (a.includes('test')) {
      return {
        label: 'Tester',
        icon: <CheckCircle2 size={13} />,
        className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      };
    }
    if (a.includes('review') || a.includes('sec')) {
      return {
        label: 'Reviewer',
        icon: <ShieldCheck size={13} />,
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
      };
    }
    return {
      label: 'Coder',
      icon: <Code2 size={13} />,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    };
  };

  const getComplexityBadge = (complexity?: string) => {
    switch (complexity) {
      case 'High':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <BrainCircuit size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">AI Project Planner Agent</h2>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 outline-none cursor-pointer"
                >
                  {ALL_GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Autonomous architectural planning, task graph decomposition & specialist delegation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* API Key Status Pill */}
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                hasKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
              }`}
              title="Click to configure your Google Gemini API Key"
            >
              <Key size={12} />
              <span>{hasKey ? `Gemini Key: ${maskedKey}` : 'Set Gemini API Key'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Inline API Key Drawer */}
        {showKeyInput && (
          <div className="px-6 py-4 bg-blue-50/50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold">Bring Your Own Google Gemini API Key</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Get API key from Google AI Studio</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 font-mono"
              />
              <button
                onClick={handleTestAndSaveKey}
                disabled={isTestingKey || !customKey.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isTestingKey ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                <span>Verify & Save</span>
              </button>
            </div>
            {keyValidationMsg && (
              <p className={`text-[11px] mt-1.5 font-medium ${
                keyStatus === 'valid' || keyValidationMsg.includes('verified')
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {keyValidationMsg}
              </p>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Section */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Goal & Requirements
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Build an AI-assisted Task Dashboard with real-time kanban board, search filters, and analytics cards..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 resize-none transition shadow-sm"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gemini AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium"
                  >
                    {ALL_GEMINI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Technology Stack
                  </label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="react">React 18 + Vite (SPA)</option>
                    <option value="nextjs">Next.js 15 (Fullstack App Router)</option>
                    <option value="python">Python + FastAPI (Backend API)</option>
                    <option value="vanilla">Modern Fullstack (HTML/JS/Tailwind)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-cool-project"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-500" />
                <span>Decomposes requirements into an acyclic task graph with agent assignments.</span>
              </span>

              <button
                onClick={handleGeneratePlan}
                disabled={isPlanning || !prompt.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                {isPlanning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>
                      {planningStage === 'analyzing' && 'Analyzing requirements...'}
                      {planningStage === 'architecting' && 'Synthesizing DAG tasks...'}
                      {planningStage === 'validating' && 'Verifying graph cycles...'}
                      {planningStage === 'idle' && 'Planning...'}
                    </span>
                  </>
                ) : (
                  <>
                    <BrainCircuit size={14} />
                    <span>{planResult ? 'Regenerate Plan' : 'Generate Project Blueprint'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Plan Results Section */}
          {planResult && (
            <div className="space-y-5 animate-fade-in">
              {/* Executive Overview */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-100 dark:border-slate-700/80 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      Architecture Blueprint
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {planResult.plan.goal || planResult.project_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>DAG Validated</span>
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {planResult.tasks.length} Tasks
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {planResult.plan.summary}
                </p>

                {/* Tech stack chips */}
                {planResult.architecture.stack && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Stack:</span>
                    {planResult.architecture.stack.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* View Switcher */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('visualizer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'visualizer'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Execution Graph & Tasks ({planResult.tasks.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('markdown')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'markdown'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Markdown Blueprint
                  </button>
                </div>

                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Plan'}</span>
                </button>
              </div>

              {/* Tab 1: Interactive Task Cards */}
              {activeTab === 'visualizer' ? (
                <div className="space-y-3">
                  {planResult.tasks.map((task, index) => {
                    const badge = getAgentBadge(task.agent);
                    const compClass = getComplexityBadge(task.estimated_complexity);

                    return (
                      <div
                        key={task.id || index}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-800/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all shadow-xs flex flex-col gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                              {task.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                              {task.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>

                            {task.estimated_complexity && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${compClass}`}>
                                {task.estimated_complexity}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 pl-9 leading-relaxed">
                          {task.description}
                        </p>

                        <div className="pl-9 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Prerequisites:</span>
                            {task.depends_on && task.depends_on.length > 0 ? (
                              task.depends_on.map((dep) => (
                                <span
                                  key={dep}
                                  className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                                >
                                  {dep}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">None (Root Task)</span>
                            )}
                          </div>

                          {task.target_files && task.target_files.length > 0 && (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <FileCode size={11} />
                              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                                {task.target_files.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Tab 2: Formatted Markdown View */
                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {planResult.markdown}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Autonomous Engine Online &bull; Ready to execute</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            {planResult && (
              <button
                onClick={handleExecutePlan}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Execute Plan & Build Project</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
