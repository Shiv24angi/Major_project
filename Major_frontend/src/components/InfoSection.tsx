import { INFO_CARD_IMAGE } from '../constants';
import PillButton from './PillButton';

export default function InfoSection() {
  return (
    <section id="product-overview" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16 grid grid-cols-1 items-start gap-12 md:grid-cols-2">
          <div>
            <p
              className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
              data-editable
              data-preset-text="info-eyebrow"
            >
              MEET YOUR AI INVESTMENT ANALYST
            </p>
            <h2
              className="mb-8 text-4xl leading-tight font-semibold text-black md:text-5xl"
              style={{ letterSpacing: '-0.03em' }}
              data-editable
              data-preset-text="info-headline"
            >
              From Startup Documents to Investment Intelligence.
            </h2>
            <PillButton size="base" section="how-it-works" presetText="info-cta">
              Discover the Platform
            </PillButton>
          </div>
          <p
            className="text-2xl leading-relaxed text-black/70 md:text-3xl"
            data-editable
            data-preset-text="info-body"
          >
            VentureLens brings startup research, document analysis, financial evaluation,
            competitive intelligence, and risk detection into one AI-powered workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="flex min-h-80 flex-col justify-between rounded-2xl p-7 lg:col-span-2"
            style={{
              backgroundImage: `url(${INFO_CARD_IMAGE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <h3
              className="text-2xl leading-snug font-semibold text-black"
              style={{ letterSpacing: '-0.02em' }}
              data-editable
              data-preset-text="card-analyze-title"
            >
              Analyze Everything
            </h3>
            <p className="max-w-md text-base text-black/75" data-editable data-preset-text="card-analyze-body">
              Bring together pitch decks, financials, founder information, websites, GitHub
              repositories, and supporting documents in one analysis.
            </p>
          </div>

          <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-[#2B2644] p-7">
            <h3
              className="text-2xl leading-snug font-semibold text-white"
              style={{ letterSpacing: '-0.02em' }}
              data-editable
              data-preset-text="card-verify-title"
            >
              Verify the Claims
            </h3>
            <p className="text-base text-white/70" data-editable data-preset-text="card-verify-body">
              Ground analysis in source documents and external evidence to identify
              inconsistencies, unsupported claims, and potential red flags.
            </p>
          </div>

          <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-[#2B2644] p-7">
            <h3
              className="text-2xl leading-snug font-semibold text-white"
              style={{ letterSpacing: '-0.02em' }}
              data-editable
              data-preset-text="card-decide-title"
            >
              Decide With Confidence
            </h3>
            <p className="text-base text-white/70" data-editable data-preset-text="card-decide-body">
              Turn complex startup research into structured scores, risks, insights, and an
              Invest, Maybe, or Reject recommendation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
