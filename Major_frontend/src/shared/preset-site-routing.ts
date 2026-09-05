export function getPresetRoutePath() {
  return window.location.hash.replace(/^#/, '');
}
export function subscribePresetHashNavigation(callback: (path: string) => void) {
  const handler = () => callback(getPresetRoutePath());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}
export function applyPresetHashOnLoad() {}
