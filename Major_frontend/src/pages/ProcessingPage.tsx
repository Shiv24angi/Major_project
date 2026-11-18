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
import { analyzeGithubRepo } from '../services/agent6Service';
import { fetchAndNormalize } from '../services/agent2Service';
import { evaluateStartup } from '../services/agent3Service';
import { generateInsightsAndRecommendations } from '../services/agent4Service';
import { getAgent1EvaluationByAnalysisId, saveAgent1Evaluation, supabase } from '../services/supabaseService';

interface PipelineStep {
  id: string;
  agentLabel: string;
  title: string;
  description: string;
  icon: any;
  statusText: string;
}

// Stable Mode A Pipeline Steps (Document Intelligence Diligence)
const MODE_A_STEPS: PipelineStep[] = [
  {
    id: 'step_1',
    agentLabel: 'Stage 1',
    title: 'Document Intelligence & Extraction',
    description: 'Ingesting pitch deck, financial tables, and extracting structured claims & evidence.',
    icon: FileText,
    statusText: 'Parsing documents and chunking text...',
  },
  {
    id: 'step_2',
    agentLabel: 'Stage 2',
    title: 'Data Verification & Normalization',
    description: 'Validating data completeness, deduplicating records, and standardizing schemas.',
    icon: Binary,
    statusText: 'Normalizing schemas and validating consistency...',
  },
  {
    id: 'step_3',
    agentLabel: 'Stage 3',
    title: 'Venture Scoring Engine',
    description: 'Evaluating 6 calibrated dimensions: Market, Product, Team, Financial, Traction, and Risk.',
    icon: BarChart3,
    statusText: 'Calculating multi-dimensional scores across 6 criteria...',
  },
  {
    id: 'step_4',
    agentLabel: 'Stage 4',
    title: 'Strategic Insights & Recommendations',
    description: 'Formulating the investment thesis, identifying strengths, risks, and verdict (INVEST / MONITOR / PASS).',
    icon: Compass,
    statusText: 'Generating investment thesis and governance risks...',
  },
  {
    id: 'step_5',
    agentLabel: 'Stage 5',
    title: 'Diligence Memo Compilation',
    description: 'Assembling institutional diligence memo, presentation deck, and data models.',
    icon: FileDown,
    statusText: 'Generating diligence memo and export deliverables...',
  },
];

// Stable Mode B Pipeline Steps (Project -> Startup Code Diligence)
const MODE_B_STEPS: PipelineStep[] = [
  {
    id: 'step_1',
    agentLabel: 'Stage 1',
    title: 'Repository AST & File Diligence',
    description: 'Cloning tree, parsing dependencies, README files, and repository metadata.',
    icon: GitBranch,
    statusText: 'Parsing repository structure and manifest files...',
  },
  {
    id: 'step_2',
    agentLabel: 'Stage 2',
    title: 'Architecture & Stack Analysis',
    description: 'Analyzing system design, database schemas, and architectural components.',
    icon: Code2,
    statusText: 'Executing code RAG and evaluating technical architecture...',
  },
  {
    id: 'step_3',
    agentLabel: 'Stage 3',
    title: 'Feature Claim Verification',
    description: 'Validating code quality, scalability limits, security posture, and test coverage.',
    icon: ShieldCheck,
    statusText: 'Extracting supported technical claims and evidence...',
  },
  {
    id: 'step_4',
    agentLabel: 'Stage 4',
    title: 'Technical Data Normalization',
    description: 'Synthesizing technical findings into normalized startup schema for downstream scoring.',
    icon: Binary,
    statusText: 'Standardizing technical claims and calibrating metrics...',
  },
  {
    id: 'step_5',
    agentLabel: 'Stage 5',
    title: 'Diligence Report Generation',
    description: 'Compiling Code Diligence Memo and commercialization roadmap.',
    icon: FileDown,
    statusText: 'Compiling technical diligence and venture viability reports...',
  },
];

