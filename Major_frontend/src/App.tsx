import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { BrowserRouter } from 'react-router-dom';
import { PresetHashRouter } from './shared/components/PresetHashRouter';
import { applyPresetHashOnLoad, getPresetRoutePath } from './shared/preset-site-routing';
import EcosystemPage from './pages/EcosystemPage';
import HelpPage from './pages/HelpPage';
import HomePage from './pages/HomePage';
import NetworkPage from './pages/NetworkPage';
import NewsPage from './pages/NewsPage';
import RewardsPage from './pages/RewardsPage';
import WalletPage from './pages/WalletPage';
import NewAnalysisModePage from './pages/NewAnalysisModePage';
import StartupInputPage from './pages/StartupInputPage';
import ProjectInputPage from './pages/ProjectInputPage';
import ProcessingPage from './pages/ProcessingPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import { initSupabaseDatabase } from './services/supabaseService';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    // Initialize & seed baseline database records in Supabase
    initSupabaseDatabase().catch((err) => console.warn('[Supabase] Init warning:', err));

    applyPresetHashOnLoad();

    let lenis: Lenis | null = null;
    let rafId: number | null = null;

    const startLenis = () => {
      if (lenis) return;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.05,
        touchMultiplier: 1.8,
        infinite: false,
      });

      function raf(time: number) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    };

    const stopLenis = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling');
    };

    // Smoothly scroll to in-page hash anchors via Lenis when on landing
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#') && href !== '#') {
          const targetEl = document.querySelector<HTMLElement>(href);
          if (targetEl && lenis) {
            e.preventDefault();
            lenis.scrollTo(targetEl, { offset: -90, duration: 1.2 });
          }
        }
      }
    };

    // Lenis is only needed on the landing page for inertia marquee scrolling.
    // All app pages (new-analysis, analyze-startup, dashboard, etc.) use 100% native browser scrolling.
    const syncScrollMode = () => {
      const path = getPresetRoutePath();
      if (!path || path === '' || path === 'home') {
        startLenis();
      } else {
        stopLenis();
      }
    };

    syncScrollMode();

    const handleHashChange = () => {
      syncScrollMode();
      const path = getPresetRoutePath();
      if (path && path !== '' && path !== 'home') {
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener('click', handleAnchorClick);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      stopLenis();
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <div className="flex flex-col bg-[#F5F5F5]">
            <PresetHashRouter
              routes={{
                '': <HomePage />,
                auth: <AuthPage />,
                login: <AuthPage />,
                signup: <AuthPage />,
                'new-analysis': <NewAnalysisModePage />,
                'analyze-startup': <StartupInputPage />,
                'analyze-project': <ProjectInputPage />,
                'processing': <ProcessingPage />,
                'dashboard': <DashboardPage />,
                'my-analyses': <DashboardPage />,
                'documents': <DashboardPage />,
                'reports': <DashboardPage />,
                network: <NetworkPage />,
                ecosystem: <EcosystemPage />,
                rewards: <RewardsPage />,
                help: <HelpPage />,
                news: <NewsPage />,
                wallet: <WalletPage />,
              }}
            />
            <Toaster position="top-right" richColors />
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
