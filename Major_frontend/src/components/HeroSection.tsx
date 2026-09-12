import { HERO_BRANDS, HERO_VIDEO } from '../constants';
import BrandMarquee from './BrandMarquee';
import PillButton from './PillButton';
import { PresetNavLink } from '../shared/components/PresetNavLink';

export default function HeroSection() {
  return (
    <section className="relative px-6 pt-20 pb-6">
      <div
        id="product"
        className="relative h-screen w-full scroll-mt-24 overflow-hidden rounded-2xl"
        style={{ maxHeight: 'calc(100vh - 5rem)' }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
        />

        <div className="relative z-10 flex h-full flex-col items-start justify-start p-8 pt-28 md:p-12 md:pt-32">
          <p
            className="mb-3 text-xs font-semibold tracking-wider text-black/70 uppercase md:text-sm"
            data-editable
            data-preset-text="hero-eyebrow"
          >
            AI-POWERED STARTUP DUE DILIGENCE
          </p>
          <h1
            className="mb-4 max-w-2xl text-4xl leading-tight font-semibold text-black sm:text-5xl md:text-6xl"
            style={{ letterSpacing: '-0.04em' }}
            data-editable
            data-preset-text="hero-headline"
          >
            Know Which Startups Are Worth Betting On.
          </h1>
          <p
            className="mb-6 max-w-lg text-base leading-relaxed text-black/75 md:text-lg"
            data-editable
            data-preset-text="hero-subcopy"
          >
            Analyze pitch decks, financials, founders, products, markets, and public data with a
            multi-agent AI analyst built for faster, evidence-backed investment decisions.
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            <PillButton route="new-analysis" presetText="hero-cta">
              Start Analysis
            </PillButton>
            <PresetNavLink
              target={{ kind: 'section', id: 'how-it-works' }}
              className="inline-flex items-center text-sm font-medium text-black/80 transition-colors hover:text-black underline-offset-4 hover:underline"
              data-editable
              data-preset-text="hero-secondary-cta"
            >
              See How It Works →
            </PresetNavLink>
          </div>

          <p
            className="mt-4 text-xs font-medium text-black/60"
            data-editable
            data-preset-text="hero-trust"
          >
            From startup documents to investment-ready intelligence.
          </p>

          <div className="mt-14 w-full max-w-md overflow-hidden">
            <BrandMarquee brands={HERO_BRANDS} trackClass="marquee-track" />
          </div>
        </div>
      </div>
    </section>
  );
}
