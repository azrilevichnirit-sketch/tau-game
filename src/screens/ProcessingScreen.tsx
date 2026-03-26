// Screen 2.7 - Processing / Waiting
import { useState, useEffect } from 'react';

interface Props {
  lastBg?: string; // kept for API compat, not used — form bg is used instead
  showHint?: boolean; // phase-1 hint: shown after 30s while agent call is still running
}

const MESSAGES = [
  'מנתחים את הפרופיל שלך...',
  'מזהים דפוסים ייחודיים...',
  'מכינים את הניתוח האישי שלך...',
  'כמעט מוכן...',
];

export default function ProcessingScreen({ lastBg: _lastBg, showHint = false }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const isMobile = window.innerWidth < 768;
  // Fix: use same background as the form screen
  const bgSrc = isMobile
    ? '/assets/form/bg_form_mobile.webp'
    : '/assets/form/bg_form_desktop.webp';

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fake progress up to ~90% — real completion comes from agent
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 90));
    }, 600);
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
          התוצאות מבשלות....
        </h2>
        {/* Finding 16 — direction:ltr ensures bar grows left→right even in RTL context */}
        <div style={{ width: 280, background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 8, overflow: 'hidden', direction: 'ltr' }}>
          <div style={{ width: progress + '%', background: '#4a90c4', height: '100%', transition: 'width 0.6s ease', borderRadius: 8 }} />
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
