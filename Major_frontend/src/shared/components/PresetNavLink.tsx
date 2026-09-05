import { ReactNode } from 'react';

export function PresetNavLink({ 
  target, className, children, ...rest 
}: { 
  target: { kind: 'route' | 'section'; path?: string; id?: string }, 
  className?: string, 
  children: ReactNode,
  [x: string]: any
}) {
  const href = target.kind === 'route' ? `#${target.path || ''}` : `#${target.id || ''}`;
  return <a href={href} className={className} {...rest}>{children}</a>;
}
