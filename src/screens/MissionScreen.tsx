// Screen 2.4 - Mission Screen
import { useState, useEffect, useCallback, useRef } from 'react';
import type { AvatarGender, Mission, ToolKey } from '../types';
import { AVATARS } from '../data/avatars';
import { missionBg, missionBgTool, missionTool, mission5AGif } from '../utils/assets';
import ToolCard from '../components/ToolCard';
import ProgressCanvas from '../components/ProgressCanvas';
import { useViewport } from '../hooks/useViewport';

interface Props {
  mission: Mission;
  missionIndex: number;
  totalMissions: number;
  gender: AvatarGender;
  finalPick: ToolKey | null;
  lastBg?: string;
  isMuted: boolean;
  canUndo: boolean;
  onPick: (key: ToolKey, bgDesktop: string, bgMobile: string) => void;
  onUndo: () => void;
  onMuteToggle: () => void;
}

const PIVOT_BEATS: Record<number, string> = {
  4:  'וואו, נראה שזה עובד לנו!',
  7:  'ההתרגשות פה בשיאה!',
  11: 'תמיד רציתי להחזיר לקהילה',
};

const BEAT_HOLD  = 2200;
const BEAT_FADE  = 320;
const AVATAR_MS  = 750;  // avatarCatch animation duration
const FLY_MS     = 360;  // clone flight duration — arrives near avatar peak (~62% of AVATAR_MS)

