import { useEffect, useState, ReactNode } from 'react';
import { getPresetRoutePath, subscribePresetHashNavigation } from '../preset-site-routing';

export function PresetHashRouter({ routes }: { routes: Record<string, ReactNode> }) {
  const [route, setRoute] = useState(getPresetRoutePath());
  useEffect(() => subscribePresetHashNavigation(setRoute), []);
  
  return <>{routes[route] || routes['']}</>;
}
