import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  FileCode, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  X, 
  ChevronRight, 
  Activity, 
  Zap, 
  Compass 
} from 'lucide-react';
import { http } from '../../services/http';
import { motion } from 'framer-motion';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  agent: string;
  depends_on: string[];
  target_files?: string[];
  estimated_complexity?: 'Low' | 'Medium' | 'High';
}

export interface StepCriteria {
  name: string;
  met: boolean;
  detail: string;
}

export interface StepFileStatus {
  path: string;
  exists: boolean;
  size_bytes: number;
  status: string;
}

export interface StepVerificationResult {
  step_id: string;
  title: string;
  description: string;
  agent: string;
  status: 'completed' | 'in_progress' | 'pending';
  percent: number;
  passed_checks: number;
  total_checks: number;
  badge_message: string;
  criteria: StepCriteria[];
  target_files: StepFileStatus[];
  project_dir: string;
}

export interface ProjectProgressMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  initialTasks?: TaskItem[];
  defaultMode?: 'extension' | 'dashboard';
}

export function ProjectProgressMonitor({
  isOpen,
  onClose,
  projectName = 'default-project',
  initialTasks,
  defaultMode = 'extension',
}: ProjectProgressMonitorProps) {
  const [viewMode, setViewMode] = useState<'extension' | 'dashboard'>(defaultMode);
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (initialTasks && initialTasks.length > 0) return initialTasks;
    // Default starter plan if none passed
    return [
      {
        id: 't1',
        title: 'Project Scaffolding & Configuration',
        description: 'Initialize build setup, package.json dependencies, and root index file.',
        agent: 'architect',
        depends_on: [],
        target_files: ['package.json', 'README.md'],
        estimated_complexity: 'Low'
      },
      {
        id: 't2',
        title: 'Core Layout & Navigation Components',
        description: 'Build responsive navigation, header, and container layouts.',
        agent: 'coder',
        depends_on: ['t1'],
        target_files: ['src/components/Header.jsx', 'src/App.jsx'],
        estimated_complexity: 'Medium'
      },
      {
        id: 't3',
        title: 'Interactive Business Logic & State Handlers',
        description: 'Implement dynamic dashboard features, state hooks, and client filters.',
        agent: 'coder',
        depends_on: ['t2'],
        target_files: ['src/components/Dashboard.jsx'],
        estimated_complexity: 'High'
      },
      {
        id: 't4',
        title: 'Verification, Tests & Quality Assurance',
        description: 'Run automated smoke tests, syntax validation, and review criteria.',
        agent: 'testing',
        depends_on: ['t3'],
        target_files: ['tests/smoke.test.js'],
        estimated_complexity: 'Low'
      }
    ];
  });

  const [stepResults, setStepResults] = useState<StepVerificationResult[]>([]);
  const [overallPercent, setOverallPercent] = useState<number>(0);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [autoMonitor, setAutoMonitor] = useState<boolean>(true);
  const [activeStepId, setActiveStepId] = useState<string>('t1');
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [isCompletingStep, setIsCompletingStep] = useState<string | null>(null);

  // Sync tasks when initialTasks change
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTasks(initialTasks);
      setActiveStepId(initialTasks[0].id);
    }
  }, [initialTasks]);

  // Run audit across all tasks
  const runFullAudit = async (showLoading = true) => {
    if (showLoading) setIsAuditing(true);
    try {
      const resp = await http.post<{
        ok: boolean;
        project_name: string;
        workspace_dir: string;
        overall_percent: number;
        is_fully_completed: boolean;
        summary: { total_steps: number; completed: number; in_progress: number; pending: number };
        step_results: StepVerificationResult[];
      }>('/api/ai/monitor/verify-all', {
        project_name: projectName,
        tasks: tasks,
      });

      if (resp.data && resp.data.ok) {
        setStepResults(resp.data.step_results);
        setOverallPercent(resp.data.overall_percent);

        const timeStr = new Date().toLocaleTimeString();
        setAuditLog((prev) => [
          `[${timeStr}] Audit Complete: ${resp.data.overall_percent}% verified (${resp.data.summary.completed}/${resp.data.summary.total_steps} steps complete).`,
          ...prev.slice(0, 19),
        ]);
      }
    } catch (err: any) {
      console.error('Audit error:', err);
    } finally {
      if (showLoading) setIsAuditing(false);
    }
  };

  // Run initial audit on open
  useEffect(() => {
    if (isOpen) {
      runFullAudit(true);
    }
  }, [isOpen, projectName, tasks]);

  // Periodic Auto-Monitoring interval (every 5 seconds)
  useEffect(() => {
    if (!isOpen || !autoMonitor) return;
    const interval = setInterval(() => {
      runFullAudit(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, autoMonitor, projectName, tasks]);

  // Auto-complete a specific step with AI
  const handleAutoCompleteStep = async (stepId: string) => {
    const targetTask = tasks.find((t) => t.id === stepId);
    if (!targetTask) return;

    setIsCompletingStep(stepId);
    try {
      const resp = await http.post<{
        ok: boolean;
        created_files: string[];
        step: StepVerificationResult;
      }>('/api/ai/monitor/auto-complete-step', {
        project_name: projectName,
        step_id: stepId,
        title: targetTask.title,
        description: targetTask.description,
        target_files: targetTask.target_files || [],
      });

      if (resp.data && resp.data.ok) {
        const timeStr = new Date().toLocaleTimeString();
        setAuditLog((prev) => [
          `[${timeStr}] AI Auto-Completed Step "${targetTask.title}" (Created: ${resp.data.created_files.join(', ') || 'verified'}).`,
          ...prev.slice(0, 19),
        ]);
        // Refresh full audit
        await runFullAudit(false);
      }
    } catch (err: any) {
      console.error('Auto complete error:', err);
    } finally {
      setIsCompletingStep(null);
    }
  };

  // Copy full verification audit report
  const handleCopyReport = () => {
    const lines = [
      `# 📋 Project Progress Verification Audit: ${projectName}`,
      `Generated by NovaDesk Autonomous Progress Monitor &bull; ${new Date().toLocaleString()}`,
      `\n## Overall Progress: ${overallPercent}% Verified`,
      `\n### Step Breakdown:`,
    ];

    stepResults.forEach((s, idx) => {
      lines.push(`\n#### Step ${idx + 1}: ${s.title} [${s.status.toUpperCase()} - ${s.percent}%]`);
      lines.push(`- **Agent Assignment**: \`${s.agent}\``);
      lines.push(`- **Criteria Evaluation**:`);
      s.criteria.forEach((c) => {
        lines.push(`  - [${c.met ? 'x' : ' '}] **${c.name}**: ${c.detail}`);
      });
      lines.push(`- **Target Artifacts**:`);
      s.target_files.forEach((f) => {
        lines.push(`  - \`${f.path}\`: ${f.status} (${f.size_bytes} B)`);
      });
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (!isOpen) return null;

  const activeResult = stepResults.find((s) => s.step_id === activeStepId) || stepResults[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/30 backdrop-blur-sm animate-fade-in font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className={`glass-panel rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/90 ${
          viewMode === 'extension'
            ? 'w-full max-w-md h-[92vh] max-h-[720px]'
            : 'w-full max-w-5xl h-[90vh] max-h-[840px]'
        }`}
      >
        {/* HEADER BAR (Chrome Extension / Modern App Style) */}
        <div className="px-5 py-4 bg-white/80 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-none">
                  Project Monitor
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {viewMode === 'extension' ? 'Web Extension' : 'Full Dashboard'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Workspace: <span className="font-semibold text-slate-700">{projectName}</span>
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'extension' ? 'dashboard' : 'extension')}
              title={viewMode === 'extension' ? 'Switch to Full Dashboard' : 'Switch to Web Extension Mode'}
              className="p-2 rounded-xl glass-button text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1"
            >
              {viewMode === 'extension' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Dashboard</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Extension Mode</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROGRESS METRICS & CONTROLS STRIP */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50/60 via-white/70 to-indigo-50/60 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Radial Progress Ring & Percent */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-slate-200"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-blue-600 transition-all duration-700 ease-out"
                  strokeWidth="4"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * overallPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-900">
                {overallPercent}%
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {overallPercent === 100 ? 'Project Fully Verified 🎉' : 'Step-by-Step Progress'}
                </span>
                {overallPercent === 100 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stepResults.filter((s) => s.status === 'completed').length} of {tasks.length} steps verified to completion
              </p>
            </div>
          </div>

          {/* Action Glass Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => runFullAudit(true)}
              disabled={isAuditing}
              className="py-1.5 px-3 glass-button rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm text-slate-700 hover:text-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isAuditing ? 'Auditing...' : 'Audit All'}</span>
            </button>

            <button
              onClick={() => setAutoMonitor(!autoMonitor)}
              className={`py-1.5 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                autoMonitor
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90'
                  : 'glass-button text-slate-600'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${autoMonitor ? 'animate-pulse text-emerald-600' : ''}`} />
              <span>Auto-Monitor: {autoMonitor ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {viewMode === 'extension' ? (
            /* ─────────────────────────────────────────────────────────── */
            /* WEB EXTENSION POPUP VIEW (Compact, focused on steps & next) */
            /* ─────────────────────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Active Next Step Card */}
              {activeResult && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-blue-50/50 border border-blue-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      Active Step • {activeResult.agent}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeResult.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : (activeResult.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700')
                    }`}>
                      {activeResult.percent}% Complete
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {activeResult.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {activeResult.description}
                  </p>

                  {/* Target files in this step */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                    {activeResult.target_files.map((tf, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-mono px-2 py-1 rounded-lg flex items-center gap-1 border ${
                          tf.exists
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-800 border-rose-200/80'
                        }`}
                      >
                        {tf.exists ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-rose-500" />}
                        {tf.path}
                      </span>
                    ))}
                  </div>

                  {/* Step Action */}
                  <div className="mt-3.5 flex items-center gap-2">
                    {activeResult.status !== 'completed' ? (
                      <button
                        onClick={() => handleAutoCompleteStep(activeResult.step_id)}
                        disabled={isCompletingStep === activeResult.step_id}
                        className="w-full py-2 px-3 glass-button-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {isCompletingStep === activeResult.step_id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Completing with AI...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Auto-Complete Step with AI</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full py-1.5 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                        Step Fully Verified
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Steps Mini Checklist */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
                  <span>Project Task Graph Checklist</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Click step to inspect
                  </span>
                </h4>

                <div className="space-y-2">
                  {tasks.map((task, idx) => {
                    const res = stepResults.find((s) => s.step_id === task.id);
                    const isCompleted = res?.status === 'completed';
                    const isSelected = activeStepId === task.id;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setActiveStepId(task.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                            : 'bg-white/80 hover:bg-white border-slate-200/80 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 leading-snug">
                                {task.title}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Agent: {task.agent} &bull; {task.target_files?.length || 1} target files
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCompleted 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : ((res?.percent || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')
                            }`}>
                              {res ? `${res.percent}%` : '0%'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mini Audit Feed */}
              <div className="mt-4 pt-3 border-t border-slate-200/70">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Live Audit Feed
                </span>
                <div className="mt-2 bg-slate-900 text-slate-200 rounded-xl p-2.5 font-mono text-[10px] max-h-24 overflow-y-auto space-y-1">
                  {auditLog.length > 0 ? (
                    auditLog.map((log, i) => (
                      <div key={i} className="text-slate-300 leading-tight">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">Waiting for audit events...</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────── */
            /* FULL PANORAMA DASHBOARD VIEW (Two-column deep inspector)   */
            /* ─────────────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
              {/* Left Column: Step List & DAG Graph */}
              <div className="md:col-span-5 space-y-3 flex flex-col">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Execution Graph & Verification Status
                </h4>

                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                  {tasks.map((task, idx) => {
                    const res = stepResults.find((s) => s.step_id === task.id);
                    const isCompleted = res?.status === 'completed';
                    const isSelected = activeStepId === task.id;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setActiveStepId(task.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-300/90 shadow-sm'
                            : 'bg-white/80 hover:bg-white border-slate-200/80 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {task.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                {task.description}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  {task.agent}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {task.target_files?.length || 1} files
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isCompleted 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ((res?.percent || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')
                          }`}>
                            {res ? `${res.percent}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Deep Verification Inspector */}
              <div className="md:col-span-7 bg-white/85 rounded-2xl border border-slate-200/90 p-5 flex flex-col overflow-y-auto">
                {activeResult ? (
                  <div className="space-y-4">
                    {/* Header of Active Step */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            STEP {activeResult.step_id.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            Agent: {activeResult.agent}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                          {activeResult.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {activeResult.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-slate-900">
                          {activeResult.percent}%
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          activeResult.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (activeResult.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')
                        }`}>
                          {activeResult.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Criteria Verification Checklist */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Verification Criteria & Syntax Check</span>
                      </h4>

                      <div className="space-y-2">
                        {activeResult.criteria.map((c, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                              c.met 
                                ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900' 
                                : 'bg-slate-50 border-slate-200/80 text-slate-800'
                            }`}
                          >
                            {c.met ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-semibold">{c.name}</div>
                              <div className="text-[11px] opacity-80 mt-0.5">{c.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Target Files Details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-indigo-600" />
                        <span>Target Workspace Artifacts</span>
                      </h4>

                      <div className="space-y-1.5">
                        {activeResult.target_files.map((tf, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                          >
                            <span className="font-mono text-slate-800 font-medium">
                              {tf.path}
                            </span>
                            <div className="flex items-center gap-2">
                              {tf.exists ? (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Exists ({tf.size_bytes} B)
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Missing
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar for this step */}
                    <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        {activeResult.badge_message}
                      </div>

                      {activeResult.status !== 'completed' && (
                        <button
                          onClick={() => handleAutoCompleteStep(activeResult.step_id)}
                          disabled={isCompletingStep === activeResult.step_id}
                          className="py-2 px-4 glass-button-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          {isCompletingStep === activeResult.step_id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating with AI...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              <span>Auto-Complete Step with AI</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Select a step to inspect criteria
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BAR (Export report & summary) */}
        <div className="px-5 py-3 bg-white/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Engine:</span>
            <span className="font-semibold text-slate-800">NovaDesk Autonomous Verifier</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500">Checkpoints:</span>
            <span className="font-semibold text-blue-600">Until Last Point Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="py-1.5 px-3 glass-button rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs text-slate-700 hover:text-slate-900"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Report Copied!' : 'Copy Audit Report'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ProjectProgressMonitor;
