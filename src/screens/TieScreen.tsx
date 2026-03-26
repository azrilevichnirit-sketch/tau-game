// Screen 2.5 - Tie Breaker
import { useState, useCallback, useRef, useEffect } from 'react';
import type { AvatarGender, TieMission, ToolKey } from '../types';
import { AVATARS } from '../data/avatars';
import { tieBg, tieBgTool, tieTool } from '../utils/assets';
import ToolCard from '../components/ToolCard';
import ProgressCanvas from '../components/ProgressCanvas';

interface Props {
  tieMission: TieMission;
  tieNo: number;
  gender: AvatarGender;
  isMuted: boolean;
  lastBg?: string;                    // bg from previous mission — crossfade from it on mount
  onPick: (key: ToolKey) => void;
  onMuteToggle: () => void;
  onUndo: () => void;                 // returns to mission 15
}

export default function TieScreen({ tieMission, tieNo, gender, isMuted, lastBg, onPick, onMuteToggle, onUndo }: Props) {
  const av = AVATARS[gender];
  const vw = window.innerWidth;
  const isMobile = vw < 768;
  const device: 'desktop' | 'mobile' = isMobile ? 'mobile' : 'desktop';
  const toolSize = isMobile ? Math.min(88, Math.floor(vw * 0.22)) : 160;

  // Start with lastBg (previous mission's bg) to avoid black flash — crossfade to tie bg on mount
  const [bgSrc, setBgSrc] = useState(lastBg || tieBg(tieNo, device));
  const [pendingBg, setPendingBg] = useState<string | null>(null);
  const [finalPick, setFinalPick] = useState<ToolKey | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [toolboxFading, setToolboxFading] = useState(false);
  // bgReady: hide UI until tie bg has fully loaded + crossfaded in (prevents choppy entrance)
  const [bgReady, setBgReady] = useState(false);

  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crossfadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: crossfade from lastBg to actual tie bg — wait for image load first
  useEffect(() => {
    const target = tieBg(tieNo, device);
    // Preload tool bgs while user reads the question
    [tieBgTool(tieNo, 'a', device), tieBgTool(tieNo, 'b', device)].forEach(src => { new window.Image().src = src; });
    if (lastBg && lastBg !== target) {
      let canceled = false;
      const img = new window.Image();
      img.onload = () => {
        if (canceled) return;
        setPendingBg(target);
        crossfadeTimer.current = setTimeout(() => {
          setBgSrc(target);
          setPendingBg(null);
          setBgReady(true); // show UI only after tie bg is in place
        }, 500);
      };
      img.onerror = () => { if (!canceled) { setBgSrc(target); setBgReady(true); } };
      img.src = target;
      return () => { canceled = true; if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current); };
    }
    // No crossfade needed (no lastBg or already correct) — show UI immediately
    setBgReady(true);
    return () => { if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setIsIdle(false);
    if (!finalPick) idleTimer.current = setTimeout(() => setIsIdle(true), 3500);
  }, [finalPick]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [resetIdleTimer]);

  function handlePick(key: ToolKey) {
    if (finalPick || toolboxFading) return;
    setIsIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setToolboxFading(true);
    fadeTimer.current = setTimeout(() => {
      setFinalPick(key);
      setBgSrc(tieBgTool(tieNo, key, device));
      onPick(key);
    }, 300);
  }

  return (
    // No screen-fade class — we start at full opacity with lastBg then crossfade to tie bg
    <div
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', backgroundImage: 'url(' + bgSrc + ')', backgroundSize: 'cover', backgroundPosition: 'center center', direction: 'rtl', fontFamily: 'var(--font-body)' }}
      onClick={resetIdleTimer}>

      {/* Bg crossfade overlay — fades in tie bg over previous mission's bg */}
      {pendingBg && (
        <div className='absolute inset-0' style={{ zIndex: 1, backgroundImage: 'url(' + pendingBg + ')', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'bgFade 0.5s ease forwards' }} />
      )}

      {/* Top-left: progress canvas — tie mission = mission 16, 15 completed so far */}
      {bgReady && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 30 }}>
          <ProgressCanvas completed={15} total={16} />
        </div>
      )}

      {/* Mute — fixed bottom-right */}
      {bgReady && (
        <button
          style={{ position: 'absolute', bottom: 14, right: 14, opacity: 0.75, zIndex: 30, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={onMuteToggle}
        >
          <span style={{ fontSize: isMobile ? 16 : 20 }}>{isMuted ? '🔇' : '🔊'}</span>
        </button>
      )}

      {/* Speech bubble — always labelled "משימה 16" */}
      {bgReady && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: isMobile ? '52px 10px 0' : '56px 14px 0', display: 'flex', justifyContent: 'center', zIndex: 5 }}>
          <div className={(isIdle ? 'idle-pulse ' : '') + 'bubble-enter'} style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', borderRadius: 20, padding: isMobile ? '9px 11px' : '12px 14px', maxWidth: 700, width: '100%' }}>
            <div style={{ textAlign: 'right', fontSize: '0.78rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4, fontFamily: 'var(--font-body)' }}>משימה 16</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 8 : 10 }}>
              <img src={av.image} alt={av.name} style={{ height: isMobile ? 36 : 48, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <p style={{ color: '#1a1a2e', lineHeight: 1.45, fontSize: isMobile ? '0.87rem' : '1rem', margin: 0 }}>{tieMission.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Undo — top-right, only visible before pick */}
      {bgReady && !finalPick && (
        <button
          onClick={onUndo}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 30,
            opacity: 0.85, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
            width: isMobile ? 32 : 36, height: isMobile ? 32 : 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(4px)',
          }}
        >
          <span style={{ fontSize: isMobile ? 15 : 18, color: 'white' }}>&#8618;</span>
        </button>
      )}

      {/* Toolbox — mirrors MissionScreen sizing */}
      {bgReady && (!finalPick || toolboxFading) && (
        <div style={{
          position: 'absolute', bottom: isMobile ? 52 : 66, left: isMobile ? 16 : 32, zIndex: 20,
          display: 'flex', gap: isMobile ? 8 : 14,
          background: 'rgba(40,25,10,0.82)', borderRadius: 18,
          padding: isMobile ? '6px 8px' : '10px 14px',
          backdropFilter: 'blur(6px)', border: '1.5px solid rgba(180,130,60,0.4)',
          opacity: toolboxFading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          pointerEvents: toolboxFading ? 'none' : undefined,
        }}>
          <ToolCard toolSrc={tieTool(tieNo, 'a')} tooltipText={tieMission.toolA.tooltipText} toolKey="a" isSelected={finalPick === 'a'} isDisabled={finalPick !== null} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={tieNo} />
          <ToolCard toolSrc={tieTool(tieNo, 'b')} tooltipText={tieMission.toolB.tooltipText} toolKey="b" isSelected={finalPick === 'b'} isDisabled={finalPick !== null} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={tieNo} />
        </div>
      )}

    </div>
  );
}
