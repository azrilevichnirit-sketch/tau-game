// Screen 2.7 - Processing / Waiting
import { useState, useEffect } from 'react';
import { useViewport } from '../hooks/useViewport';

interface Props {
  lastBg?: string; // kept for API compat, not used — form bg is used instead
  showHint?: boolean; // phase-1 hint: shown after 30s while agent call is still running
}

const MESSAGES = [
  'מנתחים את הבחירות שעשית בסטודיו...',
  'מזהים את המנועים שלך...',
  'מגבשים את הפרופיל האישי שלך...',
  'עוד רגע קט, אנחנו כמעט שם...',
];

export default function ProcessingScreen({ lastBg: _lastBg, showHint = false }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const { isMobile } = useViewport();
  // Fix: use same background as the form screen
  const bgSrc = isMobile
    ? '/assets/form/bg_form_mobile.webp'
    : '/assets/form/bg_form_desktop.webp';

  useEffect(() => {
    const interval = setInterval(() => {
      // Stop at last message ("כמעט מוכן...") — don't cycle back to "מנתחים..."
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="screen-fade"
      style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundImage: 'url(' + bgSrc + ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        direction: 'rtl',
        fontFamily: 'var(--font-body)',
      }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.58)' }} />
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        <div className="spinner w-16 h-16 border-4 border-white border-t-transparent rounded-full" />
        <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          התוצאות מבשלות...
        </h2>
        {/* Indeterminate dots — honest loader, no fake percentage */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: '#4a90c4', animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <p className="text-white text-lg" style={{ opacity: 0.85 }}>{MESSAGES[msgIndex]}</p>
        {/* Phase-1 hint: appears after 30s, agent call still running */}
        {showHint && (
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', marginTop: 4, animation: 'fadeInUp 0.5s ease' }}>
            עוד קצת, ה-Mojo שלך בדרך...
          </p>
        )}
      </div>
    </div>
  );
}
