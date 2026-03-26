// ── Pixel / Analytics Tracking ───────────────────────────────────────────────
// Feature-flag driven. All pixels are disabled by default in config.ts.
// To add a new pixel: add an entry to config.pixels with enabled: true.
// No code changes needed here.

import type { PixelConfig } from '../types';

declare global {
  interface Window {
    fbq?: (action: string, event: string) => void;
    ttq?: { track: (event: string) => void };
    gtag?: (command: string, event: string, params?: Record<string, unknown>) => void;
  }
}

export function firePixelEvent(pixels: PixelConfig[], event: string): void {
  for (const p of pixels) {
    if (!p.enabled) continue;
    try {
      if (p.type === 'facebook' && typeof window.fbq === 'function') {
        window.fbq('track', event);
      } else if (p.type === 'tiktok' && window.ttq) {
        window.ttq.track(event);
      } else if (p.type === 'google' && typeof window.gtag === 'function') {
        window.gtag('event', event, { send_to: p.pixelId });
      }
      // custom: extend here as needed
    } catch (err) {
      console.warn('[pixel] error firing', p.type, event, err);
    }
  }
}
