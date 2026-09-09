import { ArrowRight, FileText, Code2, CheckCircle2, Layers, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { navigateTo } from '../shared/preset-site-routing';

export default function NewAnalysisModePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="mx-auto max-w-[88rem] px-6 pt-32 pb-20">
          {/* Header */}
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-black/70 mb-4 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-black" />
              <span>NEW ANALYSIS WORKFLOW</span>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-black mb-6"
              style={{ letterSpacing: '-0.03em' }}
            >
              Choose Your Analysis
            </h1>
            <p className="text-xl md:text-2xl text-black/70 leading-relaxed">
              Select how you want VentureLens to evaluate your opportunity.
            </p>
          </div>

          {/* Mode Selection Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MODE A: STARTUP EVALUATION */}
            <div className="group relative rounded-3xl border border-black/10 bg-[#2B2644] text-white p-8 md:p-12 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-white/90">
                    Mode A • Pitch & Diligence
                  </span>
                </div>

                <h2
                  className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Startup Evaluation
                </h2>

                <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8">
                  Evaluate an existing startup using its pitch deck, financial documents, founder information,
                  company data, website, and supporting evidence.
                </p>

                {/* Input Indicators */}
                <div className="rounded-2xl bg-black/25 border border-white/10 p-6 mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
                    Supported Input Sources:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Pitch Deck (PDF / PPT)',
                      'Financial Documents (P&L / Model)',
                      'Founder & Team Information',
                      'Company Documents & Cap Table',
                      'Startup Website / Traction URL',
                      'Gmail / Email Data Integration',
                      'Supporting Documents',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-xs md:text-sm text-white/90">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Architecture badge */}
                <div className="flex items-center gap-2 text-xs font-mono text-white/60 mb-8">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Powered by Agents 1–5 (Ingestion, Normalization, Scoring, Insights & Reports)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('analyze-startup')}
                className="group/btn flex w-full items-center justify-between rounded-full bg-white px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-gray-100 cursor-pointer shadow-md"
              >
                <span>Start Startup Evaluation</span>
                <span className="rounded-full bg-black p-2 text-white transition-transform group-hover/btn:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>

            {/* MODE B: PROJECT → STARTUP */}
            <div className="group relative rounded-3xl border border-black/10 bg-[#1F2438] text-white p-8 md:p-12 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 backdrop-blur-sm">
                    <Code2 className="h-7 w-7 text-cyan-300" />
                  </div>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    Mode B • Code Diligence
                  </span>
                </div>

                <h2
                  className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Project → Startup
                </h2>

                <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8">
                  Analyze an existing software project or GitHub repository and evaluate its technical maturity,
                  product potential, market potential, and startup viability.
                </p>

                {/* Input Indicators */}
                <div className="rounded-2xl bg-black/25 border border-white/10 p-6 mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4">
                    Supported Input Sources:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'GitHub Repository URL',
                      'Complete Codebase (.zip archive)',
                      'README / System Documentation',
                      'Project Description & Problem Statement',
                      'Live Demo / Production Website',
                      'Existing User Data & Metrics',
                      'Supporting Architecture Specs',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-xs md:text-sm text-white/90">
                        <CheckCircle2 className="h-4 w-4 text-cyan-300 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Architecture badge */}
                <div className="flex items-center gap-2 text-xs font-mono text-white/60 mb-8">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Powered by Agent 6 (Code Diligence) piping into Agent 2 Normalization</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('analyze-project')}
                className="group/btn flex w-full items-center justify-between rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-cyan-300 cursor-pointer shadow-md"
              >
                <span>Start Project Analysis</span>
                <span className="rounded-full bg-black p-2 text-white transition-transform group-hover/btn:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
