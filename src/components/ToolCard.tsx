// ── Tool Card — used in MissionScreen and TieScreen ──────────────────────────
import { useState, useRef, useEffect } from 'react';

interface Props {
  toolSrc: string;
  tooltipText: string;
  toolKey: 'a' | 'b';
  isSelected: boolean;
  isDisabled: boolean;
  isMobile: boolean;
  toolSize?: number; // optional override for responsive sizing
  onPick: (key: 'a' | 'b') => void;
  resetTooltip: number; // missionIndex or tieNo — triggers tooltip close on mission change
}

export default function ToolCard({
  toolSrc,
  tooltipText,
  toolKey,
  isSelected,
  isDisabled,
  isMobile,
  toolSize,
  onPick,
  resetTooltip,
}: Props) {
  const imgSize = toolSize ?? (isMobile ? 120 : 160);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Reset tooltip when mission changes
  useEffect(() => {
    setTooltipOpen(false);
  }, [resetTooltip]);

  // Close tooltip on outside click/touch
  useEffect(() => {
    if (!tooltipOpen) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setTooltipOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [tooltipOpen]);

  function handleInfoClick(e: React.MouseEvent | React.TouchEvent) {
    // Stop propagation so the wrapper doesn't trigger anything else
    e.stopPropagation();
    if ('preventDefault' in e && isMobile) e.preventDefault();
    setTooltipOpen((prev) => !prev);
  }

  return (
    <div ref={wrapperRef} className="relative flex flex-col items-center">
      {/* ── Tool selection button — clean tap target, no children that eat clicks ── */}
      <button
        onClick={() => !isDisabled && onPick(toolKey)}
        disabled={isDisabled}
        className={`
          relative rounded-2xl overflow-visible cursor-pointer
          transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white
          ${isSelected ? 'scale-110 ring-4 ring-white ring-offset-2' : ''}
          ${!isDisabled && !isSelected ? 'hover:scale-105' : ''}
          ${isDisabled && !isSelected ? 'opacity-40 cursor-default' : ''}
        `}
        aria-label={`בחר כלי: ${tooltipText}`}
        aria-pressed={isSelected}
        style={{
          background: isMobile ? 'rgba(0,0,0,0.4)' : 'transparent',
          padding: isMobile ? 8 : 0,
          borderRadius: 16,
        }}
      >
        <img
          src={toolSrc}
          alt={tooltipText}
          draggable={false}
          className="rounded-xl shadow-lg"
          style={{
            width: imgSize,
            height: imgSize,
            objectFit: 'contain',
            pointerEvents: 'none', // prevent img from intercepting touch on some browsers
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
      </button>

      {/* ── Info button — SIBLING of the tool button, never inside it ── */}
      <span
        role="button"
        tabIndex={0}
        onClick={handleInfoClick}
        onTouchEnd={handleInfoClick}
        onMouseEnter={() => !isMobile && setTooltipOpen(true)}
        onMouseLeave={() => !isMobile && setTooltipOpen(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setTooltipOpen((p) => !p); } }}
        className="absolute rounded-full flex items-center justify-center font-bold text-white"
        style={{
          background: 'rgba(26,26,46,0.85)',
          cursor: 'pointer',
          // Position at top-right — more discoverable in RTL layout
          top: isMobile ? 2 : 0,
          right: isMobile ? 2 : 0,
          width: isMobile ? 26 : 22,
          height: isMobile ? 26 : 22,
          fontSize: isMobile ? 12 : 11,
          zIndex: 20,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        aria-label={`מידע על ${tooltipText}`}
      >
        ⓘ
      </span>

      {/* Tooltip */}
      {tooltipOpen && (
        <div
          className="absolute bottom-full mb-2 z-50 px-3 py-2 text-sm shadow-lg"
          style={{
            background: '#1a1a2e',
            color: '#FFFFFF',
            borderRadius: 6,
            width: 'max-content',
            maxWidth: 200,
            whiteSpace: 'normal',
            textAlign: 'right',
            lineHeight: 1.4,
            direction: 'rtl',
            left: 0,
          }}
          role="tooltip"
        >
          {tooltipText}
        </div>
      )}
    </div>
  );
}
