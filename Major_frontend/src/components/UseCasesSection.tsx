import { ArrowRight } from 'lucide-react';
import { USE_CASES_VIDEO } from '../constants';
import { PresetNavLink } from '../shared/components/PresetNavLink';

export default function UseCasesSection() {
  return (
    <section id="for-investors" className="scroll-mt-24 bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto grid max-w-[88rem] grid-cols-1 items-start gap-8 md:grid-cols-2">
        <div className="md:pr-12 md:pt-2">
          <p className="mb-2 text-sm text-black/60" data-editable data-preset-text="usecases-eyebrow">
            Venture Intelligence in Practice
          </p>
          <h2
            className="mb-6 text-5xl leading-none font-semibold text-black md:text-6xl"
            style={{ letterSpacing: '-0.04em' }}
            data-editable
            data-preset-text="usecases-headline"
          >
            Institutional Workflows
          </h2>
          <p
            className="max-w-md text-base leading-relaxed text-black/60"
            data-editable
            data-preset-text="usecases-body"
          >
            VentureLens supports angel syndicates, venture funds, accelerators, and private equity
            teams looking for rigorous, evidence-grounded startup evaluation before deploying capital.
          </p>
        </div>

        <div className="relative min-h-[720px] overflow-hidden rounded-3xl">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={USE_CASES_VIDEO}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="relative z-10 p-10 md:p-12">
            <h3
              className="mb-5 text-4xl leading-tight font-semibold text-black md:text-5xl"
              style={{ letterSpacing: '-0.03em' }}
              data-editable
              data-preset-text="usecases-card-title"
            >
              Investment Committees
            </h3>
            <p
              className="mb-8 max-w-md text-base text-black/70"
              data-editable
              data-preset-text="usecases-card-body"
            >
              Accelerate investment committee preparation with structured memoranda, verified claim
              audits, and comparative benchmark data delivered in minutes rather than days.
            </p>
            <PresetNavLink
              target={{ kind: 'section', id: 'how-it-works' }}
              className="group inline-flex items-center gap-3 text-base font-medium text-black transition-colors hover:text-black/80"
              data-editable
              data-preset-text="usecases-cta"
            >
              Explore Due Diligence Workflows
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors duration-200 group-hover:bg-white">
                <ArrowRight className="h-4 w-4 text-black" />
              </span>
            </PresetNavLink>
          </div>
        </div>
      </div>
    </section>
  );
}