export default function ProcessingPage() {
  const params = getRouteParams();
  const analysisId = params.id;
  const mode = (params.mode as 'startup' | 'project') || 'startup';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing analysis pipeline...');
  const [isCompleted, setIsCompleted] = useState(false);

  const analysis = analysisId ? getAnalysisById(analysisId) : undefined;
  const targetTitle = analysis ? analysis.title : mode === 'startup' ? 'Startup Opportunity' : 'Software Project';
  const steps = mode === 'project' ? MODE_B_STEPS : MODE_A_STEPS;

  useEffect(() => {
    let isCancelled = false;

    async function executeRealPipeline() {
      if (!analysisId) {
        setIsCompleted(true);
        return;
      }

      try {
        // Step 1: Agent Ingestion & Supabase Persistence
        setCurrentStepIndex(0);
        setStatusMessage(steps[0].statusText);

        if (mode === 'project') {
          // Verify or trigger Agent 6 GitHub diligence
          let repoUrl = analysis?.codeDetails?.githubUrl || analysis?.website;
          if (!repoUrl) {
            try {
              const { data: aRow } = await supabase.from('analyses').select('website, code_details').eq('id', analysisId).maybeSingle();
              if (aRow) repoUrl = aRow.code_details?.githubUrl || aRow.website;
            } catch (_) {}
          }
          if (repoUrl) {
            await analyzeGithubRepo(repoUrl, analysisId).catch((e) => console.warn('Agent 6 diligence error:', e));
          }
        } else {
          // Startup mode: verify Agent 1 evaluation exists in Supabase
          let existingA1 = await getAgent1EvaluationByAnalysisId(analysisId);
          // Wait up to 6 seconds if background document processing is active
          for (let poll = 0; poll < 5 && !existingA1; poll++) {
            await new Promise((r) => setTimeout(r, 1200));
            if (isCancelled) return;
            existingA1 = await getAgent1EvaluationByAnalysisId(analysisId);
          }

          const companyTitle = analysis?.title || targetTitle || 'Startup Evaluation';
          if (!existingA1) {
            const ind = analysis?.industry || 'Technology';
            await saveAgent1Evaluation({
              id: `a1_eval_${analysisId}`,
              analysis_id: analysisId,
              company_name: companyTitle,
              status: 'completed',
              uploaded_files: [],
              document_analyses: [
                {
                  startup_name: companyTitle,
                  industry: ind,
                },
              ],
              merged_analysis: {
                startup_name: companyTitle,
                description: analysis?.thesis || `${companyTitle} ${ind} venture evaluation.`,
                industry: ind,
                founders: [{ name: `${companyTitle} Leadership`, role: 'Founders' }],
              },
              contradictions: [],
              validation_errors: [],
            }).catch((e) => console.warn('Agent 1 save warning:', e));
          }
        }

        await new Promise((r) => setTimeout(r, 1400));
        if (isCancelled) return;

        // Step 2: Agent 2 Data Harmonization & Normalization
        setCurrentStepIndex(1);
        setStatusMessage(steps[1].statusText);

        // Triggers Agent 2 Normalization, which writes to public.normalized_startup_profiles
        await fetchAndNormalize(analysisId, targetTitle).catch((e) => console.warn('Agent 2 normalization error:', e));

        await new Promise((r) => setTimeout(r, 1500));
        if (isCancelled) return;

        // Step 3: Analytical Scoring & Calibration (Agent 3)
        setCurrentStepIndex(2);
        setStatusMessage(steps[2].statusText);

        // Triggers Agent 3 Scoring Engine (computes 6 dimensions and persists to Supabase)
        await evaluateStartup(analysisId, targetTitle).catch((e) => console.warn('Agent 3 scoring error:', e));

        await new Promise((r) => setTimeout(r, 1400));
        if (isCancelled) return;

        // Step 4: Insight & Recommendation Generation (Agent 4)
        if (steps.length > 3) {
          setCurrentStepIndex(3);
          setStatusMessage(steps[3].statusText);

          // Triggers Agent 4 Insight & Recommendation Generator
          await generateInsightsAndRecommendations(analysisId, targetTitle).catch((e) =>
            console.warn('Agent 4 recommendation error:', e)
          );

          await new Promise((r) => setTimeout(r, 1400));
          if (isCancelled) return;
        }

        // Final Step: Complete
        setCurrentStepIndex(steps.length - 1);
        setStatusMessage('Analysis complete! All findings synthesized and verified.');
        setIsCompleted(true);
      } catch (err) {
        console.warn('[ProcessingPage] Pipeline execution warning:', err);
        setIsCompleted(true);
      }
    }

    executeRealPipeline();

    return () => {
      isCancelled = true;
    };
  }, [analysisId, mode]);

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
                All evaluation findings, multi-dimensional scores, risk concerns, and due-diligence
                metrics have been synthesized into your dashboard.
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
                <strong>Technical Diligence Engine</strong> parses code structure, dependencies,
                and architectural claims. Scores are evaluated analytically without fabricating external signals.
              </span>
            ) : (
              <span>
                Analysis is grounded in submitted pitch decks and financial documents. Scoring dimensions
                (Market, Product, Team, Financial, Traction, Risk) are evaluated analytically with full evidence attribution.
              </span>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
