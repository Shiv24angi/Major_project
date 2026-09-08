export default function AnalysisDimensionsSection() {
  const dimensions = [
    {
      title: 'Market',
      items: ['TAM / SAM / SOM', 'Market growth', 'Market attractiveness', 'Market trends'],
    },
    {
      title: 'Product',
      items: ['Problem-solution fit', 'Product differentiation', 'Product maturity', 'Value proposition'],
    },
    {
      title: 'Business Model',
      items: ['Revenue model', 'Pricing', 'Unit economics', 'Scalability'],
    },
    {
      title: 'Competition',
      items: ['Direct competitors', 'Indirect competitors', 'Competitive positioning', 'Differentiation'],
    },
    {
      title: 'Traction',
      items: ['Revenue', 'Growth', 'Customers', 'Retention', 'Adoption indicators'],
    },
    {
      title: 'Financials',
      items: ['Revenue & expenses', 'Burn & runway', 'CAC & LTV', 'Profitability indicators'],
    },
    {
      title: 'Technology',
      items: ['Technical architecture', 'Technology maturity', 'GitHub signals', 'Technical risks'],
    },
    {
      title: 'Founders & Team',
      items: ['Founder background', 'Relevant experience', 'Team strength', 'Execution capability'],
    },
    {
      title: 'Go-To-Market',
      items: ['Acquisition strategy', 'Distribution', 'Sales model', 'Growth strategy'],
    },
    {
      title: 'Risk & Integrity',
      items: ['Business & market risks', 'Financial risks', 'Technical risks', 'Claim inconsistencies'],
    },
  ];

  return (
    <section id="analysis" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
            data-editable
            data-preset-text="analysis-eyebrow"
          >
            DEEP STARTUP ANALYSIS
          </p>
          <h2
            className="mb-6 max-w-2xl text-4xl leading-tight font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="analysis-headline"
          >
            Every Dimension That Matters to an Investor.
          </h2>
          <p
            className="max-w-3xl text-xl leading-relaxed text-black/70 md:text-2xl"
            data-editable
            data-preset-text="analysis-body"
          >
            Go beyond the pitch. VentureLens evaluates the underlying evidence across the
            startup's most important investment dimensions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {dimensions.map((dim) => (
            <div
              key={dim.title}
              className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-6 transition-all hover:border-black/20"
            >
              <div>
                <h3
                  className="mb-4 text-xl font-semibold text-black"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {dim.title}
                </h3>
                <ul className="space-y-2">
                  {dim.items.map((item) => (
                    <li key={item} className="flex items-center text-sm text-black/70">
                      <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
