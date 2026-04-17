// ── useViewport ───────────────────────────────────────────────────────────────
// Reactive viewport dimensions — updates on resize AND orientationchange.
// Use instead of bare window.innerWidth so the UI reflows on rotation.

import { useState, useEffect } from 'react';

export interface Viewport {
  vw: number;
  vh: number;
  isMobile: boolean;      // true when the short side < 600px (phone in any orientation)
  isLandscape: boolean;   // true when width > height
  device: 'mobile' | 'tablet' | 'desktop';
}

function measure(): Viewport {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const shortSide = Math.min(vw, vh);
  const isMobile = shortSide < 600;
  const isLandscape = vw > vh;
  const device: Viewport['device'] = isMobile ? 'mobile' : vw < 1024 ? 'tablet' : 'desktop';
  return { vw, vh, isMobile, isLandscape, device };
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(measure);

  useEffect(() => {
    let raf = 0;

    function update() {
      cancelAnimationFrame(raf);
      // rAF ensures we read dimensions AFTER the browser has applied the layout change
      raf = requestAnimationFrame(() => setViewport(measure()));
    }

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return viewport;
}
