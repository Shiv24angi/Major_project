import { useState, useRef, useEffect } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, Sparkles, ChevronDown } from 'lucide-react';
import { PresetNavLink } from '../shared/components/PresetNavLink';
import { NAV_LINKS } from '../constants';
import LogoIcon from './LogoIcon';
import { useAuth } from '../contexts/AuthContext';
import { navigateTo } from '../shared/preset-site-routing';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const { user, profile, isAuthenticated, signOut } = useAuth();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartAnalysis = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigateTo('login', { redirect: 'new-analysis' });
    } else {
      navigateTo('new-analysis');
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'VL';
  };

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
          <PresetNavLink
            target={{ kind: 'route', path: 'dashboard' }}
            className="text-base font-medium text-gray-700 transition-colors duration-200 hover:text-black"
          >
            Dashboard
          </PresetNavLink>
        </div>

        {/* Desktop CTA & Auth Status */}
        <div className="hidden md:flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="text-base font-medium text-gray-800 transition-colors duration-200 hover:text-black px-4 py-2 rounded-full hover:bg-black/5 cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="rounded-full bg-black px-7 py-2.5 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800 cursor-pointer shadow-xs"
                data-editable
                data-preset-text="nav-start-analysis"
              >
                Start Analysis
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="rounded-full bg-black px-6 py-2.5 text-base font-medium text-white transition-colors duration-200 hover:bg-gray-800 cursor-pointer shadow-xs"
                data-editable
                data-preset-text="nav-start-analysis"
              >
                Start Analysis
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full border border-black/10 bg-white pl-2 pr-3 py-1.5 shadow-xs hover:border-black/30 transition-all cursor-pointer"
                  aria-label="User profile menu"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name || 'User avatar'}
                      className="h-7 w-7 rounded-full object-cover border border-black/10"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                      {getInitials(profile?.name, user?.email)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-black max-w-[100px] truncate">
                    {profile?.name || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-black/50" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-black/10 bg-white p-2 shadow-xl z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-black/5">
                      <p className="text-xs font-semibold text-black truncate">
                        {profile?.name || 'Venture Analyst'}
                      </p>
                      <p className="text-xs text-black/50 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {profile?.provider === 'google' ? 'Google Auth' : profile?.provider === 'github' ? 'GitHub Auth' : 'Verified Analyst'}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigateTo('dashboard');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-black/80 hover:bg-black/5 rounded-xl transition-colors text-left"
                      >
                        <LayoutDashboard className="h-4 w-4 text-black/60" />
                        <span>Investment Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigateTo('new-analysis');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-black/80 hover:bg-black/5 rounded-xl transition-colors text-left"
                      >
                        <Sparkles className="h-4 w-4 text-black/60" />
                        <span>New Analysis Workflow</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-black/5">
                      <button
                        type="button"
                        onClick={async () => {
                          setProfileOpen(false);
                          await signOut();
                          navigateTo('');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-black md:hidden cursor-pointer"
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
            <PresetNavLink
              target={{ kind: 'route', path: 'dashboard' }}
              onClick={() => setMobileOpen(false)}
              className="text-lg font-medium text-gray-800 transition-colors hover:text-black"
            >
              Dashboard
            </PresetNavLink>

            <div className="pt-2 border-t border-black/10 flex flex-col gap-3">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 p-2 bg-black/5 rounded-xl">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Profile"
                        className="h-8 w-8 rounded-full border border-black/10"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                        {getInitials(profile?.name, user?.email)}
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-sm font-semibold text-black truncate">
                        {profile?.name || user.email}
                      </p>
                      <p className="text-xs text-black/50 truncate">{user.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileOpen(false);
                      handleStartAnalysis(e);
                    }}
                    className="block text-center rounded-full bg-black py-3 text-base font-medium text-white shadow-sm"
                  >
                    Start Analysis
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setMobileOpen(false);
                      await signOut();
                      navigateTo('');
                    }}
                    className="text-center rounded-full border border-rose-200 bg-rose-50 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      navigateTo('login');
                    }}
                    className="block text-center rounded-full border border-black/15 bg-white py-2.5 text-base font-medium text-black hover:bg-black/5"
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileOpen(false);
                      handleStartAnalysis(e);
                    }}
                    className="block text-center rounded-full bg-black py-3 text-base font-medium text-white shadow-sm"
                  >
                    Start Analysis
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
