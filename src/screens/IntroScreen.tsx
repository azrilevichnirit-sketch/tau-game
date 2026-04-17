// ── IntroScreen — סיפור מסגרת: הקדמה קולנועית ──────────────────────────────
import { useState, useEffect } from 'react';
import { useViewport } from '../hooks/useViewport';

interface Props {
  onStart: () => void;
}

const LINES = [
  'שנתיים חשבת על זה.',
  'חתמת על חוזה.',
  'שלמת פיקדון.',
  'קיבלת מפתח.',
  'הסטודיו שלך מחכה.',
];
const FINAL_LINE = 'עכשיו מגיע החלק הכיפי.';

export default function IntroScreen({ onStart }: Props) {
  const [showLines, setShowLines]   = useState(false);
  const [showFinal, setShowFinal]   = useState(false);
  const [showCTA, setShowCTA]       = useState(false);
  const { isMobile } = useViewport();

  useEffect(() => {
    const t1 = setTimeout(() => setShowLines(true),  300);   // all lines together
    const t2 = setTimeout(() => setShowFinal(true),  700);   // bold line 400ms later
    const t3 = setTimeout(() => setShowCTA(true),    1300);  // CTA 600ms after bold
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#08080f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl',
        fontFamily: 'var(--font-body)',
        padding: '0 28px',
      }}
    >
      {/* Depth glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(74,144,196,0.07) 0%, transparent 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 460, width: '100%' }}>

        {/* Regular lines — all fade in together */}
        <div
          style={{
            marginBottom: '1.8rem',
            opacity: showLines ? 1 : 0,
            transform: showLines ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {LINES.map((line, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-body)',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 0.5rem 0',
              lineHeight: 1.55,
            }}>
              {line}
            </p>
          ))}
        </div>

        {/* Final bold line */}
        <p style={{
          fontFamily: 'var(--font-heading)',
          fontSize: isMobile ? '1.45rem' : '1.75rem',
          color: '#ffffff',
          fontWeight: 700,
          margin: '0 0 2.8rem 0',
          letterSpacing: '0.01em',
          opacity: showFinal ? 1 : 0,
          transform: showFinal ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          {FINAL_LINE}
        </p>

        {/* CTA */}
        <div style={{ opacity: showCTA ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: showCTA ? 'auto' : 'none' }}>
          <button
            onClick={onStart}
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.35)',
              borderRadius: 30,
              padding: isMobile ? '11px 32px' : '12px 38px',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'var(--font-body)',
              fontSize: isMobile ? '0.95rem' : '1rem',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'border-color 0.2s, color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor='rgba(255,255,255,0.75)'; b.style.color='#fff'; b.style.background='rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor='rgba(255,255,255,0.35)'; b.style.color='rgba(255,255,255,0.8)'; b.style.background='transparent'; }}
          >
            בואו נתחיל
          </button>
        </div>

      </div>
    </div>
  );
}
