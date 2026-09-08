import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { PresetHashRouter } from './shared/components/PresetHashRouter';
import { applyPresetHashOnLoad } from './shared/preset-site-routing';
import EcosystemPage from './pages/EcosystemPage';
import HelpPage from './pages/HelpPage';
import HomePage from './pages/HomePage';
import NetworkPage from './pages/NetworkPage';
import NewsPage from './pages/NewsPage';
import RewardsPage from './pages/RewardsPage';
import WalletPage from './pages/WalletPage';

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
          const targetEl = document.querySelector<HTMLElement>(href);
          if (targetEl) {
            e.preventDefault();
            lenis.scrollTo(targetEl, { offset: -90, duration: 1.2 });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col bg-[#F5F5F5]">
      <PresetHashRouter
        routes={{
          '': <HomePage />,
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