export default function MissionScreen({ mission, missionIndex, totalMissions, gender, finalPick, lastBg, isMuted, canUndo, onPick, onUndo, onMuteToggle }: Props) {
  const av = AVATARS[gender];
  const { vw, isMobile } = useViewport();
  const isSmallScreen = !isMobile && vw < 1440;
  const toolSize = isMobile
    ? Math.min(88, Math.floor(vw * 0.22))
    : isSmallScreen ? 110 : 160;
  const missionNo = missionIndex + 1;
  const device = isMobile ? 'mobile' : 'desktop';
  const baseBg = missionNo === 11 ? (lastBg || missionBg(10, device)) : missionBg(missionNo, device);

  const [bgSrc, setBgSrc]         = useState(baseBg);
  const [pendingBg, setPendingBg] = useState<string | null>(null);
  const [bgReady, setBgReady]     = useState(false);
  const [showGif, setShowGif]     = useState(false);
  const [isIdle, setIsIdle]       = useState(false);
  const [toolboxFading, setToolboxFading] = useState(false);
  const [undoConfirm, setUndoConfirm]     = useState(false);

  // ── Catch animation ───────────────────────────────────────────────────────
  const [catchingKey, setCatchingKey]       = useState<ToolKey | null>(null);
  const [avatarCatching, setAvatarCatching] = useState(false);

  // ── Flying clone ──────────────────────────────────────────────────────────
  interface FlyClone { src: string; fromX: number; fromY: number; toX: number; toY: number; }
  const [flyClone, setFlyClone] = useState<FlyClone | null>(null);

  // ── Beat overlay ──────────────────────────────────────────────────────────
  const [beatVisible, setBeatVisible] = useState(false);
  const [beatFadeOut, setBeatFadeOut] = useState(false);
  const [beatText, setBeatText]       = useState('');

  // ── Refs ──────────────────────────────────────────────────────────────────
  const avatarRef  = useRef<HTMLImageElement>(null);
  const toolboxRef = useRef<HTMLDivElement>(null);
  const flyRef     = useRef<HTMLDivElement>(null);

  const idleTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crossfadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beatTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!undoConfirm) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setUndoConfirm(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undoConfirm]);

  useEffect(() => {
    const base = missionNo === 11 ? (lastBg || missionBg(10, device)) : missionBg(missionNo, device);
    setShowGif(false); setIsIdle(false); setToolboxFading(false); setUndoConfirm(false);
    setBgReady(false); setCatchingKey(null); setAvatarCatching(false); setFlyClone(null);
    setBeatVisible(false); setBeatFadeOut(false);
    if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
    if (pickTimer.current)      clearTimeout(pickTimer.current);
    if (avatarTimer.current)    clearTimeout(avatarTimer.current);
    let canceled = false;
    const img = new window.Image();
    img.onload = () => {
      if (canceled) return;
      setPendingBg(base);
      crossfadeTimer.current = setTimeout(() => { setBgSrc(base); setPendingBg(null); setBgReady(true); }, 500);
    };
    img.onerror = () => { if (!canceled) { setBgSrc(base); setBgReady(true); } };
    img.src = base;
    return () => { canceled = true; };
  }, [missionIndex]);

  useEffect(() => {
    const bgA_d = missionBgTool(missionNo, 'a', 'desktop', gender);
    const bgB_d = missionBgTool(missionNo, 'b', 'desktop', gender);
    const bgB_m = missionBgTool(missionNo, 'b', 'mobile', gender);
    // Mission 5-A uses a gif overlay on pick — no bg change, so skip the mobile preload (file doesn't exist)
    const preloads = missionNo === 5
      ? [bgA_d, bgB_d, bgB_m]
      : [bgA_d, bgB_d, missionBgTool(missionNo, 'a', 'mobile', gender), bgB_m];
    preloads.forEach(src => { new window.Image().src = src; });
  }, [missionIndex]);

  function changeBg(newBg: string) {
    if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
    const img = new window.Image();
    img.onload = () => {
      setPendingBg(newBg);
      crossfadeTimer.current = setTimeout(() => { setBgSrc(newBg); setPendingBg(null); }, 500);
    };
    img.onerror = () => { setBgSrc(newBg); };
    img.src = newBg;
  }

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setIsIdle(false);
    if (!finalPick) idleTimer.current = setTimeout(() => setIsIdle(true), 3500);
  }, [finalPick]);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [resetIdleTimer]);

  useEffect(() => {
    return () => {
      if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
      if (pickTimer.current)      clearTimeout(pickTimer.current);
      if (avatarTimer.current)    clearTimeout(avatarTimer.current);
      if (beatTimer.current)      clearTimeout(beatTimer.current);
    };
  }, []);

  // ── Animate flying clone via Web Animations API ───────────────────────────
  useEffect(() => {
    if (!flyClone || !flyRef.current) return;
    const el = flyRef.current;
    const dx = flyClone.toX - flyClone.fromX;
    const dy = flyClone.toY - flyClone.fromY;
    // Arc peak: midpoint raised above the straight line
    // Arc: curve above the straight-line midpoint; capped so it stays on-screen
    const arcY = -Math.min(Math.abs(dy) * 0.25, 90);

    el.animate([
      { transform: 'translate(0,0) scale(1)',                                               offset: 0   },
      { transform: `translate(${dx*0.5}px,${dy*0.5 + arcY}px) scale(1.1)`,                offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(0.9)`,                                offset: 1   },
    ], { duration: FLY_MS, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' });
  }, [flyClone]);

  // ── handlePick ────────────────────────────────────────────────────────────
  function handlePick(key: ToolKey) {
    if (finalPick || toolboxFading || catchingKey) return;

    setIsIdle(false);
    if (idleTimer.current)      { clearTimeout(idleTimer.current);      idleTimer.current = null; }
    if (crossfadeTimer.current) { clearTimeout(crossfadeTimer.current); crossfadeTimer.current = null; setPendingBg(null); }
    if (pickTimer.current)      { clearTimeout(pickTimer.current);      pickTimer.current = null; }
    if (avatarTimer.current)    { clearTimeout(avatarTimer.current);    avatarTimer.current = null; }
    if (beatTimer.current)      { clearTimeout(beatTimer.current);      beatTimer.current = null; }

    const beatContent   = PIVOT_BEATS[missionIndex] ?? null;
    const capturedBgSrc = bgSrc;

    // Start avatar catch animation
    setCatchingKey(key);
    setAvatarCatching(true);

    // Launch flying clone from toolbox → avatar
    if (toolboxRef.current && avatarRef.current) {
      const tbRect  = toolboxRef.current.getBoundingClientRect();
      const avRect  = avatarRef.current.getBoundingClientRect();
      setFlyClone({
        src:   missionTool(missionNo, key),
        fromX: tbRect.left  + tbRect.width  / 2,
        fromY: tbRect.top   + tbRect.height / 2,
        toX:   avRect.left  + avRect.width  / 2,
        toY:   avRect.top   + avRect.height / 2,
      });
    }

    // Clear clone after it lands
    pickTimer.current = setTimeout(() => setFlyClone(null), FLY_MS + 40);

    // After avatar returns: fade toolbox AND start bg change simultaneously → onPick
    avatarTimer.current = setTimeout(() => {
      setAvatarCatching(false);
      setCatchingKey(null);
      setToolboxFading(true);

      // Bg change starts at the same moment as toolbox fade — eliminates the "freeze" gap
      let bgD = capturedBgSrc, bgM = capturedBgSrc;
      if (missionNo === 5 && key === 'a') {
        setShowGif(true);
      } else {
        bgD = missionBgTool(missionNo, key, 'desktop', gender);
        bgM = missionBgTool(missionNo, key, 'mobile', gender);
        changeBg(device === 'desktop' ? bgD : bgM);
      }

      if (beatContent) {
        setBeatText(beatContent);
        setBeatVisible(true);
        beatTimer.current = setTimeout(() => {
          setBeatFadeOut(true);
          setTimeout(() => {
            setBeatVisible(false); setBeatFadeOut(false); setBeatText('');
            onPick(key, bgD, bgM);
          }, BEAT_FADE);
        }, BEAT_HOLD);
      } else {
        // 300ms: let crossfade begin before advancing state
        pickTimer.current = setTimeout(() => onPick(key, bgD, bgM), 300);
      }
    }, AVATAR_MS + 30);
  }

  const cloneSize = isMobile ? 44 : 56;

  return (
    <div
      className='screen-fade'
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', backgroundImage: 'url(' + bgSrc + ')', backgroundSize: 'cover', backgroundPosition: 'center center', direction: 'rtl', fontFamily: 'var(--font-body)' }}
      onClick={resetIdleTimer}
      onKeyDown={resetIdleTimer}
    >
      {pendingBg && (
        <div className='absolute inset-0' style={{ zIndex: 1, backgroundImage: 'url(' + pendingBg + ')', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'bgFade 0.5s ease forwards' }} />
      )}

      {showGif && (
        <div className='absolute inset-x-0 bottom-0 flex justify-center pointer-events-none' style={{ zIndex: 2 }}>
          <img src={mission5AGif()} alt='' style={{ height: isMobile ? '50vh' : '62vh', width: 'auto', objectFit: 'contain', display: 'block', transform: 'scaleX(-1)' }} />
        </div>
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

      {/* Beat overlay */}
      {beatVisible && (
        <div className={beatFadeOut ? '' : 'beat-in'} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(8,8,15,0.87)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: beatFadeOut ? 0 : 1, transition: beatFadeOut ? `opacity ${BEAT_FADE}ms ease` : undefined }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: isMobile ? '1.55rem' : '2rem', color: '#ffffff', textAlign: 'center', maxWidth: 500, padding: '0 28px', fontWeight: 700, lineHeight: 1.45 }}>{beatText}</p>
        </div>
      )}

      {/* Progress wheel — top-left */}
      {bgReady && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 30, opacity: toolboxFading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
          <ProgressCanvas completed={missionIndex} total={totalMissions} />
        </div>
      )}

      {/* Undo */}
      {bgReady && canUndo && missionIndex >= 1 && (!finalPick || toolboxFading) && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 30, opacity: toolboxFading ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: toolboxFading ? 'none' : undefined }}>
          <div style={{ position: 'relative' }}>
            <button style={{ opacity: 0.85, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }} onClick={() => setUndoConfirm(v => !v)}>
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

      {/* Mute */}
      {bgReady && (!finalPick || toolboxFading) && (
        <button style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 30, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: toolboxFading ? 0 : 0.75, transition: 'opacity 0.3s ease', pointerEvents: toolboxFading ? 'none' : undefined }} onClick={onMuteToggle}>
          <span style={{ fontSize: isMobile ? 16 : 20 }}>{isMuted ? '🔇' : '🔊'}</span>
        </button>
      )}

      {/* Speech bubble — avatar scales up on catch */}
      {bgReady && (!finalPick || toolboxFading) && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: isMobile ? '52px 10px 0' : '56px 14px 0', display: 'flex', justifyContent: 'center', zIndex: 5, opacity: toolboxFading ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: toolboxFading ? 'none' : undefined }}>
          <div key={missionIndex} className={(isIdle ? 'idle-pulse ' : '') + 'bubble-enter'} style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', borderRadius: 20, padding: isMobile ? '9px 11px' : '12px 14px', maxWidth: 700, width: '100%', overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 8 : 10 }}>
              <img
                ref={avatarRef}
                src={av.image}
                alt={av.name}
                className={avatarCatching ? 'avatar-catching' : ''}
                style={{ height: isMobile ? 58 : 88, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#4a90c4', fontSize: isMobile ? '0.7rem' : '0.78rem', fontWeight: 600, margin: '0 0 3px 0', letterSpacing: '0.03em' }}>משימה {missionNo}</p>
                <p style={{ color: '#1a1a2e', lineHeight: 1.45, fontSize: isMobile ? '0.87rem' : '1rem', margin: 0 }}>{mission.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbox */}
      {bgReady && (!finalPick || toolboxFading) && (
        <div
          ref={toolboxRef}
          key={'toolbox-' + missionIndex}
          className={isIdle ? 'toolbox-idle' : 'toolbox-appear'}
          style={{ position: 'absolute', bottom: isMobile ? 52 : isSmallScreen ? 48 : 66, left: isMobile ? 16 : isSmallScreen ? 24 : 32, zIndex: 20, display: 'flex', gap: isMobile ? 8 : isSmallScreen ? 8 : 14, background: 'rgba(40,25,10,0.82)', borderRadius: 16, padding: isMobile ? '6px 8px' : isSmallScreen ? '6px 8px' : '10px 14px', backdropFilter: 'blur(6px)', border: '1.5px solid rgba(180,130,60,0.4)', opacity: toolboxFading ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: toolboxFading ? 'none' : undefined }}
        >
          <div className='tool-enter-a'>
            <ToolCard toolSrc={missionTool(missionNo, 'a')} tooltipText={mission.toolA.tooltipText} toolKey='a' isSelected={finalPick === 'a'} isDisabled={finalPick !== null || (catchingKey !== null && catchingKey !== 'a')} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={missionIndex} />
          </div>
          <div className='tool-enter-b'>
            <ToolCard toolSrc={missionTool(missionNo, 'b')} tooltipText={mission.toolB.tooltipText} toolKey='b' isSelected={finalPick === 'b'} isDisabled={finalPick !== null || (catchingKey !== null && catchingKey !== 'b')} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={missionIndex} />
          </div>
        </div>
      )}
    </div>
  );
}
