import { ArrowRight } from 'lucide-react';

export default function InvestorWorkflowSection() {
  const workflowSteps = [
    {
      step: 'SOURCE',
      title: 'Source Materials',
      desc: 'Startup documents + public information',
    },
    {
      step: 'ANALYZE',
      title: 'Agentic Research',
      desc: 'Multi-agent specialized evaluation',
    },
    {
      step: 'VERIFY',
      title: 'Claim Audit',
      desc: 'Evidence + cross-checking',
    },
    {
      step: 'SCORE',
      title: 'Structured Scoring',
      desc: 'Structured investment metrics',
    },
    {
      step: 'DECIDE',
      title: 'Recommendation',
      desc: 'Invest / Maybe / Reject synthesis',
    },
  ];

  return (
    <section id="workflow" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
            data-editable
            data-preset-text="workflow-eyebrow"
          >
            INVESTOR WORKFLOW
          </p>
          <h2
            className="mb-6 max-w-2xl text-4xl leading-tight font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="workflow-headline"
          >
            Built for the Way Investors Actually Work.
          </h2>
          <p
            className="max-w-3xl text-xl leading-relaxed text-black/70 md:text-2xl"
            data-editable
            data-preset-text="workflow-body"
          >
            Spend less time collecting and organizing information. Spend more time deciding what
            deserves your attention.
          </p>
        </div>

        {/* Workflow Chain */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {workflowSteps.map((item, index) => (
            <div
              key={item.step}
              className="relative flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-7 transition-all hover:border-black/20"
            >
              <div>
                <span className="mb-3 inline-block font-mono text-xs font-semibold tracking-widest text-black/40">
                  STAGE {index + 1}
                </span>
                <h3
                  className="mb-1 text-xs font-semibold tracking-wider text-black/90 uppercase"
                >
                  {item.step}
                </h3>
                <h4 className="mb-3 text-lg font-semibold text-black">
                  {item.title}
                </h4>
              </div>
              <div>
                <p className="text-sm leading-relaxed text-black/70">
                  {item.desc}
                </p>
                {index < workflowSteps.length - 1 && (
                  <div className="mt-4 hidden lg:block text-black/20">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
