import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { PresetNavLink } from '../shared/components/PresetNavLink';
import { useAuth } from '../contexts/AuthContext';

type PillButtonProps = {
  children: ReactNode;
  size?: 'base' | 'lg';
  route?: string;
  section?: string;
  onClick?: () => void;
  className?: string;
  presetText?: string;
  requireAuth?: boolean;
};

export default function PillButton({
  children,
  size = 'lg',
  route,
  section,
  onClick,
  className = '',
  presetText,
  requireAuth,
}: PillButtonProps) {
  const { isAuthenticated } = useAuth();

  const sizeClass =
    size === 'lg'
      ? 'text-base md:text-lg pl-8 pr-2 py-2'
      : 'text-base pl-6 pr-1.5 py-1.5';

  const inner = (
    <>
      <span data-editable={presetText ? true : undefined} data-preset-text={presetText}>
        {children}
      </span>
      <span className="rounded-full bg-white p-2 transition-colors duration-200 group-hover:bg-white">
        <ArrowRight className="h-5 w-5 text-black" />
      </span>
    </>
  );

  const baseClassName = `group inline-flex items-center gap-3 rounded-full bg-black font-medium text-white transition-colors duration-200 hover:bg-gray-800 ${sizeClass} ${className} cursor-pointer`;

  if (route) {
    const isProtected =
      requireAuth ??
      ['new-analysis', 'analyze-startup', 'analyze-project', 'processing'].includes(route);

    // If unauthenticated and clicking a protected route, route through login with return parameter
    const effectiveRoute =
      isProtected && !isAuthenticated ? `login?redirect=${encodeURIComponent(route)}` : route;

    return (
      <PresetNavLink
        target={{ kind: 'route', path: effectiveRoute }}
        className={baseClassName}
        data-editable
        onClick={onClick}
      >
        {inner}
      </PresetNavLink>
    );
  }

  if (section) {
    return (
      <PresetNavLink
        target={{ kind: 'section', id: section }}
        className={baseClassName}
        data-editable
        onClick={onClick}
      >
        {inner}
      </PresetNavLink>
    );
  }

  return (
    <button type="button" className={baseClassName} onClick={onClick} data-editable>
      {inner}
    </button>
  );
}
