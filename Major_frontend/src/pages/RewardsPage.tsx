import PillButton from '../components/PillButton';
import Navbar from '../components/Navbar';

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="relative pt-20">
        <Navbar />
      </div>
      <section className="scroll-mt-20 px-6 py-24">
        <div className="mx-auto max-w-[88rem]">
          <h2
            className="mb-8 text-4xl font-semibold text-black md:text-5xl"
            style={{ letterSpacing: '-0.03em' }}
            data-editable
            data-preset-text="rewards-headline"
          >
            VentureLens Evaluation Intelligence
          </h2>
          <p
            className="max-w-2xl text-2xl leading-relaxed text-black/70 md:text-3xl"
            data-editable
            data-preset-text="rewards-body"
          >
            Turn raw startup documentation into verifiable investment conviction—evidence-grounded,
            cross-checked, and structured for accelerated due diligence.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl bg-[#2B2644] p-7 text-white">
              <h3 className="text-2xl font-semibold" data-editable data-preset-text="rewards-yield-title">
                Grounded Verification
              </h3>
              <p className="mt-4 text-white/60" data-editable data-preset-text="rewards-yield-body">
                Cross-reference founder pitch assertions against primary financial docs and public data.
              </p>
            </article>
            <article className="rounded-2xl bg-[#2B2644] p-7 text-white">
              <h3 className="text-2xl font-semibold" data-editable data-preset-text="rewards-lockups-title">
                Structured Scoring
              </h3>
              <p className="mt-4 text-white/60" data-editable data-preset-text="rewards-lockups-body">
                Explainable ratings across 10 core dimensions culminating in clear investment recommendations.
              </p>
            </article>
          </div>
          <div className="mt-10">
            <PillButton size="base" section="how-it-works" presetText="rewards-cta">
              Start Analysis
            </PillButton>
          </div>
        </div>
      </section>
    </div>
  );
}
