import { useEffect, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPresetRoutePath, subscribePresetHashNavigation } from '../preset-site-routing';

export function PresetHashRouter({ routes }: { routes: Record<string, ReactNode> }) {
  const [route, setRoute] = useState(getPresetRoutePath());
  useEffect(() => subscribePresetHashNavigation(setRoute), []);

  // If the hash is an in-page section anchor (e.g. #how-it-works), stay on the current root page
  const activeKey = routes[route] !== undefined ? route : '';
  const content = routes[activeKey] || routes[''];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full min-h-screen"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
