import LogoIcon from './LogoIcon';
import { PresetNavLink } from '../shared/components/PresetNavLink';
import { NAV_LINKS } from '../constants';

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#F5F5F5] px-6 py-16">
      <div className="mx-auto max-w-[88rem]">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          {/* Brand and descriptor */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 text-black">
              <LogoIcon className="h-7 w-7 text-black" />
              <span className="text-2xl font-semibold tracking-tight">
                VentureLens
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-black/60">
              AI-powered startup evaluation and investment intelligence.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-8">
            {NAV_LINKS.map((link) => (
              <PresetNavLink
                key={link.path}
                target={{ kind: 'section', id: link.section }}
                className="text-sm font-medium text-black/70 transition-colors hover:text-black"
              >
                {link.label}
              </PresetNavLink>
            ))}
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6 text-sm text-black/60">
            <a href="#privacy" className="transition-colors hover:text-black">
              Privacy
            </a>
            <a href="#terms" className="transition-colors hover:text-black">
              Terms
            </a>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 border-t border-black/5 pt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <p className="max-w-2xl text-xs leading-relaxed text-black/50">
            AI-generated analysis should be reviewed by qualified decision-makers before making
            investment decisions. VentureLens provides research decision-support and does not offer
            investment, legal, or financial advice.
          </p>
          <p className="text-xs text-black/40">
            &copy; {new Date().getFullYear()} VentureLens. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
