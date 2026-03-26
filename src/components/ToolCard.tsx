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
  const cardRef = useRef<HTMLButtonElement>(null);

  // Reset tooltip when mission changes
  useEffect(() => {
    setTooltipOpen(false);
  }, [resetTooltip]);

  // Close tooltip on outside click (mobile)
  useEffect(() => {
    if (!tooltipOpen) return;
    function handleOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setTooltipOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [tooltipOpen]);

  function handleInfoClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isMobile) {
      setTooltipOpen((prev) => !prev);
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      <button
        ref={cardRef}
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
          // Mobile: semi-transparent bg behind each tool separately
          background: isMobile ? 'rgba(0,0,0,0.4)' : 'transparent',
          padding: isMobile ? 8 : 0,
          borderRadius: 16,
        }}
      >
        <img
          src={toolSrc}
          alt={tooltipText}
          className="rounded-xl shadow-lg"
          style={{
            width: imgSize,
            height: imgSize,
            objectFit: 'contain',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />

        {/* Finding 19 — was nested <button> inside <button> (invalid HTML).
             Replaced with <span role="button"> to preserve semantics without nesting. */}
        <span
          role="button"
          tabIndex={0}
          onClick={handleInfoClick}
          onMouseEnter={() => !isMobile && setTooltipOpen(true)}
          onMouseLeave={() => !isMobile && setTooltipOpen(false)}
          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleInfoClick(e as unknown as React.MouseEvent); }}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleInfoClick(e as unknown as React.MouseEvent)}
          className="absolute top-0 left-0 rounded-full flex items-center justify-center font-bold text-white"
          style={{
            background: 'rgba(26,26,46,0.85)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            width: isMobile ? 40 : 24,
            height: isMobile ? 40 : 24,
            fontSize: isMobile ? 16 : 12,
            zIndex: 10,
          }}
          aria-label={`מידע על ${tooltipText}`}
        >
          ⓘ
        </span>
      </button>

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
