import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PresetNavLink } from '../shared/components/PresetNavLink';
import { NAV_LINKS } from '../constants';
import LogoIcon from './LogoIcon';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="absolute top-0 right-0 left-0 z-20 px-6 py-5">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between">
        <PresetNavLink
          target={{ kind: 'route', path: '' }}
          className="flex items-center gap-2 text-black"
          data-editable
        >
          <LogoIcon className="h-7 w-7 text-black" />
          <span
            className="text-2xl font-semibold tracking-tight text-black"
            data-editable
            data-preset-text="logo-wordmark"
          >
            VentureLens
          </span>
        </PresetNavLink>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <PresetNavLink
              key={link.path}
              target={{ kind: 'section', id: link.section }}
              className="text-base font-medium text-gray-700 transition-colors duration-200 hover:text-black"
              data-editable
              data-preset-text={`nav-${link.path}`}
            >
              {link.label}
            </PresetNavLink>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <PresetNavLink
            target={{ kind: 'section', id: 'how-it-works' }}
            className="rounded-full bg-black px-7 py-2.5 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800"
            data-editable
            data-preset-text="nav-start-analysis"
          >
            Start Analysis
          </PresetNavLink>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-black md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="mt-3 rounded-2xl border border-black/10 bg-white/95 p-6 shadow-xl backdrop-blur md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <PresetNavLink
                key={link.path}
                target={{ kind: 'section', id: link.section }}
                onClick={() => setMobileOpen(false)}
                className="text-lg font-medium text-gray-800 transition-colors hover:text-black"
              >
                {link.label}
              </PresetNavLink>
            ))}
            <div className="pt-2">
              <PresetNavLink
                target={{ kind: 'section', id: 'how-it-works' }}
                onClick={() => setMobileOpen(false)}
                className="block text-center rounded-full bg-black py-3 text-base font-medium text-white"
              >
                Start Analysis
              </PresetNavLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
