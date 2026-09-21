import { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Cpu,
  Layers,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  Building,
  Target,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import {
  checkAgent1Health,
  analyzeDocumentsWithAgent1,
  type Agent1AnalysisResult,
  type Agent1HealthResponse,
} from '../services/agent1Service';
import {
  getAgent1EvaluationByAnalysisId,
  isSupabaseConnected,
} from '../services/supabaseService';
import type { AnalysisRecord } from '../services/analysisStorage';

interface Agent1DiligenceViewProps {
  activeAnalysis: AnalysisRecord;
  onAnalysisChange?: (updated: AnalysisRecord) => void;
  onNavigateToDashboard?: () => void;
}

export default function Agent1DiligenceView({
  activeAnalysis,
  onNavigateToDashboard,
}: Agent1DiligenceViewProps) {
  // Backend health state
  const [health, setHealth] = useState<Agent1HealthResponse>({ online: false });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis execution state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<Agent1AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active result view tab
  const [resultTab, setResultTab] = useState<
    'overview' | 'founders' | 'financials' | 'contradictions' | 'evidence' | 'risks' | 'raw'
  >('overview');

  // UI helpers
  const [copiedJson, setCopiedJson] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

  // Check health on mount and periodic poll
  const verifyHealth = async () => {
    setIsCheckingHealth(true);
    const res = await checkAgent1Health();
    setHealth(res);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch existing evaluation from Supabase when activeAnalysis changes
  useEffect(() => {
    if (!activeAnalysis?.id) return;
    let isMounted = true;
    setDbLoading(true);

    getAgent1EvaluationByAnalysisId(activeAnalysis.id)
      .then((record) => {
        if (!isMounted || !record) return;
        setAnalysisResult({
          status: record.status,
          uploaded_files: record.uploaded_files as any,
          document_analyses: record.document_analyses || [],
          merged_analysis: record.merged_analysis,
          contradictions: record.contradictions || [],
          validation_errors: record.validation_errors || [],
          evaluation_id: record.id,
          supabase_synced: true,
        });
      })
      .catch((err) => console.warn('Supabase fetch error:', err))
      .finally(() => {
        if (isMounted) setDbLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeAnalysis?.id]);

  // File selection handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(pdf|pptx|docx)$/i.test(f.name)
      );
      if (dropped.length > 0) {
        setSelectedFiles((prev) => [...prev, ...dropped]);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Run live analysis
  const handleRunAnalysis = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one document (.pdf, .pptx, or .docx) to analyze.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setAnalyzeStep('Uploading files to Agent 1 engine...');

    const stepTimer1 = setTimeout(() => {
      setAnalyzeStep('Extracting text and structure (PyMuPDF / docx / pptx)...');
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setAnalyzeStep('Invoking LangGraph multi-document intelligence graph...');
    }, 3200);

    const stepTimer3 = setTimeout(() => {
      setAnalyzeStep('Synthesizing metrics, validating claims, and checking contradictions...');
    }, 6000);

    try {
      const res = await analyzeDocumentsWithAgent1(
        selectedFiles,
        activeAnalysis.id,
        activeAnalysis.title
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (res.success && res.result) {
        setAnalysisResult(res.result);
        setAnalyzeStep('Analysis complete and synced to Supabase!');
      } else {
        setErrorMsg(res.error || 'Agent 1 analysis failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Agent 1.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const merged = analysisResult?.merged_analysis;
  const docAnalyses = analysisResult?.document_analyses || [];
  const contradictions = analysisResult?.contradictions || [];

  // Copy JSON output
  const handleCopyJson = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const isEvaluationFailed =
    analysisResult?.status === 'merge_failed' ||
    analysisResult?.status === 'parse_failed' ||
    analysisResult?.status === 'analysis_failed' ||
    (!merged && docAnalyses.length === 0 && (analysisResult?.validation_errors?.length || 0) > 0);

  return (
    <div className="space-y-6">
      {/* HEADER / NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAEBF2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEECFC] text-[#5028E0] tracking-wider uppercase">
              Agent 1 • Multi-Document Ingestion
            </span>
            {health.online ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Backend Online (Port 8001)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                Backend Standby (Port 8001)
              </span>
            )}
            {isSupabaseConnected() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                <Database className="w-3 h-3" />
                Supabase Connected
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#1E1B2E]">
            Document Diligence & Contradiction Engine
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Active Venture: <strong className="text-[#1E1B2E]">{activeAnalysis.title}</strong>{' '}
            • Ingest pitch decks, financial models, and founder briefs for cross-verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={verifyHealth}
            disabled={isCheckingHealth}
            className="p-2 text-[#64748B] hover:text-[#5028E0] hover:bg-[#F8F9FE] rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Refresh Agent 1 Status"
          >
            <RotateCw className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
          </button>
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-4 py-2 text-xs font-semibold text-[#5028E0] bg-[#EEECFC] hover:bg-[#DDD6FE] rounded-xl transition-colors cursor-pointer"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* OFFLINE NOTICE (IF BACKEND NOT REACHABLE) */}
      {!health.online && (
        <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-[#92400E]">Agent 1 FastAPI Backend is not detected on port 8001.</p>
            <p className="text-[#B45309]">
              To launch the live LangGraph document analyzer, run this command in your terminal:
            </p>
            <code className="block bg-[#FEF3C7] text-[#78350F] px-2.5 py-1.5 rounded-lg font-mono text-[11px] select-all">
              cd Agent1/Agent_1/backend; ..\..\..\Agent-6\backend\venv\Scripts\uvicorn app.main:app --port 8001 --reload
            </code>
          </div>
        </div>
      )}

      {/* UPLOAD & CONTROLS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone Card */}
        <div className="lg:col-span-2 rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E1B2E]">Ingest Documents for Analysis</h2>
              <p className="text-xs text-[#64748B]">
                Upload 1 or more documents (.pdf, .pptx, .docx). Agent 1 will extract facts, cross-examine claims, and detect contradictions.
              </p>
            </div>
            <span className="text-xs font-bold text-[#5028E0] bg-[#F4F1FD] px-2.5 py-1 rounded-lg">
              {selectedFiles.length} file(s) selected
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-[#5028E0] bg-[#EEECFC]/40'
                : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#5028E0]'
            }`}
            onClick={() => document.getElementById('agent1-file-input')?.click()}
          >
            <UploadCloud className="w-10 h-10 text-[#5028E0] mx-auto mb-2" />
            <h3 className="font-bold text-sm text-[#1E1B2E]">
              Drop Pitch Decks, Financials, or Updates here
            </h3>
            <p className="text-xs text-[#64748B] mt-1 mb-4">
              Supports PDF, DOCX, and PPTX presentations up to 50MB each
            </p>
            <label
              htmlFor="agent1-file-input"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 bg-[#5028E0] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#4320BD] cursor-pointer shadow-xs transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Browse Files</span>
            </label>
            <input
              id="agent1-file-input"
              type="file"
              multiple
              accept=".pdf,.docx,.pptx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Selected File Badges */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-[#64748B]">Files Queued for Analysis:</span>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-2 bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-[#5028E0]" />
                    <span className="font-medium text-[#1E1B2E] max-w-[200px] truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-[#94A3B8] hover:text-[#EF4444] ml-1 text-sm font-bold leading-none cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#B91C1C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button & Live Progress */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              disabled={isAnalyzing || selectedFiles.length === 0}
              onClick={handleRunAnalysis}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                isAnalyzing || selectedFiles.length === 0
                  ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#5028E0] hover:bg-[#4320BD] text-white shadow-[#5028E0]/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Processing Diligence...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Run Multi-Document Diligence</span>
                </>
              )}
            </button>

            {isAnalyzing && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5028E0] bg-[#EEECFC] px-3.5 py-2 rounded-xl animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#5028E0]" />
                <span>{analyzeStep}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Card: Engine Specs */}
        <div className="rounded-2xl border border-[#EAEBF2] bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1E1B2E] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#5028E0]" />
              <span>Agent 1 Architecture</span>
            </h3>
            <ul className="text-xs text-[#64748B] space-y-2.5 divide-y divide-[#F1F5F9]">
              <li className="pt-1.5 flex justify-between">
                <span>Model Engine:</span>
                <strong className="text-[#1E1B2E]">Neural Vision & Diligence LLM</strong>
              </li>
              <li className="pt-1.5 flex justify-between">
                <span>Orchestration:</span>
                <strong className="text-[#1E1B2E]">LangGraph Multi-Workflow</strong>
              </li>
              <li className="pt-1.5 flex justify-between">
                <span>Parsers:</span>
                <strong className="text-[#1E1B2E]">PyMuPDF, Docx, Pptx</strong>
              </li>
              <li className="pt-1.5 flex justify-between">
                <span>Database:</span>
                <strong className="text-[#10B981]">Supabase (agent1_evaluations)</strong>
              </li>
              <li className="pt-1.5 flex justify-between">
                <span>Port:</span>
                <strong className="text-[#5028E0]">8001 (FastAPI)</strong>
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-[#F8F9FE] rounded-xl border border-[#E2E8F0] text-[11px] text-[#64748B] space-y-1">
            <div className="flex items-center gap-1.5 text-[#5028E0] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Contradiction Detection</span>
            </div>
            <p>
              When multiple documents are provided (e.g. pitch deck vs. investor update), Agent 1 highlights discrepancy risks such as ARR inconsistencies or altered churn numbers.
            </p>
          </div>
        </div>
      </div>

      {/* RESULTS DISPLAY SECTION */}
      {analysisResult ? (
        <div className="rounded-2xl border border-[#EAEBF2] bg-white shadow-sm overflow-hidden">
          {/* Result Header & Status */}
          <div className="p-6 border-b border-[#EAEBF2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isEvaluationFailed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                    <AlertCircle className="w-3 h-3" />
                    Extraction / Parsing Incomplete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    <CheckCircle2 className="w-3 h-3" />
                    Evaluation Completed
                  </span>
                )}
                {analysisResult.supabase_synced && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8]">
                    <Database className="w-3 h-3" />
                    Stored in Database
                  </span>
                )}
                {contradictions.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                    <AlertTriangle className="w-3 h-3" />
                    {contradictions.length} Contradiction(s) Flagged
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#1E1B2E]">
                {merged?.startup_name || activeAnalysis.title} Intelligence Synthesis
              </h2>
              <p className="text-xs text-[#64748B]">
                Synthesized across {analysisResult.uploaded_files?.length || 1} ingested source file(s).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#1E1B2E] transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#64748B]" />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>

          {/* Validation Warnings / Extraction Notice Banner */}
          {analysisResult.validation_errors && analysisResult.validation_errors.length > 0 && (
            <div className="p-4 bg-[#FFFBEB] border-b border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[#B45309]">Notice: Document Extraction Issues Detected</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {analysisResult.validation_errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-[#78350F] pt-1">
                  Tip: When pitch deck slides are graphical or image-only, the backend automatically uses multimodal vision transcription. Check the Raw State tab below for detailed logs.
                </p>
              </div>
            </div>
          )}

          {/* Supabase Cloud Persistence Status Banner */}
          {analysisResult.supabase_synced && (
            <div className="px-6 py-3.5 bg-[#F0FDF4] border-b border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-[#166534]">
                <Database className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>
                  <strong>Supabase Verified:</strong> Evaluation stored in <code className="bg-[#DCFCE7] px-1.5 py-0.5 rounded text-[11px] font-mono">agent1_evaluations</code> ({analysisResult.evaluation_id || 'active'}).
                </span>
              </div>
              {analysisResult.uploaded_files && analysisResult.uploaded_files.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {analysisResult.uploaded_files.map((uf, idx) => (uf as any).storage_url ? (
                    <a
                      key={idx}
                      href={(uf as any).storage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#15803D] bg-white border border-[#86EFAC] hover:bg-[#DCFCE7] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="View pitch deck directly in Supabase Cloud Storage"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{uf.original_filename} (Supabase Storage)</span>
                    </a>
                  ) : null)}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tabs Navigation */}
          <div className="flex items-center gap-1 p-2 border-b border-[#EAEBF2] bg-white overflow-x-auto">
            {[
              { id: 'overview', label: 'Executive Overview', icon: Building },
              { id: 'founders', label: 'Founders & Team', icon: Users },
              { id: 'financials', label: 'Financials & Traction', icon: DollarSign },
              {
                id: 'contradictions',
                label: `Contradictions (${contradictions.length})`,
                icon: AlertTriangle,
                highlight: contradictions.length > 0,
              },
              { id: 'evidence', label: 'Evidence & Citations', icon: FileCheck2 },
              { id: 'risks', label: 'Risks & Missing Data', icon: Target },
              { id: 'raw', label: 'Raw State', icon: FileSpreadsheet },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = resultTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setResultTab(t.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#EEECFC] text-[#5028E0]'
                      : t.highlight
                      ? 'text-[#DC2626] hover:bg-[#FEF2F2]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E1B2E]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          <div className="p-6">
            {/* 1. EXECUTIVE OVERVIEW */}
            {resultTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                        Executive Summary
                      </span>
                      <p className="text-sm font-medium text-[#1E1B2E] mt-1 leading-relaxed">
                        {merged?.description ||
                          docAnalyses[0]?.description ||
                          'No executive summary description generated.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                        <span className="text-[11px] text-[#64748B]">Industry / Sector</span>
                        <p className="text-xs font-bold text-[#1E1B2E] mt-0.5">
                          {merged?.industry || docAnalyses[0]?.industry || 'Technology'} •{' '}
                          {merged?.sector || docAnalyses[0]?.sector || 'SaaS'}
                        </p>
                      </div>
                      <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                        <span className="text-[11px] text-[#64748B]">Target Customers</span>
                        <p className="text-xs font-bold text-[#1E1B2E] mt-0.5">
                          {merged?.target_customers || docAnalyses[0]?.target_customers || 'B2B Enterprise'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-[#F8F9FE] rounded-2xl border border-[#DDD6FE]">
                      <span className="text-xs font-bold text-[#5028E0] uppercase tracking-wider">
                        Business & Monetization Model
                      </span>
                      <p className="text-xs font-medium text-[#1E1B2E] mt-1.5 leading-relaxed">
                        {merged?.business_model ||
                          docAnalyses[0]?.business_model ||
                          'Subscription SaaS / Platform Fee model.'}
                      </p>
                    </div>

                    {/* Market Sizing Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-center">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase">TAM</span>
                        <p className="text-sm font-bold text-[#5028E0] mt-0.5">
                          {merged?.market_size?.tam || docAnalyses[0]?.market_size?.tam || 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-center">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase">SAM</span>
                        <p className="text-sm font-bold text-[#1E1B2E] mt-0.5">
                          {merged?.market_size?.sam || docAnalyses[0]?.market_size?.sam || 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl text-center">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase">SOM</span>
                        <p className="text-sm font-bold text-[#1E1B2E] mt-0.5">
                          {merged?.market_size?.som || docAnalyses[0]?.market_size?.som || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FOUNDERS & TEAM */}
            {resultTab === 'founders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1E1B2E]">Identified Founders & Leaders</h3>
                  <span className="text-xs text-[#64748B]">
                    {merged?.founders?.length || docAnalyses[0]?.founders?.length || 0} Member(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(merged?.founders || docAnalyses[0]?.founders || []).map((founder, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#5028E0] transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#1E1B2E]">
                          {founder.name || `Founder #${idx + 1}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEECFC] text-[#5028E0]">
                          {founder.role || 'Executive'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {founder.background || 'Background details extracted from document profiles.'}
                      </p>
                    </div>
                  ))}
                  {(merged?.founders || docAnalyses[0]?.founders || []).length === 0 && (
                    <div className="p-8 text-center text-xs text-[#94A3B8] col-span-2">
                      No distinct founder records found in the uploaded documents.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. FINANCIALS & TRACTION */}
            {resultTab === 'financials' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'ARR', val: merged?.financials?.arr || docAnalyses[0]?.financials?.arr },
                    { label: 'MRR', val: merged?.financials?.mrr || docAnalyses[0]?.financials?.mrr },
                    { label: 'Burn Rate', val: merged?.financials?.burn_rate || docAnalyses[0]?.financials?.burn_rate },
                    { label: 'Runway', val: merged?.financials?.runway || docAnalyses[0]?.financials?.runway },
                    { label: 'Growth Rate', val: merged?.financials?.growth_rate || docAnalyses[0]?.financials?.growth_rate },
                    { label: 'Gross Margin', val: merged?.financials?.gross_margin || docAnalyses[0]?.financials?.gross_margin },
                    { label: 'CAC', val: merged?.financials?.cac || docAnalyses[0]?.financials?.cac },
                    { label: 'LTV', val: merged?.financials?.ltv || docAnalyses[0]?.financials?.ltv },
                  ].map((m, i) => (
                    <div key={i} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <span className="text-[11px] font-medium text-[#64748B]">{m.label}</span>
                      <p className="text-base font-bold text-[#1E1B2E] mt-1">
                        {m.val && m.val !== 'None' ? m.val : 'Not specified'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#1E1B2E] flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#10B981]" />
                      <span>Customer Traction</span>
                    </span>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {merged?.traction || docAnalyses[0]?.traction || 'No specific customer traction stated.'}
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#1E1B2E] flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#5028E0]" />
                      <span>Funding & Investors</span>
                    </span>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Raised: <strong>{merged?.funding_raised || docAnalyses[0]?.funding_raised || 'Undisclosed'}</strong>
                      {merged?.investors?.length ? ` • Investors: ${merged.investors.join(', ')}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CONTRADICTIONS & CROSS-DOCUMENT DISCREPANCIES */}
            {resultTab === 'contradictions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1E1B2E]">Cross-Document Contradiction Radar</h3>
                    <p className="text-xs text-[#64748B]">
                      Flags discrepancies between multiple documents (e.g. conflicting financial claims or metrics).
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626]">
                    {contradictions.length} Issue(s)
                  </span>
                </div>

                {contradictions.length > 0 ? (
                  <div className="space-y-3">
                    {contradictions.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2]/30 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#991B1B]">
                            {c.topic || `Discrepancy #${idx + 1}`}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] uppercase">
                            {c.severity || 'Medium'} Severity
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 bg-white rounded-lg border border-[#FCA5A5]/60">
                            <span className="text-[10px] text-[#64748B] font-medium block mb-1">
                              Source 1 ({c.source_1 || 'Doc 1'}):
                            </span>
                            <p className="font-semibold text-[#1E1B2E]">{c.claim_1}</p>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-[#FCA5A5]/60">
                            <span className="text-[10px] text-[#64748B] font-medium block mb-1">
                              Source 2 ({c.source_2 || 'Doc 2'}):
                            </span>
                            <p className="font-semibold text-[#1E1B2E]">{c.claim_2}</p>
                          </div>
                        </div>

                        {c.explanation && (
                          <p className="text-xs text-[#7F1D1D] bg-[#FEE2E2]/60 p-2.5 rounded-lg leading-relaxed">
                            <strong>Diligence Note:</strong> {c.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#059669] bg-[#ECFDF5] rounded-xl border border-[#A7F3D0]">
                    ✓ No conflicting statements or data contradictions identified across ingested files.
                  </div>
                )}
              </div>
            )}

            {/* 5. EVIDENCE & CITATIONS */}
            {resultTab === 'evidence' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#1E1B2E]">Document Evidence Citations</h3>
                <div className="space-y-3">
                  {docAnalyses.flatMap((d) => d.evidence || []).map((ev, i) => (
                    <div
                      key={i}
                      className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1E1B2E]">{ev.claim}</span>
                        {ev.confidence && (
                          <span className="text-[10px] font-semibold text-[#5028E0] bg-[#EEECFC] px-2 py-0.5 rounded-full">
                            Confidence: {(ev.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {ev.supporting_text && (
                        <blockquote className="border-l-2 border-[#5028E0] pl-3 py-1 italic text-[#64748B]">
                          "{ev.supporting_text}"
                        </blockquote>
                      )}
                      <div className="text-[10px] text-[#94A3B8]">
                        Source: {ev.source || 'Uploaded Document'} {ev.location ? `• ${ev.location}` : ''}
                      </div>
                    </div>
                  ))}
                  {docAnalyses.every((d) => !d.evidence || d.evidence.length === 0) && (
                    <div className="p-8 text-center text-xs text-[#94A3B8]">
                      No citation blocks extracted from the document text.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. RISKS & MISSING DATA */}
            {resultTab === 'risks' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#1E1B2E] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                    <span>Identified Diligence Risks</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(merged?.risks || docAnalyses[0]?.risks || []).map((r, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] font-medium"
                      >
                        • {r}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-[#1E1B2E] flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#5028E0]" />
                    <span>Information Gaps / Missing Diligence Data</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(merged?.missing_information || docAnalyses[0]?.missing_information || []).map((m, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B]"
                      >
                        ? {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. RAW STATE */}
            {resultTab === 'raw' && (
              <pre className="p-4 bg-[#1E1B2E] text-[#A5B4FC] rounded-xl text-xs font-mono overflow-auto max-h-[500px]">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ) : dbLoading ? (
        <div className="p-12 text-center text-xs text-[#64748B] bg-white rounded-2xl border border-[#EAEBF2]">
          Checking Supabase for existing Agent 1 evaluations...
        </div>
      ) : null}
    </div>
  );
}
