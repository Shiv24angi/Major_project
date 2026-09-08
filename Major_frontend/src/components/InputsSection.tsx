import { FileText, DollarSign, Globe, GitBranch, Users, FileCheck } from 'lucide-react';

export default function InputsSection() {
  const inputs = [
    {
      title: 'Pitch Deck',
      format: 'PDF / PPT / PPTX',
      description: 'Problem, solution, market, business model, and strategic claims.',
      icon: FileText,
    },
    {
      title: 'Financial Documents',
      format: 'P&L / Revenue / Expenses / Cash Flow',
      description: 'Historical financials, forward projections, and burn analysis.',
      icon: DollarSign,
    },
    {
      title: 'Startup Website',
      format: 'Company and product information',
      description: 'Live positioning, feature breakdown, customer logos, and pricing.',
      icon: Globe,
    },
    {
      title: 'GitHub Repository',
      format: 'Technical and development signals',
      description: 'Codebase quality, commit activity, language stack, and architecture.',
      icon: GitBranch,
    },
    {
      title: 'Founder Information',
      format: 'LinkedIn / Resume / Portfolio',
      description: 'Career history, previous ventures, credentials, and domain fit.',
      icon: Users,
    },
    {
      title: 'Additional Evidence',
      format: 'Reports / Transcripts / Supporting Documents',
      description: 'Customer interview transcripts, cap tables, patents, and contracts.',
      icon: FileCheck,
    },
  ];

  return (
    <section id="inputs" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
            data-editable
            data-preset-text="inputs-eyebrow"
          >
            BRING THE DATA
          </p>
          <h2
            className="mb-6 max-w-2xl text-4xl leading-tight font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="inputs-headline"
          >
            Give Your Analyst the Full Picture.
          </h2>
          <p
            className="max-w-3xl text-xl leading-relaxed text-black/70 md:text-2xl"
            data-editable
            data-preset-text="inputs-body"
          >
            VentureLens connects multiple source formats to evaluate startups with cross-verified
            substance rather than isolated slide decks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inputs.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-7 transition-all hover:border-black/20"
              >
                <div>
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] text-black">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3
                    className="mb-1 text-xl font-semibold text-black"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {item.title}
                  </h3>
                  <span className="mb-4 inline-block text-xs font-mono font-medium text-black/50 uppercase">
                    {item.format}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-black/70">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
