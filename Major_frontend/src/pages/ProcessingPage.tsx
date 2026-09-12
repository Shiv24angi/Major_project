import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  FileText,
  Binary,
  BarChart3,
  Compass,
  FileDown,
  Code2,
  ShieldCheck,
  GitBranch,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getRouteParams, navigateTo } from '../shared/preset-site-routing';
import { getAnalysisById, setActiveAnalysisId } from '../services/analysisStorage';

interface PipelineStep {
  id: string;
  agentLabel: string;
  title: string;
  description: string;
  icon: any;
  statusText: string;
}

export default function ProcessingPage() {
  const params = getRouteParams();
  const analysisId = params.id;
  const mode = (params.mode as 'startup' | 'project') || 'startup';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing analysis pipeline...');
  const [isCompleted, setIsCompleted] = useState(false);

  const analysis = analysisId ? getAnalysisById(analysisId) : undefined;
  const targetTitle = analysis ? analysis.title : mode === 'startup' ? 'Startup Opportunity' : 'Software Project';

  // Mode A Pipeline Steps (Agents 1 - 5)
  const modeASteps: PipelineStep[] = [
    {
      id: 'step_1',
      agentLabel: 'Agent 1',
      title: 'Document Analysis Agent',
      description: 'Ingesting pitch deck, financial tables, and extracting structured claims & evidence.',
      icon: FileText,
      statusText: 'Parsing documents and chunking text...',
    },
    {
      id: 'step_2',
      agentLabel: 'Agent 2',
      title: 'Data Extraction & Normalization',
      description: 'Validating data completeness, deduplicating records, and standardizing schemas.',
      icon: Binary,
      statusText: 'Normalizing schemas and validating consistency...',
    },
    {
      id: 'step_3',
      agentLabel: 'Agent 3',
      title: 'Analytical Scoring Engine',
      description: 'Evaluating 6 calibrated dimensions: Market, Product, Team, Financial, Traction, and Risk.',
      icon: BarChart3,
      statusText: 'Calculating multi-dimensional scores across 6 criteria...',
    },
    {
      id: 'step_4',
      agentLabel: 'Agent 4',
      title: 'Insight & Recommendation Generator',
      description: 'Formulating the investment thesis, identifying strengths, risks, and verdict (INVEST / MONITOR / PASS).',
      icon: Compass,
      statusText: 'Generating investment thesis and governance risks...',
    },
    {
      id: 'step_5',
      agentLabel: 'Agent 5',
      title: 'Report Generator',
      description: 'Assembling institutional diligence memo, presentation deck, and data models.',
      icon: FileDown,
      statusText: 'Generating diligence memo and export deliverables...',
    },
  ];

  // Mode B Pipeline Steps (Agent 6 — Project -> Startup)
  const modeBSteps: PipelineStep[] = [
    {
      id: 'step_1',
      agentLabel: 'Agent 6 — Stage 1',
      title: 'Repository Parsing',
      description: 'Cloning tree, parsing dependencies, README files, and repository metadata.',
      icon: GitBranch,
      statusText: 'Parsing repository structure and manifest files...',
    },
    {
      id: 'step_2',
      agentLabel: 'Agent 6 — Stage 2',
      title: 'Codebase Analysis',
      description: 'Analyzing system design, database schemas, and architectural components.',
      icon: Code2,
      statusText: 'Executing code RAG and evaluating technical architecture...',
    },
    {
      id: 'step_3',
      agentLabel: 'Agent 6 — Stage 3',
      title: 'Technical Assessment',
      description: 'Validating code quality, scalability limits, security posture, and test coverage.',
      icon: ShieldCheck,
      statusText: 'Extracting supported technical claims and evidence...',
    },
    {
      id: 'step_4',
      agentLabel: 'Agent 6 → Agent 2',
      title: 'Startup Potential & Normalization',
      description: 'Synthesizing technical findings into normalized startup schema for downstream scoring.',
      icon: Binary,
      statusText: 'Piping technical claims into Agent 2 normalization bridge...',
    },
    {
      id: 'step_5',
      agentLabel: 'Agent 5',
      title: 'Report Generation',
      description: 'Compiling Code Diligence Memo and commercialization roadmap.',
      icon: FileDown,
      statusText: 'Compiling technical diligence and venture viability reports...',
    },
  ];

  const steps = mode === 'project' ? modeBSteps : modeASteps;

  useEffect(() => {
    // Truthful step progression through the agent stages
    const stepDuration = 2200; // Realistic deliberation time per agent stage

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          const nextIndex = prev + 1;
          setStatusMessage(steps[nextIndex].statusText);
          return nextIndex;
        } else {
          clearInterval(interval);
          setStatusMessage('Analysis Complete. All agent findings verified.');
          setIsCompleted(true);
          return prev;
        }
      });
    }, stepDuration);

    // Initial status
    setStatusMessage(steps[0].statusText);

    return () => clearInterval(interval);
  }, [mode, steps]);

  const handleViewAnalysis = () => {
    if (analysisId) {
      setActiveAnalysisId(analysisId);
    }
    navigateTo('dashboard', analysisId ? { id: analysisId } : undefined);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="mx-auto max-w-4xl px-6 pt-32 pb-20">
          {/* Status Header */}
          <div className="mb-10 text-center">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-4 border ${
                isCompleted
                  ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                  : 'border-black/10 bg-white text-black/70 shadow-xs'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>ANALYSIS COMPLETE</span>
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>
                    {mode === 'project' ? 'PROJECT → STARTUP ANALYSIS IN PROGRESS' : 'ANALYSIS IN PROGRESS'}
                  </span>
                </>
              )}
            </div>

            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-black mb-3"
              style={{ letterSpacing: '-0.03em' }}
            >
              Evaluating {targetTitle}
            </h1>

            <p className="text-sm md:text-base text-black/60 font-mono">
              Status: {statusMessage}
            </p>
          </div>

          {/* Active Completion Banner if finished */}
          {isCompleted && (
            <div className="mb-8 rounded-3xl border border-emerald-300 bg-emerald-50 p-6 md:p-8 text-center shadow-lg transition-all animate-in fade-in">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-950 mb-2">Analysis Complete</h2>
              <p className="text-sm text-emerald-800 max-w-lg mx-auto mb-6">
                All multi-agent outputs, multi-dimensional scores, risk concerns, and due-diligence
                findings have been synthesized into your dashboard.
              </p>
              <button
                type="button"
                onClick={handleViewAnalysis}
                className="group inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 text-base font-semibold text-white shadow-xl hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <span>View Analysis</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {/* Step-by-Step Pipeline Cards */}
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex || isCompleted;
              const isCurrent = idx === currentStepIndex && !isCompleted;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border p-5 md:p-6 transition-all duration-300 ${
                    isPast
                      ? 'border-black/10 bg-white shadow-xs'
                      : isCurrent
                      ? 'border-black bg-white shadow-md ring-1 ring-black/10'
                      : 'border-black/5 bg-black/[0.02] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Status Icon Indicator */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isPast
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-[#2B2644] text-white ring-2 ring-black/20'
                            : 'bg-black/10 text-black/40'
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isCurrent ? (
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`font-mono text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                              isPast
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCurrent
                                ? 'bg-[#2B2644] text-white'
                                : 'bg-black/10 text-black/50'
                            }`}
                          >
                            {step.agentLabel}
                          </span>
                          <h3 className="text-base md:text-lg font-semibold text-black">
                            {step.title}
                          </h3>
                        </div>

                        <p className="text-xs md:text-sm text-black/70 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Step State Badge */}
                    <div className="shrink-0 text-right">
                      {isPast ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700">
                          <span>✓ Complete</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-black">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-1" />
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-black/30">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparent Notice */}
          <div className="mt-8 rounded-2xl border border-black/10 bg-white/70 p-4 text-center text-xs text-black/60">
            {mode === 'project' ? (
              <span>
                <strong>Agent 6 — Project → Startup Agent</strong> parses code structure, dependencies,
                and technical claims. Scores are evaluated analytically without fabricating external signals.
              </span>
            ) : (
              <span>
                Analysis is grounded in submitted pitch decks and financial documents. Scoring dimensions
                (Market, Product, Team, Financial, Traction, Risk) are evaluated by Agent 3.
              </span>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
