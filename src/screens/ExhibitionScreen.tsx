// ── Screen 2.1 — בחירת תערוכה ──────────────────────────────────────────────
import { useState } from 'react';
import { config } from '../config';
import { useViewport } from '../hooks/useViewport';

// Glow colour per exhibition id (desktop hover only)
const GLOW: Record<string, string> = {
  space:  '0 0 28px rgba(110, 60, 255, 0.5)',
  tech:   '0 0 28px rgba(0, 190, 160, 0.5)',
  arts:   '0 0 28px rgba(255, 80, 30, 0.5)',
  social: '0 0 28px rgba(220, 150, 0, 0.5)',
};

interface Props {
  onSelect: (exhibitionId: string) => void;
}

export default function ExhibitionScreen({ onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { vw, vh, isMobile } = useViewport();

  // Card size: a square that fits both in available WIDTH and available HEIGHT
  // so that on desktop the grid never overflows below the CTA/footer.
  const gap        = isMobile ? 8 : 12;
  const sidePad    = isMobile ? 24 : 32;   // total horizontal padding (both sides)
  // fixedV = logo area + title area + cards-container vertical padding + CTA + footer
  // Mobile:  logo(88) + title(86) + cards-pad(8) + CTA(52) + footer(21) + safe-area(34) = 289 → 302
  // Desktop: logo(118) + title(78) + cards-pad(16) + CTA(60) + footer(21) + buffer(14) = 307
  const fixedV     = isMobile ? 302 : 307;
  const maxByWidth = Math.floor((vw - sidePad - gap) / 2);
  const maxByHeight= Math.floor((vh - fixedV - gap) / 2);
  const cardSize   = Math.min(maxByWidth, maxByHeight, isMobile ? 340 : 420); // 420px cap on desktop

  return (
    // Root is position:fixed inset:0 — guarantees exact viewport bounds, no overflow
    <div
      className="screen-fade"
      style={{
        position: 'fixed',
        inset: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)', // iOS home indicator
        background: 'linear-gradient(160deg, #f8f9fb 0%, #f0f5ff 40%, #eaf2fb 70%, #f5f8ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}
    >
      {/* ── SVG animated background — circles with straight horizontal line through + arm ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">

          {/* Node A — top-left: r=52, arm exits RIGHT */}
          <g opacity="0.18">
            <animateTransform attributeName="transform" type="translate" values="0,0;18,25;0,0" dur="13s" repeatCount="indefinite"/>
            <circle cx="120" cy="185" r="52" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="68"  y1="185" x2="172" y2="185" stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="172" y1="185" x2="295" y2="185" stroke="#4a90c4" strokeWidth="0.9"/>
          </g>

          {/* Node B — upper-right: r=70, arm exits LEFT */}
          <g opacity="0.15">
            <animateTransform attributeName="transform" type="translate" values="0,0;-12,18;0,0" dur="17s" repeatCount="indefinite"/>
            <circle cx="790" cy="115" r="70" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="720" y1="115" x2="860" y2="115" stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="720" y1="115" x2="580" y2="115" stroke="#4a90c4" strokeWidth="0.9"/>
          </g>

          {/* Node C — center-right: r=90, arm exits LEFT */}
          <g opacity="0.16">
            <animateTransform attributeName="transform" type="translate" values="0,0;-10,22;0,0" dur="14s" repeatCount="indefinite"/>
            <circle cx="865" cy="520" r="90" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="775" y1="520" x2="955" y2="520" stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="775" y1="520" x2="620" y2="520" stroke="#4a90c4" strokeWidth="0.9"/>
          </g>

          {/* Node D — bottom-center: r=58, arm exits RIGHT */}
          <g opacity="0.18">
            <animateTransform attributeName="transform" type="translate" values="0,0;8,-18;0,0" dur="11s" repeatCount="indefinite"/>
            <circle cx="430" cy="830" r="58" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="372" y1="830" x2="488" y2="830" stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="488" y1="830" x2="620" y2="830" stroke="#4a90c4" strokeWidth="0.9"/>
          </g>

          {/* Node E — left-center: r=42, arm exits RIGHT */}
          <g opacity="0.14">
            <animateTransform attributeName="transform" type="translate" values="0,0;15,-12;0,0" dur="19s" repeatCount="indefinite"/>
            <circle cx="75"  cy="600" r="42" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="33"  y1="600" x2="117" y2="600" stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="117" y1="600" x2="235" y2="600" stroke="#4a90c4" strokeWidth="0.9"/>
          </g>

          {/* Node F — bottom-left: r=48, arm exits RIGHT */}
          <g opacity="0.16">
            <animateTransform attributeName="transform" type="translate" values="0,0;20,-15;0,0" dur="15s" repeatCount="indefinite"/>
            <circle cx="210" cy="905" r="48" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="162" y1="905" x2="258" y2="905" stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="258" y1="905" x2="385" y2="905" stroke="#4a90c4" strokeWidth="0.9"/>
          </g>

          {/* Node G — center: r=38, arm exits LEFT */}
          <g opacity="0.13">
            <animateTransform attributeName="transform" type="translate" values="0,0;-8,14;0,0" dur="21s" repeatCount="indefinite"/>
            <circle cx="420" cy="375" r="38" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="382" y1="375" x2="458" y2="375" stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="382" y1="375" x2="260" y2="375" stroke="#4a90c4" strokeWidth="0.9"/>
          </g>

          {/* Node H — upper-center: r=34, arm exits RIGHT */}
          <g opacity="0.14">
            <animateTransform attributeName="transform" type="translate" values="0,0;10,20;0,0" dur="18s" repeatCount="indefinite"/>
            <circle cx="510" cy="75"  r="34" fill="none" stroke="#4a90c4" strokeWidth="1.2"/>
            <line x1="476" y1="75"  x2="544" y2="75"  stroke="#4a90c4" strokeWidth="0.9"/>
            <line x1="544" y1="75"  x2="660" y2="75"  stroke="#4a90c4" strokeWidth="0.9"/>
          </g>
        </svg>
      </div>

      {/* ── Logo — top right (RTL) ── */}
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', justifyContent: 'flex-start', padding: isMobile ? '8px 8px 4px' : '12px 16px 6px', flexShrink: 0 }}>
        <img
          src={config.logoSrc}
          alt={config.logoAlt}
          style={{ height: isMobile ? 48 : 100, width: 'auto', objectFit: 'contain' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* ── Title ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          textAlign: 'center',
          direction: 'rtl',
          padding: isMobile ? '12px 16px 8px' : '16px 20px 12px',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            color: '#1a1a2e',
            marginBottom: 0,
            fontSize: isMobile ? '1.3rem' : '1.75rem',
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          לכל סטודיו יש סיפור אחר, מה יהיה שלך?
        </h1>
      </div>

      {/* ── Cards grid — size is based on viewport WIDTH only, never on logo/title height ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '4px 12px' : '8px 16px',
          overflow: 'hidden',
        }}
      >
        {/* Grid — explicit cardSize so cards never overflow on any viewport */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(2, ${cardSize}px)`,
            gridTemplateRows: `repeat(2, ${cardSize}px)`,
            gap,
          }}
        >
          {config.exhibitions.map((ex) => {
            const isSelected = selected === ex.id;
            const isHovered = hoveredId === ex.id;
            const glow = GLOW[ex.id] ?? '0 0 28px rgba(74, 144, 196, 0.5)';
            return (
              <button
                key={ex.id}
                onClick={() => setSelected(ex.id)}
                onMouseEnter={() => !isMobile && setHoveredId(ex.id)}
                onMouseLeave={() => !isMobile && setHoveredId(null)}
                style={{
                  position: 'relative',
                  width: cardSize,
                  height: cardSize,
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isSelected ? '3px solid #4a90c4' : '3px solid transparent',
                  transform: isHovered || isSelected ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: isSelected
                    ? '0 0 0 1px #4a90c4, ' + glow
                    : isHovered
                    ? glow
                    : '0 4px 18px rgba(0,0,0,0.12)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                  background: 'none',
                  padding: 0,
                  flexShrink: 0,
                }}
                aria-pressed={isSelected}
                aria-label={'בחר תערוכה: ' + ex.label}
              >
                <img
                  src={ex.image}
                  alt={ex.label}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                    padding: '24px 10px 10px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'white',
                      fontWeight: 600,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      fontSize: Math.max(11, Math.min(15, Math.floor(cardSize / 18))) + 'px',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      direction: 'rtl',
                    }}
                  >
                    {ex.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CTA row — in-flow so cards shrink to make room ── */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 10, padding: isMobile ? '6px 16px 4px' : '8px 16px 4px', minHeight: isMobile ? 52 : 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {selected && (
          <button
            onClick={() => { if (selected) onSelect(selected); }}
            className="btn-bounce cta-appear"
            style={{
              background: '#4a90c4',
              color: 'white',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: isMobile ? '0.9rem' : '1rem',
              padding: isMobile ? '10px 22px' : '11px 26px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(74,144,196,0.5)',
              transition: 'transform 0.2s ease',
            }}
            aria-label="המשך לשלב הבא"
          >
            <span>המשך</span>
            <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>→</span>
          </button>
        )}
      </div>

      {/* ── Footer — in-flow at bottom ── */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 14px 6px',
          direction: 'rtl',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: isMobile ? 9 : 11, color: '#888', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
          *המשחק ותוצאותיו אינן מחליפות ייעוץ מעמיק
        </span>
        <span style={{ fontSize: isMobile ? 9 : 11, color: '#888', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
          Powered by GrowAppMojo
        </span>
      </div>
    </div>
  );
}
