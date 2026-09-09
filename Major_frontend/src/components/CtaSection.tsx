import PillButton from './PillButton';
import { PresetNavLink } from '../shared/components/PresetNavLink';

export default function CtaSection() {
  return (
    <section
      id="start-analysis"
      className="scroll-mt-24 border-t border-black/5 bg-[#F5F5F5] px-6 py-24 text-center"
      aria-label="Start Analysis CTA"
    >
      <div className="mx-auto max-w-[88rem]">
        <p
          className="mb-3 text-xs font-semibold tracking-wider text-black/60 uppercase md:text-sm"
          data-editable
          data-preset-text="cta-eyebrow"
        >
          READY TO ANALYZE?
        </p>
        <h2
          className="mx-auto mb-6 max-w-2xl text-4xl font-semibold text-black md:text-5xl"
          style={{ letterSpacing: '-0.03em' }}
          data-editable
          data-preset-text="cta-headline"
        >
          Turn Startup Data Into Investment Intelligence.
        </h2>
        <p
          className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-black/70 md:text-xl"
          data-editable
          data-preset-text="cta-body"
        >
          Upload a startup&apos;s information and let VentureLens build a structured,
          evidence-backed investment assessment.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <PillButton size="lg" route="new-analysis" presetText="final-primary-cta">
            Start Analysis
          </PillButton>
          <PresetNavLink
            target={{ kind: 'section', id: 'how-it-works' }}
            className="inline-flex items-center rounded-full border border-black/15 bg-white px-7 py-3 text-base font-medium text-black transition-colors hover:border-black/30 hover:bg-black/5"
            data-editable
            data-preset-text="final-secondary-cta"
          >
            Explore How It Works
          </PresetNavLink>
        </div>
      </div>
    </section>
  );
}
