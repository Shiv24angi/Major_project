export default function EvidenceRagSection() {
  const highlights = [
    {
      title: 'Source-Grounded RAG',
      description:
        "Retrieve relevant information directly from the startup's uploaded materials with vector chunking and contextual search.",
    },
    {
      title: 'Claim Verification',
      description:
        'Compare important claims against available primary and secondary evidence to isolate unverified assertions.',
    },
    {
      title: 'Contradiction Detection',
      description:
        'Surface inconsistencies across documents, financial statements, website statements, and public repository data.',
    },
    {
      title: 'Traceable Insights',
      description:
        'Make it clear exactly where important findings come from, linking each metric and thesis point back to source text.',
    },
  ];

  return (
    <section id="evidence" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
            data-editable
            data-preset-text="evidence-eyebrow"
          >
            EVIDENCE-FIRST ANALYSIS
          </p>
          <h2
            className="mb-6 max-w-2xl text-4xl leading-tight font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="evidence-headline"
          >
            Every Insight Should Have a Reason.
          </h2>
          <p
            className="max-w-3xl text-xl leading-relaxed text-black/70 md:text-2xl"
            data-editable
            data-preset-text="evidence-body"
          >
            VentureLens grounds its analysis in the startup's own documents and relevant external
            information instead of treating an LLM response as unquestionable truth.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, index) => (
            <div
              key={item.title}
              className="flex min-h-64 flex-col justify-between rounded-2xl border border-black/5 bg-white p-8 transition-all hover:border-black/20"
            >
              <div>
                <span className="mb-4 inline-block text-xs font-mono font-semibold text-black/40">
                  0{index + 1}
                </span>
                <h3
                  className="mb-3 text-2xl font-semibold text-black"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {item.title}
                </h3>
              </div>
              <p className="text-base leading-relaxed text-black/70">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
