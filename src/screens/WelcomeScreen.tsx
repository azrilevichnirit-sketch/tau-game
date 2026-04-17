// ── Screen 2.3 — Welcome ─────────────────────────────────────────────
import type { AvatarGender } from '../types';
import { AVATARS } from '../data/avatars';
import { useViewport } from '../hooks/useViewport';

interface Props {
  gender: AvatarGender;
  onStart: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export default function WelcomeScreen({ gender, onStart, isMuted, onMuteToggle }: Props) {
  const av = AVATARS[gender];
  const { vw, vh, isMobile } = useViewport();
  const bgSrc = isMobile
    ? '/assets/second_page/bg_mobile.webp'
    : '/assets/second_page/bg_desktop.webp';

  return (
    <div
      className="screen-fade"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: 'var(--font-body)' }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center center' }} />
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} aria-hidden />

      {isMobile ? (
        <>
          {/* MOBILE — Avatar: shifted slightly right so body is visible
               but not clipped (avatar canvas is square; body fills right ~60%) */}
          <img
            src={av.image}
            alt={av.name}
            style={{
              position: 'absolute',
              bottom: 0,
              right: -Math.floor(vw * 0.2),
              height: `min(${Math.floor(vh * 0.62)}px, 420px)`,
              width: 'auto',
              objectFit: 'contain',
              zIndex: 1,
            }}
          />

          {/* MOBILE — Bubble + CTA: bottom-left column, direction:ltr so alignItems:flex-start = physical left */}
          <div
            style={{
              position: 'absolute',
              bottom: 44,
              left: 14,
              zIndex: 2,
              direction: 'ltr',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
              width: '60%',
            }}
          >
            {/* Bubble — direction:rtl for Hebrew text */}
            <div
              role="status"
              aria-live="polite"
              style={{
                direction: 'rtl',
                background: 'rgba(255,255,255,0.96)',
                borderRadius: 14,
                padding: '10px 12px',
                width: '100%',
                boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              }}
            >
              {av.welcomeText.split('\n').map((line, i) =>
                line.trim() ? (
                  <p
                    key={i}
                    style={{
                      color: '#1a1a2e',
                      lineHeight: 1.32,
                      marginBottom: i === 0 ? 4 : 2,
                      fontSize: 'clamp(0.8rem, 2.2vw, 0.88rem)',
                      fontWeight: i === 0 ? 700 : 400,
                    }}
                  >
                    {line}
                  </p>
                ) : null
              )}
            </div>

            {/* CTA — dark bg, white text, auto-width pill, left-aligned */}
            <button
              onClick={onStart}
              className="btn-bounce font-bold shadow-lg"
              style={{
                direction: 'rtl',
                background: '#1b2a3b',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontSize: '0.83rem',
                border: 'none',
                cursor: 'pointer',
                padding: '9px 18px',
                borderRadius: 999,
                transition: 'transform 0.2s ease',
                whiteSpace: 'nowrap',
                alignSelf: 'flex-start',
              }}
            >
              יוצאים לדרך ←
            </button>
          </div>

          {/* MOBILE — מיוט: ימין תחתון, כמו בשאר המסכים */}
          <button
            onClick={onMuteToggle}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              background: 'rgba(0,0,0,0.45)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              fontSize: 18,
            }}
            aria-label={isMuted ? 'בטל השתקה' : 'השתקה'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </>
      ) : (
        <>
          {/* DESKTOP — Avatar: centered on screen */}
          <img
            src={av.image}
            alt={av.name}
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              height: 'min(78vh, 540px)',
              width: 'auto',
              objectFit: 'contain',
              zIndex: 1,
            }}
          />

          {/* DESKTOP — Bubble + CTA: physical LEFT side (CSS: left) */}
          <div
            style={{
              position: 'absolute',
              bottom: 56,
              left: '8%',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 12,
              direction: 'rtl',
            }}
          >
            {/* Bubble */}
            <div
              role="status"
              aria-live="polite"
              style={{
                background: 'rgba(255,255,255,0.97)',
                borderRadius: 12,
                padding: '14px 16px',
                width: 'clamp(240px, 28vw, 360px)',
                flexShrink: 0,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                direction: 'rtl',
              }}
            >
              {av.welcomeText.split('\n').map((line, i) =>
                line.trim() ? (
                  <p
                    key={i}
                    style={{
                      color: '#1a1a2e',
                      lineHeight: 1.4,
                      marginBottom: i === 0 ? 5 : 2,
                      fontSize: 'clamp(0.82rem, 1.1vw, 0.97rem)',
                      fontWeight: i === 0 ? 700 : 400,
                    }}
                  >
                    {line}
                  </p>
                ) : null
              )}
            </div>

            {/* CTA */}
            <button
              onClick={onStart}
              className="btn-bounce font-bold shadow-lg"
              style={{
                background: '#1b2a3b',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                padding: '10px 22px',
                borderRadius: 999,
                transition: 'transform 0.2s ease',
                whiteSpace: 'nowrap',
                direction: 'rtl',
              }}
            >
              יוצאים לדרך ←
            </button>
          </div>

          {/* מיוט — ימין תחתון */}
          <button
            onClick={onMuteToggle}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              background: 'rgba(0,0,0,0.45)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              fontSize: 18,
            }}
            aria-label={isMuted ? 'בטל השתקה' : 'השתקה'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </>
      )}
    </div>
  );
}
