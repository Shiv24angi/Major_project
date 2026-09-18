import { useState, useEffect } from 'react';
import {
  Code2,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  FolderGit2,
  FileCode2,
  Layers,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  Download,
  Search,
  Zap,
  Terminal,
} from 'lucide-react';
import {
  checkAgent6Health,
  getAgent6Runs,
  getAgent6RunById,
  analyzeGithubRepo,
  convertAgent6PayloadToAnalysisRecord,
  type Agent6HandoffPayload,
  type Agent6RunSummary,
  type HealthCheckResult,
  AGENT6_API_BASE,
} from '../services/agent6Service';
import {
  type AnalysisRecord,
  addAnalysis,
  setActiveAnalysisId,
} from '../services/analysisStorage';

interface Agent6DiligenceViewProps {
  activeAnalysis: AnalysisRecord;
  onAnalysisChange: (analysis: AnalysisRecord) => void;
  onNavigateToDashboard?: () => void;
}

export default function Agent6DiligenceView({
  activeAnalysis,
  onAnalysisChange,
  onNavigateToDashboard,
}: Agent6DiligenceViewProps) {
  // Connection State
  const [health, setHealth] = useState<HealthCheckResult>({
    online: false,
    latencyMs: 0,
    endpoint: AGENT6_API_BASE,
    message: 'Checking...',
  });
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Runs List State
  const [runs, setRuns] = useState<Agent6RunSummary[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');

  // Active Payload State
  const [currentPayload, setCurrentPayload] = useState<Agent6HandoffPayload | null>(
    activeAnalysis.agent6Data || null
  );

  // Analyze Form State
  const [repoInput, setRepoInput] = useState(
    activeAnalysis.codeDetails?.githubUrl || ''
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // UI Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'supported' | 'inferred' | 'unknown'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jsonCopied, setJsonCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'findings' | 'architecture' | 'handoff'>('findings');

  // Check health and load runs on mount
  useEffect(() => {
    handleCheckHealth();
    loadRuns();
  }, []);

  // When activeAnalysis changes, update payload if it has agent6Data
  useEffect(() => {
    if (activeAnalysis.agent6Data) {
      setCurrentPayload(activeAnalysis.agent6Data);
      setSelectedRunId(activeAnalysis.agent6Data.run_id || '');
      if (activeAnalysis.codeDetails?.githubUrl) {
        setRepoInput(activeAnalysis.codeDetails.githubUrl);
      }
    }
  }, [activeAnalysis]);

  const handleCheckHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await checkAgent6Health();
      setHealth(res);
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadRuns = async () => {
    const list = await getAgent6Runs();
    setRuns(list);
    if (!selectedRunId && list.length > 0) {
      // If current payload is not set, select the first run
      if (!currentPayload) {
        handleSelectRun(list[0].run_id);
      }
    }
  };

  const handleSelectRun = async (runId: string) => {
    setSelectedRunId(runId);
    setAnalyzeError(null);
    const payload = await getAgent6RunById(runId);
    if (payload) {
      setCurrentPayload(payload);
      const record = convertAgent6PayloadToAnalysisRecord(payload);
      addAnalysis(record);
      onAnalysisChange(record);
      setRepoInput(payload.github_url);
    }
  };

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = repoInput.trim();
    if (!targetUrl) {
      setAnalyzeError('Please enter a valid GitHub repository URL');
      return;
    }

    setAnalyzeError(null);
    setIsAnalyzing(true);
    setAnalyzeStep('Connecting to Agent 6 FastAPI engine (port 8000)...');

    try {
      // Step feedback simulation while waiting for API
      const stepTimer1 = setTimeout(() => {
        setAnalyzeStep('Cloning repository AST and discovering structure...');
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setAnalyzeStep('Chunking code files and extracting technical claims...');
      }, 4500);

      const result = await analyzeGithubRepo(targetUrl);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (result.success && result.payload) {
        setAnalyzeStep('Validated findings & saving Agent 2 handoff schema...');
        setCurrentPayload(result.payload);
        setSelectedRunId(result.payload.run_id);

        const record = convertAgent6PayloadToAnalysisRecord(result.payload);
        addAnalysis(record);
        setActiveAnalysisId(record.id);
        onAnalysisChange(record);
        loadRuns();
      } else {
        setAnalyzeError(result.error || 'Failed to complete analysis on backend.');
      }
    } catch (err: any) {
      setAnalyzeError(`Analysis request failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalyzeStep('');
    }
  };

  // Filtered findings
  const findings = currentPayload?.findings || [];
  const filteredFindings = findings.filter((f) => {
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || f.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchSearch =
      !searchQuery ||
      f.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.evidence.some((ev) => ev.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchCategory && matchSearch;
  });

  const categories = Array.from(new Set(findings.map((f) => f.category)));

  const handleCopyJson = () => {
    if (!currentPayload) return;
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!currentPayload) return;
    const blob = new Blob([JSON.stringify(currentPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent6_handoff_${currentPayload.run_id || 'latest'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER & LIVE CONNECTION STATUS BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAEBF2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5028E0]/10 text-[#5028E0] border border-[#5028E0]/20">
              <Zap className="w-3.5 h-3.5" />
              <span>AGENT 6 CODE DILIGENCE</span>
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">AST & Code RAG Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1E1B2E]">
            Project → Startup Technical Intelligence
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Evaluates repository architecture, verifies claims against codebase evidence, and pipes normalized data into Agent 2.
          </p>
        </div>

        {/* Backend Connection Indicator Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#F8F9FE] border border-[#E2E8F0] p-3.5 rounded-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span
                className={`w-3 h-3 rounded-full ${
                  health.online ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
              />
              {health.online && (
                <span className="animate-ping absolute w-3 h-3 rounded-full bg-[#10B981] opacity-60" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1E1B2E]">
                  {health.online ? 'Agent 6 Backend Online' : 'Backend Standby (Port 8000)'}
                </span>
                {health.online && (
                  <span className="text-[10px] font-mono bg-[#E8F8F0] text-[#059669] px-1.5 py-0.2 rounded font-semibold">
                    {health.latencyMs}ms
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#64748B] block font-mono">
                {health.endpoint} • {health.online ? 'REST & Graph Ready' : 'FastAPI Offline'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckHealth}
            disabled={checkingHealth}
            title="Ping backend server"
            className="p-1.5 rounded-lg border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#1E1B2E] hover:bg-[#F1F5F9] transition-colors cursor-pointer text-xs flex items-center gap-1 shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin text-[#5028E0]' : ''}`} />
            <span className="hidden sm:inline">Ping</span>
          </button>
        </div>
      </div>

      {/* REPOSITORY EVALUATOR INPUT BAR */}
      <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E1B2E]">
            <FolderGit2 className="w-4.5 h-4.5 text-[#5028E0]" />
            <span>Evaluate GitHub Repository with Agent 6</span>
          </div>
          <span className="text-xs text-[#94A3B8]">Direct user input sent to Agent 6 backend</span>
        </div>

        <form onSubmit={handleRunAnalysis} className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <GitBranch className="w-4.5 h-4.5 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="https://github.com/owner/repository"
              disabled={isAnalyzing}
              className="w-full pl-10 pr-4 py-3 bg-[#F8F9FE] border border-[#CBD5E1] rounded-xl text-sm text-[#1E1B2E] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#5028E0] font-mono transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isAnalyzing || !repoInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5028E0] px-6 py-3 text-sm font-bold text-white hover:bg-[#4320BD] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Codebase...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Agent 6 Pipeline</span>
              </>
            )}
          </button>
        </form>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#64748B]">
          <span className="font-semibold text-[#1E1B2E]">Sample Repos:</span>
          {[
            { label: 'Shiv24angi/EcoVerse', url: 'https://github.com/Shiv24angi/EcoVerse' },
            { label: 'vanshaggarwal27/EN2H_assignment', url: 'https://github.com/vanshaggarwal27/EN2H_assignment' },
          ].map((sample) => (
            <button
              key={sample.url}
              type="button"
              onClick={() => {
                setRepoInput(sample.url);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#F1F2F6] hover:bg-[#EEECFC] hover:text-[#5028E0] font-mono text-[11px] transition-colors cursor-pointer border border-[#E2E8F0]"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Live execution status feedback */}
        {isAnalyzing && (
          <div className="p-3.5 rounded-xl bg-[#F4F1FD] border border-[#DDD6FE] text-[#5028E0] flex items-center gap-3 animate-pulse text-xs font-semibold">
            <RotateCw className="w-4 h-4 animate-spin shrink-0" />
            <span>{analyzeStep}</span>
          </div>
        )}

        {/* Error alert */}
        {analyzeError && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{analyzeError}</span>
            </div>
            {!health.online && (
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#FECACA]">
                Tip: Start `uvicorn app.main:app --port 8000`
              </span>
            )}
          </div>
        )}
      </div>

      {/* RECORDED RUNS SELECTOR BAR */}
      <div className="rounded-2xl border border-[#EAEBF2] bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
            <Layers className="w-4 h-4 text-[#5028E0]" />
            <span>Agent 6 Evaluation Runs ({runs.length})</span>
          </div>
          <button
            type="button"
            onClick={loadRuns}
            className="text-xs text-[#5028E0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>Refresh Runs</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {runs.map((r) => {
            const isSelected = selectedRunId === r.run_id;
            return (
              <button
                key={r.run_id}
                type="button"
                onClick={() => handleSelectRun(r.run_id)}
                className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#5028E0] bg-[#F4F1FD] shadow-xs ring-1 ring-[#5028E0]'
                    : 'border-[#EAEBF2] bg-white hover:bg-[#F8F9FE] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-xs text-[#1E1B2E] truncate">
                    {r.owner}/{r.repository}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold bg-[#5028E0] text-white px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#64748B] font-mono truncate mb-1">
                  {r.run_id}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                  <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                  <span className="text-[#5028E0] font-semibold flex items-center gap-0.5">
                    Inspect <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TELEMETRY METRICS ROW */}
      {currentPayload && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#EAEBF2] shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] block">Files Discovered</span>
            <span className="text-2xl font-bold text-[#1E1B2E] block mt-0.5">
              {currentPayload.metadata?.files_discovered || 58}
            </span>
            <span className="text-[11px] text-[#10B981] font-medium flex items-center gap-1 mt-1">
              <FolderGit2 className="w-3 h-3" />
              <span>Full tree traversal</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAEBF2] shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] block">Selected for Audit</span>
            <span className="text-2xl font-bold text-[#1E1B2E] block mt-0.5">
              {currentPayload.metadata?.files_selected || 15}
            </span>
            <span className="text-[11px] text-[#5028E0] font-medium flex items-center gap-1 mt-1">
              <FileCode2 className="w-3 h-3" />
              <span>Critical manifests & modules</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAEBF2] shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] block">AST Chunks Created</span>
            <span className="text-2xl font-bold text-[#1E1B2E] block mt-0.5">
              {currentPayload.metadata?.chunks_created || 24}
            </span>
            <span className="text-[11px] text-[#64748B] font-medium flex items-center gap-1 mt-1">
              <Cpu className="w-3 h-3" />
              <span>Code RAG context windows</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#EAEBF2] shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] block">Findings Verified</span>
            <span className="text-2xl font-bold text-[#1E1B2E] block mt-0.5">
              {currentPayload.findings_summary?.supported_count || 0} /{' '}
              {currentPayload.findings_summary?.total_findings || 0}
            </span>
            <span className="text-[11px] text-[#10B981] font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>
                {Math.round(
                  ((currentPayload.findings_summary?.supported_count || 0) /
                    Math.max(1, currentPayload.findings_summary?.total_findings || 1)) *
                    100
                )}
                % Code Evidence Backed
              </span>
            </span>
          </div>
        </div>
      )}

      {/* MAIN VIEW TABS: FINDINGS MATRIX / ARCHITECTURE / HANDOFF */}
      <div className="rounded-2xl border border-[#EAEBF2] bg-white shadow-2xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#EAEBF2] px-6 py-3 gap-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'findings', label: `Technical Findings (${findings.length})`, icon: CheckCircle2 },
              { id: 'architecture', label: 'Tech Stack & Architecture', icon: Code2 },
              { id: 'handoff', label: 'Agent 6 → Agent 2 Schema', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#5028E0] text-white shadow-xs'
                      : 'text-[#64748B] hover:bg-[#F8F9FE] hover:text-[#1E1B2E]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5028E0] hover:underline cursor-pointer"
            >
              <span>View in Main Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* TAB 1: TECHNICAL FINDINGS */}
        {activeTab === 'findings' && (
          <div className="p-6 space-y-4">
            {/* Filter Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F1F2F6]">
              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Status' },
                  { id: 'supported', label: 'Supported' },
                  { id: 'inferred', label: 'Inferred' },
                  { id: 'unknown', label: 'Unknown' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      statusFilter === s.id
                        ? 'bg-[#1E1B2E] text-white'
                        : 'bg-[#F8F9FE] text-[#64748B] hover:bg-[#EAEBF2]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Category selector & search */}
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#F8F9FE] border border-[#CBD5E1] text-xs font-medium text-[#1E1B2E] focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter claims or evidence..."
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-[#F8F9FE] border border-[#CBD5E1] text-xs text-[#1E1B2E] placeholder-[#94A3B8] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              {filteredFindings.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#94A3B8]">
                  No findings match the selected filters.
                </div>
              ) : (
                filteredFindings.map((f, i) => {
                  const isSupported = f.status === 'supported';
                  const isInferred = f.status === 'inferred';
                  return (
                    <div
                      key={`${f.category}_${i}`}
                      className={`p-4 rounded-xl border transition-all ${
                        isSupported
                          ? 'border-[#D1FAE5] bg-[#F0FDF4]/50'
                          : isInferred
                          ? 'border-[#FEF3C7] bg-[#FFFBEB]/50'
                          : 'border-[#E2E8F0] bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isSupported
                                ? 'bg-[#059669] text-white'
                                : isInferred
                                ? 'bg-[#D97706] text-white'
                                : 'bg-[#64748B] text-white'
                            }`}
                          >
                            {f.status}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-[#CBD5E1] text-[#475569]">
                            {f.category.toUpperCase()}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono text-[#94A3B8]">
                          Finding #{i + 1}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-[#1E1B2E] leading-relaxed mb-3">
                        {f.claim}
                      </p>

                      {/* Evidence Files List */}
                      {f.evidence && f.evidence.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-black/5">
                          <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1 mr-1">
                            <FileCode2 className="w-3.5 h-3.5 text-[#5028E0]" />
                            <span>Evidence Files:</span>
                          </span>
                          {f.evidence.map((ev) => (
                            <span
                              key={ev}
                              className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px] font-mono text-[#1E1B2E] shadow-2xs"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TECH STACK & ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#1E1B2E] mb-3">Detected Technology Stack</h3>
              <div className="flex flex-wrap gap-2">
                {(activeAnalysis.codeDetails?.techStack || ['TypeScript', 'Node.js', 'Docker']).map((tech) => (
                  <div
                    key={tech}
                    className="px-3 py-1.5 rounded-xl bg-[#F4F1FD] border border-[#DDD6FE] text-xs font-bold text-[#5028E0] flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#5028E0]" />
                    <span>{tech}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-[#D1FAE5] bg-[#F0FDF4]/40 space-y-3">
                <span className="text-xs font-bold text-[#065F46] flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>Verified Technical Strengths</span>
                </span>
                <ul className="space-y-2 text-xs text-[#1E1B2E]">
                  {activeAnalysis.keyInsights.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#059669] font-bold shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-[#FEF3C7] bg-[#FFFBEB]/40 space-y-3">
                <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>Technical & Commercial Concerns</span>
                </span>
                <ul className="space-y-2 text-xs text-[#1E1B2E]">
                  {activeAnalysis.keyInsights.risks.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#D97706] font-bold shrink-0">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STANDARDIZED AGENT 6 -> AGENT 2 HANDOFF SCHEMA */}
        {activeTab === 'handoff' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1E1B2E] block">
                  Agent 6 → Agent 2 Handoff Payload
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Target: {currentPayload?.target_agent || 'agent_2_data_normalization'} • Run ID:{' '}
                  {currentPayload?.run_id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-semibold text-[#1E1B2E] hover:bg-[#F8F9FE] transition-colors cursor-pointer"
                >
                  {jsonCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{jsonCopied ? 'Copied' : 'Copy JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5028E0] text-xs font-semibold text-white hover:bg-[#4320BD] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-[#0F172A] text-[#E2E8F0] font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed border border-[#334155]">
              {JSON.stringify(currentPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
