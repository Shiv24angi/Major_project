import { Check, X } from 'lucide-react';

export default function ComparisonSection() {
  const traditional = [
    'Reads the deck in isolation',
    'Generates a high-level summary',
    'Provides generic observations',
    'Limited evidence verification',
    'Single-model perspective',
  ];

  const ventureLens = [
    'Analyzes multiple startup inputs (deck, financials, code, team)',
    'Uses grounded RAG for traceability',
    'Researches external evidence & competitor benchmarks',
    'Coordinates specialized multi-agent workflow (Agents 1–5 + Agent 6)',
    'Cross-checks important claims against primary sources',
    'Detects risks, inconsistencies, and red flags',
    'Produces structured scoring across 6 analytical dimensions',
    'Generates an Invest / Monitor / Pass recommendation',
  ];

  return (
    <section id="comparison" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
            data-editable
            data-preset-text="compare-eyebrow"
          >
            THE DIFFERENTIATOR
          </p>
          <h2
            className="mb-6 max-w-2xl text-4xl leading-tight font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="compare-headline"
          >
            Beyond Pitch-Deck Summarization.
          </h2>
          <p
            className="max-w-3xl text-xl leading-relaxed text-black/70 md:text-2xl"
            data-editable
            data-preset-text="compare-body"
          >
            Most tools simply summarize a PDF. VentureLens is an institutional multi-agent
            intelligence platform built for rigorous verification.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Traditional Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-black/10 bg-white p-8 md:p-12">
            <div>
              <span className="text-xs font-mono font-medium tracking-wider text-black/50 uppercase">
                Conventional Approach
              </span>
              <h3 className="mt-2 mb-6 text-2xl font-semibold text-black">
                Traditional AI Summarizers
              </h3>
              <ul className="space-y-4">
                {traditional.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-base text-black/70">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-black/50">
                      <X className="h-3.5 w-3.5" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-8 text-xs text-black/50">
              Useful for quick reading, insufficient for rigorous capital deployment.
            </p>
          </div>

          {/* VentureLens Card */}
          <div className="flex flex-col justify-between rounded-3xl bg-[#2B2644] p-8 text-white md:p-12 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium tracking-wider text-white/50 uppercase">
                  Institutional Architecture
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  Multi-Agent
                </span>
              </div>
              <h3 className="mt-2 mb-6 text-2xl font-semibold text-white">
                VentureLens
              </h3>
              <ul className="space-y-3.5">
                {ventureLens.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-base text-white/90">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-8 text-xs text-white/60">
              Designed for professional investment committees, analysts, and venture funds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
