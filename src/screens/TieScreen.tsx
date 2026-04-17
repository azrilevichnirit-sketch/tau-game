// Screen 2.5 - Tie Breaker
import { useState, useCallback, useRef, useEffect } from 'react';
import type { AvatarGender, TieMission, ToolKey } from '../types';
import { AVATARS } from '../data/avatars';
import { tieBg, tieBgTool, tieTool } from '../utils/assets';
import ToolCard from '../components/ToolCard';
import ProgressCanvas from '../components/ProgressCanvas';
import { useViewport } from '../hooks/useViewport';

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

const AVATAR_MS = 750;  // avatarCatch animation duration
const FLY_MS    = 360;  // clone flight duration

export default function TieScreen({ tieMission, tieNo, gender, isMuted, lastBg, onPick, onMuteToggle, onUndo }: Props) {
  const av = AVATARS[gender];
  const { vw, isMobile } = useViewport();
  const device: 'desktop' | 'mobile' = isMobile ? 'mobile' : 'desktop';
  const toolSize = isMobile ? Math.min(88, Math.floor(vw * 0.22)) : 160;

  // Start with lastBg (previous mission's bg) to avoid black flash — crossfade to tie bg on mount
  const [bgSrc, setBgSrc] = useState(lastBg || tieBg(tieNo, device));
  const [pendingBg, setPendingBg] = useState<string | null>(null);
  const [finalPick, setFinalPick] = useState<ToolKey | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [toolboxFading, setToolboxFading] = useState(false);
  const [undoConfirm, setUndoConfirm] = useState(false);
  // bgReady: hide UI until tie bg has fully loaded + crossfaded in (prevents choppy entrance)
  const [bgReady, setBgReady] = useState(false);

  // ── Catch animation ───────────────────────────────────────────────────────
  const [catchingKey, setCatchingKey]       = useState<ToolKey | null>(null);
  const [avatarCatching, setAvatarCatching] = useState(false);

  // ── Flying clone ──────────────────────────────────────────────────────────
  interface FlyClone { src: string; fromX: number; fromY: number; toX: number; toY: number; }
  const [flyClone, setFlyClone] = useState<FlyClone | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const avatarRef  = useRef<HTMLImageElement>(null);
  const toolboxRef = useRef<HTMLDivElement>(null);
  const flyRef     = useRef<HTMLDivElement>(null);

  const fadeTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crossfadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cloneSize = isMobile ? 44 : 56;

  // Escape closes undo confirm
  useEffect(() => {
    if (!undoConfirm) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setUndoConfirm(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undoConfirm]);

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

  useEffect(() => {
    return () => {
      if (fadeTimer.current)      clearTimeout(fadeTimer.current);
      if (idleTimer.current)      clearTimeout(idleTimer.current);
      if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
      if (pickTimer.current)      clearTimeout(pickTimer.current);
      if (avatarTimer.current)    clearTimeout(avatarTimer.current);
    };
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

  // ── Animate flying clone via Web Animations API ───────────────────────────
  useEffect(() => {
    if (!flyClone || !flyRef.current) return;
    const el = flyRef.current;
    const dx = flyClone.toX - flyClone.fromX;
    const dy = flyClone.toY - flyClone.fromY;
    const arcY = -Math.min(Math.abs(dy) * 0.25, 90);

    el.animate([
      { transform: 'translate(0,0) scale(1)',                                               offset: 0   },
      { transform: `translate(${dx*0.5}px,${dy*0.5 + arcY}px) scale(1.1)`,                offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(0.9)`,                                offset: 1   },
    ], { duration: FLY_MS, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' });
  }, [flyClone]);

  function handlePick(key: ToolKey) {
    if (finalPick || toolboxFading || catchingKey) return;
    setIsIdle(false);
    if (idleTimer.current)      { clearTimeout(idleTimer.current);      idleTimer.current = null; }
    if (crossfadeTimer.current) { clearTimeout(crossfadeTimer.current); crossfadeTimer.current = null; setPendingBg(null); }
    if (pickTimer.current)      { clearTimeout(pickTimer.current);      pickTimer.current = null; }
    if (avatarTimer.current)    { clearTimeout(avatarTimer.current);    avatarTimer.current = null; }

    // Start avatar catch animation
    setCatchingKey(key);
    setAvatarCatching(true);

    // Launch flying clone from toolbox → avatar
    if (toolboxRef.current && avatarRef.current) {
      const tbRect = toolboxRef.current.getBoundingClientRect();
      const avRect = avatarRef.current.getBoundingClientRect();
      setFlyClone({
        src:   tieTool(tieNo, key),
        fromX: tbRect.left  + tbRect.width  / 2,
        fromY: tbRect.top   + tbRect.height / 2,
        toX:   avRect.left  + avRect.width  / 2,
        toY:   avRect.top   + avRect.height / 2,
      });
    }

    // Clear clone after it lands
    pickTimer.current = setTimeout(() => setFlyClone(null), FLY_MS + 40);

    // After avatar returns: fade toolbox → change BG → onPick
    avatarTimer.current = setTimeout(() => {
      setAvatarCatching(false);
      setCatchingKey(null);
      setToolboxFading(true);

      fadeTimer.current = setTimeout(() => {
        setFinalPick(key);
        setBgSrc(tieBgTool(tieNo, key, device));
        onPick(key);
      }, 300);
    }, AVATAR_MS + 30);
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

      {/* ── Flying tool clone — fixed position, arcs diagonally to avatar ── */}
      {flyClone && (
        <div
          ref={flyRef}
          style={{
            position: 'fixed',
            left: flyClone.fromX - cloneSize / 2,
            top:  flyClone.fromY - cloneSize / 2,
            width: cloneSize, height: cloneSize,
            zIndex: 100, pointerEvents: 'none',
          }}
        >
          <img src={flyClone.src} alt='' style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
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
          <div className={(isIdle ? 'idle-pulse ' : '') + 'bubble-enter'} style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', borderRadius: 20, padding: isMobile ? '9px 11px' : '12px 14px', maxWidth: 700, width: '100%', overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 8 : 10 }}>
              <img
                ref={avatarRef}
                src={av.image}
                alt={av.name}
                className={avatarCatching ? 'avatar-catching' : ''}
                style={{ height: isMobile ? 58 : 88, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#4a90c4', fontSize: isMobile ? '0.7rem' : '0.78rem', fontWeight: 600, margin: '0 0 3px 0', letterSpacing: '0.03em' }}>משימה 16</p>
                <p style={{ color: '#1a1a2e', lineHeight: 1.45, fontSize: isMobile ? '0.87rem' : '1rem', margin: 0 }}>{tieMission.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo — top-right, only visible before pick (same two-step confirm as MissionScreen) */}
      {bgReady && !finalPick && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 30 }}>
          <div style={{ position: 'relative' }}>
            <button
              style={{ opacity: 0.85, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              onClick={() => setUndoConfirm(v => !v)}
            >
              <span style={{ fontSize: isMobile ? 15 : 18, color: 'white' }}>&#8618;</span>
            </button>
            {undoConfirm && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setUndoConfirm(false)} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'rgba(255,255,255,0.97)', borderRadius: 14, padding: isMobile ? '10px 12px' : '14px 18px', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', width: isMobile ? 'min(180px, calc(100vw - 24px))' : 200, zIndex: 50, direction: 'rtl' }}>
                  <p style={{ fontWeight: 'bold', color: '#1a1a2e', textAlign: 'center', marginBottom: 10, fontSize: isMobile ? '0.85rem' : '1rem' }}>רוצה לחזור אחורה?</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button style={{ background: '#4a90c4', color: 'white', border: 'none', borderRadius: 20, padding: isMobile ? '4px 14px' : '6px 20px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-body)' }} onClick={() => { setUndoConfirm(false); onUndo(); }}>כן</button>
                    <button style={{ background: '#eee', color: '#1a1a2e', border: 'none', borderRadius: 20, padding: isMobile ? '4px 14px' : '6px 20px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-body)' }} onClick={() => setUndoConfirm(false)}>לא</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toolbox — mirrors MissionScreen sizing */}
      {bgReady && (!finalPick || toolboxFading) && (
        <div
          ref={toolboxRef}
          style={{
            position: 'absolute', bottom: isMobile ? 52 : 66, left: isMobile ? 16 : 32, zIndex: 20,
            display: 'flex', gap: isMobile ? 8 : 14,
            background: 'rgba(40,25,10,0.82)', borderRadius: 18,
            padding: isMobile ? '6px 8px' : '10px 14px',
            backdropFilter: 'blur(6px)', border: '1.5px solid rgba(180,130,60,0.4)',
            opacity: toolboxFading ? 0 : 1,
            transition: 'opacity 0.3s ease',
            pointerEvents: toolboxFading ? 'none' : undefined,
          }}>
          <div className="tool-enter-a">
            <ToolCard toolSrc={tieTool(tieNo, 'a')} tooltipText={tieMission.toolA.tooltipText} toolKey="a" isSelected={finalPick === 'a'} isDisabled={finalPick !== null || (catchingKey !== null && catchingKey !== 'a')} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={tieNo} />
          </div>
          <div className="tool-enter-b">
            <ToolCard toolSrc={tieTool(tieNo, 'b')} tooltipText={tieMission.toolB.tooltipText} toolKey="b" isSelected={finalPick === 'b'} isDisabled={finalPick !== null || (catchingKey !== null && catchingKey !== 'b')} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={tieNo} />
          </div>
        </div>
      )}

    </div>
  );
}
