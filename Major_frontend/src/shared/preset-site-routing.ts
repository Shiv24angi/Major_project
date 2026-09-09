export function getPresetRoutePath(): string {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [cleanPath] = hash.split('?');
  return cleanPath || '';
}

export function getRouteParams(): Record<string, string> {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return {};
  const searchParams = new URLSearchParams(hash.slice(qIndex + 1));
  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    params[key] = val;
  });
  return params;
}

export function navigateTo(path: string, params?: Record<string, string>) {
  const cleanPath = path.replace(/^#\/?/, '');
  let targetHash = `#${cleanPath}`;
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params).toString();
    targetHash += `?${qs}`;
  }
  window.location.hash = targetHash;
}

export function subscribePresetHashNavigation(callback: (path: string) => void) {
  const handler = () => callback(getPresetRoutePath());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

export function applyPresetHashOnLoad() {}
