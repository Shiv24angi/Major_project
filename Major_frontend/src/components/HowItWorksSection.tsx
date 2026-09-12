import {
  FileUp,
  Cpu,
  Globe,
  Bot,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Upload',
      subtitle: 'Multi-Source Ingestion',
      icon: FileUp,
      overview:
        "Provide the startup's pitch deck, financial documents, website, GitHub repository, and founder information.",
      metricValue: '5+',
      metricLabel: 'Input Formats Supported',
      ctaText: 'Inspect Inputs',
      targetSection: 'inputs',
    },
    {
      number: '02',
      title: 'Understand',
      subtitle: 'Grounded RAG Pipeline',
      icon: Cpu,
      overview:
        'Documents are parsed, structured, chunked, embedded, and made searchable through a grounded RAG pipeline.',
      metricValue: '100%',
      metricLabel: 'Vector Grounded',
      ctaText: 'View Pipeline',
      targetSection: 'evidence',
    },
    {
      number: '03',
      title: 'Research',
      subtitle: 'Public Market Signals',
      icon: Globe,
      overview:
        'Relevant external information is collected to benchmark the startup against its market, competitors, and public evidence.',
      metricValue: 'Live',
      metricLabel: 'Market Benchmarks',
      ctaText: 'See Sources',
      targetSection: 'analysis',
    },
    {
      number: '04',
      title: 'Analyze',
      subtitle: 'Structured Evaluation',
      icon: Bot,
      overview:
        'Specialized AI agents evaluate the startup across market, product, team, financial, traction, and risk dimensions.',
      metricValue: '6',
      metricLabel: 'Core Dimensions',
      ctaText: 'View Engine',
      targetSection: 'multi-agent',
    },
    {
      number: '05',
      title: 'Cross-Check',
      subtitle: 'Contradiction Engine',
      icon: ShieldAlert,
      overview:
        'Important claims and findings are verified against available evidence and conflicting information is surfaced.',
      metricValue: 'Audit',
      metricLabel: 'Red Flag Detection',
      ctaText: 'Audit Method',
      targetSection: 'evidence',
    },
    {
      number: '06',
      title: 'Decide',
      subtitle: 'Investment Recommendation',
      icon: CheckCircle2,
      overview:
        'The system produces an explainable startup score, risk profile, key insights, and an Invest / Monitor / Pass recommendation.',
      metricValue: '3',
      metricLabel: 'Verdict Types',
      ctaText: 'View Dashboard',
      targetSection: 'investment-view',
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
            data-editable
            data-preset-text="hiw-eyebrow"
          >
            END-TO-END DILIGENCE
          </p>
          <h2
            className="mb-6 max-w-2xl text-4xl leading-tight font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="hiw-headline"
          >
            From Raw Documents to Investment Verdict.
          </h2>
          <p
            className="max-w-3xl text-xl leading-relaxed text-black/70 md:text-2xl"
            data-editable
            data-preset-text="hiw-body"
          >
            A disciplined 6-phase workflow coordinating specialized agent ingestion, grounded
            data normalization, multi-dimensional scoring, and synthesized investment recommendations.
          </p>
        </div>

        {/* 6 Interactive Cards with Card-7 Hover Lift & Sliding Reveal Effect */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group relative w-full overflow-hidden rounded-2xl border border-black/10 bg-[#2B2644] text-white shadow-md transition-all duration-500 ease-in-out hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
              >
                {/* Background Gradient without image as requested */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2B2644] via-[#241e3a] to-[#171325] transition-all duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                {/* Content Container */}
                <div className="relative flex h-full min-h-[380px] flex-col justify-between p-7 text-white">
                  {/* Top Section: Logo / Step Badge */}
                  <div className="flex h-20 items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-white/80 backdrop-blur-sm">
                      STEP {step.number}
                    </span>
                  </div>

                  {/* Middle Section: Details (slides up smoothly on hover) */}
                  <div className="space-y-4 transition-transform duration-500 ease-in-out group-hover:-translate-y-16">
                    <div>
                      <h3
                        className="text-2xl font-bold tracking-tight text-white"
                        style={{ letterSpacing: '-0.02em' }}
                      >
                        {step.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-mono font-medium tracking-wider text-white/70 uppercase">
                        {step.subtitle}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold tracking-wider text-white/80 uppercase">
                        OVERVIEW
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-white/75">
                        {step.overview}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Section: Metric and Button (revealed from bottom on hover) */}
                  <div className="absolute -bottom-20 left-0 w-full p-7 opacity-0 transition-all duration-500 ease-in-out group-hover:bottom-0 group-hover:opacity-100">
                    <div className="flex items-end justify-between border-t border-white/15 pt-4">
                      <div>
                        <span className="text-2xl font-bold text-white">
                          {step.metricValue}
                        </span>
                        <span className="block text-xs font-medium text-white/70">
                          {step.metricLabel}
                        </span>
                      </div>
                      <a
                        href={`#${step.targetSection}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-all hover:bg-white/90 shadow-md"
                      >
                        {step.ctaText} <ArrowRight className="h-3.5 w-3.5 text-black" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
