// ── Screen 2.2 — בחירת אווטר ────────────────────────────────────────────
import { useState } from 'react';
import type { AvatarGender } from '../types';
import { AVATARS } from '../data/avatars';

interface Props {
  onSelect: (gender: AvatarGender) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export default function AvatarScreen({ onSelect, isMuted, onMuteToggle }: Props) {
  const [selected, setSelected] = useState<AvatarGender | null>(null);

  function handleClick(gender: AvatarGender) {
    setSelected(gender);
    setTimeout(() => onSelect(gender), 500);
  }

  const vw = window.innerWidth;
  const isMobile = vw < 768;
  const bgSrc = isMobile
    ? '/assets/second_page/bg_mobile.webp'
    : '/assets/second_page/bg_desktop.webp';

  return (
    <div
      className="screen-fade"
      style={{
        position: 'fixed', inset: 0, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundImage: `url(${bgSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        direction: 'rtl',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-2 px-4">
        {/* Title */}
        <h1
          className="text-white text-3xl md:text-4xl font-bold text-center mb-1"
          style={{ fontFamily: 'var(--font-heading)', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
        >
          נועה או ליאו
        </h1>
        <p
          className="text-white text-lg text-center mb-8"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
        >
          בוחרים ומתחילים
        </p>

        {/* Avatars side by side — נועה משמאל, ליאו מימין */}
        <div className="flex gap-8 md:gap-16 justify-center">
          {(['female', 'male'] as AvatarGender[]).map((gender) => {
            const av = AVATARS[gender];
            const isChosen = selected === gender;
            return (
              <button
                key={gender}
                onClick={() => handleClick(gender)}
                disabled={selected !== null}
                className={`
                  flex flex-col items-center gap-3 cursor-pointer
                  transition-all duration-300 rounded-2xl p-2
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white
                  ${isChosen ? 'avatar-selected' : 'hover:scale-105'}
                  ${selected !== null && !isChosen ? 'opacity-40' : ''}
                `}
                style={{ background: 'transparent', border: 'none' }}
                aria-label={`בחר באווטר ${av.name}`}
              >
                <img
                  src={av.image}
                  alt={av.name}
                  className="rounded-xl shadow-lg"
                  style={{
                    height: isMobile ? Math.min(180, Math.floor(vw * 0.45)) : 260,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: isChosen ? 'drop-shadow(0 0 16px #4a90c4)' : 'none',
                  }}
                />
                {/* אין שם מתחת לדמויות */}
              </button>
            );
          })}
        </div>
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
    </div>
  );
}
