import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
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

export default function App() {
  useEffect(() => {
    applyPresetHashOnLoad();

    // Initialize Lenis for silky-smooth, inertia scrolling across the entire site
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 1.8,
      infinite: false,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Smoothly scroll to in-page hash anchors via Lenis
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#') && href !== '#') {
          // If anchor matches an on-page ID element, scroll to it
          const targetEl = document.querySelector<HTMLElement>(href);
          if (targetEl) {
            e.preventDefault();
            lenis.scrollTo(targetEl, { offset: -90, duration: 1.2 });
          }
        }
      }
    };

    // Scroll to top on page route navigation
    const handleHashChange = () => {
      const path = getPresetRoutePath();
      // If it's a page route and not an anchor
      if (['new-analysis', 'analyze-startup', 'analyze-project', 'processing', 'dashboard', 'my-analyses', 'documents', 'reports'].includes(path)) {
        window.scrollTo(0, 0);
        lenis.scrollTo(0, { immediate: true });
      }
    };

    document.addEventListener('click', handleAnchorClick);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('hashchange', handleHashChange);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col bg-[#F5F5F5]">
      <PresetHashRouter
        routes={{
          '': <HomePage />,
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
    </div>
  );
}
