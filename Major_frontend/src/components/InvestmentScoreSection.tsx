export default function InvestmentScoreSection() {
  const scores = [
    { label: 'Market', value: 88 },
    { label: 'Product', value: 84 },
    { label: 'Team', value: 90 },
    { label: 'Financials', value: 79 },
    { label: 'Traction', value: 76 },
    { label: 'Risk', value: 74 },
  ];

  return (
    <section id="investment-view" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
            data-editable
            data-preset-text="score-eyebrow"
          >
            THE INVESTMENT VIEW
          </p>
          <h2
            className="mb-6 max-w-2xl text-4xl leading-tight font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="score-headline"
          >
            From Hundreds of Pages to One Clear Investment Picture.
          </h2>
          <p
            className="max-w-3xl text-xl leading-relaxed text-black/70 md:text-2xl"
            data-editable
            data-preset-text="score-body"
          >
            Turn days of manual deck review and spreadsheet verification into an evidence-backed
            investment synthesis.
          </p>
        </div>

        {/* Dashboard Preview Card */}
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white p-8 md:p-12 shadow-sm">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-8">
            <div>
              <span className="text-xs font-mono font-medium tracking-wider text-black/50 uppercase">
                Startup Evaluation Report
              </span>
              <h3 className="mt-1 text-2xl font-semibold text-black">
                SynthFlow Technologies, Inc.
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/60">
                Example Analysis &bull; Illustrative
              </span>
            </div>
          </div>

          {/* Core Score Summary */}
          <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-3">
            <div className="flex flex-col justify-center rounded-2xl bg-[#F5F5F5] p-6">
              <span className="text-xs font-semibold tracking-wider text-black/60 uppercase">
                Overall Investment Score
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-semibold text-black tracking-tight">82</span>
                <span className="text-xl text-black/40">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-black/60">
                Calculated across 6 analytical dimensions by the Agent 3 Scoring Engine.
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-2xl bg-[#F5F5F5] p-6">
              <span className="text-xs font-semibold tracking-wider text-black/60 uppercase">
                Investment Recommendation
              </span>
              <div className="mt-3">
                <span className="inline-block rounded-full bg-[#2B2644] px-5 py-1.5 text-base font-semibold tracking-wide text-white">
                  MONITOR / CONSIDER
                </span>
              </div>
              <p className="mt-2 text-xs text-black/60">
                Actual system outputs: INVEST, MONITOR / CONSIDER, or PASS based on Agent 4 insight synthesis.
              </p>
            </div>

            <div className="flex flex-col justify-center rounded-2xl bg-[#F5F5F5] p-6">
              <span className="text-xs font-semibold tracking-wider text-black/60 uppercase">
                Risk Profile
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-black">Moderate</span>
              </div>
              <p className="mt-2 text-xs text-black/60">
                2 contradictory claims detected; competitive pressure identified in primary vertical.
              </p>
            </div>
          </div>

          {/* Dimension Scores Bar Chart */}
          <div className="border-t border-black/5 py-8">
            <h4 className="mb-6 text-sm font-semibold tracking-wider text-black/60 uppercase">
              Dimension Performance Breakdown (Illustrative)
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {scores.map((dim) => (
                <div key={dim.label} className="rounded-xl bg-[#F5F5F5] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black/70">{dim.label}</span>
                    <span className="text-sm font-semibold text-black">{dim.value}</span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{ width: `${dim.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Risks */}
          <div className="grid grid-cols-1 gap-8 border-t border-black/5 pt-8 md:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-[#F5F5F5]/60 p-6">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-black/70 uppercase">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                  ✓
                </span>
                Identified Strengths
              </h4>
              <ul className="space-y-2.5">
                <li className="text-sm leading-relaxed text-black/80">
                  <span className="font-semibold text-black">Strong founder-market fit</span>:
                  Founders hold 12+ years prior domain leadership at Tier-1 companies.
                </li>
                <li className="text-sm leading-relaxed text-black/80">
                  <span className="font-semibold text-black">Large addressable market</span>:
                  Estimated TAM of $14.2B with 24% projected CAGR.
                </li>
                <li className="text-sm leading-relaxed text-black/80">
                  <span className="font-semibold text-black">Differentiated product</span>:
                  Proprietary model architecture validated via GitHub repository inspection.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-black/5 bg-[#F5F5F5]/60 p-6">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-black/70 uppercase">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                  !
                </span>
                Flagged Risks & Inconsistencies
              </h4>
              <ul className="space-y-2.5">
                <li className="text-sm leading-relaxed text-black/80">
                  <span className="font-semibold text-black">High customer acquisition costs</span>:
                  Paid channel unit economics decline 18% quarter-over-quarter.
                </li>
                <li className="text-sm leading-relaxed text-black/80">
                  <span className="font-semibold text-black">Competitive market</span>:
                  3 well-capitalized incumbents launched similar enterprise workflows.
                </li>
                <li className="text-sm leading-relaxed text-black/80">
                  <span className="font-semibold text-black">Limited historical traction</span>:
                  Only 4 quarters of verifiable revenue history available in data room.
                </li>
              </ul>
            </div>
          </div>

          {/* Key Diligence Question Callout */}
          <div className="mt-8 rounded-2xl bg-[#2B2644] p-6 text-white md:p-8">
            <span className="text-xs font-mono font-medium tracking-wider text-white/50 uppercase">
              Core Diligence Thesis Question
            </span>
            <p className="mt-2 text-lg font-medium leading-relaxed text-white md:text-xl">
              &ldquo;Can the startup achieve efficient growth before capital requirements
              increase?&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
