// Screen 2.4 - Mission Screen
import { useState, useEffect, useCallback, useRef } from 'react';
import type { AvatarGender, Mission, ToolKey } from '../types';
import { AVATARS } from '../data/avatars';
import { missionBg, missionBgTool, missionTool, mission5AGif } from '../utils/assets';
import ToolCard from '../components/ToolCard';
import ProgressCanvas from '../components/ProgressCanvas';

interface Props {
  mission: Mission;
  missionIndex: number;
  totalMissions: number;
  completedCount: number;
  gender: AvatarGender;
  finalPick: ToolKey | null;
  lastBg?: string;
  isMuted: boolean;
  canUndo: boolean;
  onPick: (key: ToolKey, bgDesktop: string, bgMobile: string) => void;
  onUndo: () => void;
  onMuteToggle: () => void;
}

export default function MissionScreen({ mission, missionIndex, totalMissions, completedCount, gender, finalPick, lastBg, isMuted, canUndo, onPick, onUndo, onMuteToggle }: Props) {
  const av = AVATARS[gender];
  const vw = window.innerWidth;
  const isMobile = vw < 768;
  const isSmallScreen = !isMobile && vw < 1440;
  // Responsive tool size: on mobile scale with viewport width
  const toolSize = isMobile
    ? Math.min(88, Math.floor(vw * 0.22))
    : isSmallScreen ? 110 : 160;
  const missionNo = missionIndex + 1;
  const device = isMobile ? 'mobile' : 'desktop';
  const baseBg = missionNo === 11 && lastBg ? lastBg : missionBg(missionNo, device);

  const [bgSrc, setBgSrc] = useState(baseBg);
  const [pendingBg, setPendingBg] = useState<string | null>(null);
  const [bgReady, setBgReady] = useState(false); // true only after base bg is loaded + crossfade done
  const [showGif, setShowGif] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [toolboxFading, setToolboxFading] = useState(false);
  const [undoConfirm, setUndoConfirm] = useState(false);

  // Close undo dialog on Escape key
  useEffect(() => {
    if (!undoConfirm) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setUndoConfirm(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undoConfirm]);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crossfadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const base = missionNo === 11 && lastBg ? lastBg : missionBg(missionNo, device);
    setShowGif(false);
    setIsIdle(false);
    setToolboxFading(false);
    setUndoConfirm(false);
    setBgReady(false); // hide UI until new bg is in place
    if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
    if (pickTimer.current) clearTimeout(pickTimer.current);
    // Wait for image to load before crossfading — prevents blank overlay in production
    let canceled = false;
    const img = new window.Image();
    img.onload = () => {
      if (canceled) return;
      setPendingBg(base);
      crossfadeTimer.current = setTimeout(() => {
        setBgSrc(base); setPendingBg(null); setBgReady(true);
      }, 500);
    };
    img.onerror = () => { if (!canceled) { setBgSrc(base); setBgReady(true); } };
    img.src = base;
    return () => { canceled = true; };
  }, [missionIndex]);

  // Preload tool backgrounds as soon as mission starts so they're cached on pick
  useEffect(() => {
    const bgA_d = missionBgTool(missionNo, 'a', 'desktop', gender);
    const bgB_d = missionBgTool(missionNo, 'b', 'desktop', gender);
    const bgA_m = missionBgTool(missionNo, 'a', 'mobile', gender);
    const bgB_m = missionBgTool(missionNo, 'b', 'mobile', gender);
    [bgA_d, bgB_d, bgA_m, bgB_m].forEach(src => { new window.Image().src = src; });
  }, [missionIndex]);

  // Crossfade background: wait for image load before showing overlay
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

  // Finding 8 — clean up crossfade + pick timers on unmount
  useEffect(() => {
    return () => {
      if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
      if (pickTimer.current) clearTimeout(pickTimer.current);
    };
  }, []);

  function handlePick(key: ToolKey) {
    if (finalPick || toolboxFading) return;
    setIsIdle(false);
    if (idleTimer.current)     { clearTimeout(idleTimer.current);     idleTimer.current = null; }
    if (crossfadeTimer.current){ clearTimeout(crossfadeTimer.current); crossfadeTimer.current = null; setPendingBg(null); }
    if (pickTimer.current)     { clearTimeout(pickTimer.current);     pickTimer.current = null; }

    // 1) Fade toolbox out first
    setToolboxFading(true);

    // 2) After fade completes — start bg crossfade + commit pick
    const capturedBgSrc = bgSrc;
    pickTimer.current = setTimeout(() => {
      let bgD = capturedBgSrc, bgM = capturedBgSrc;
      if (missionNo === 5 && key === 'a') {
        setShowGif(true);
      } else {
        bgD = missionBgTool(missionNo, key, 'desktop', gender);
        bgM = missionBgTool(missionNo, key, 'mobile', gender);
        changeBg(device === 'desktop' ? bgD : bgM);
      }
      onPick(key, bgD, bgM);
    }, 300);
  }

  return (
    <div
      className='screen-fade'
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        backgroundImage: 'url(' + bgSrc + ')',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        direction: 'rtl',
        fontFamily: 'var(--font-body)',
      }}
      onClick={resetIdleTimer}
      onKeyDown={resetIdleTimer}
    >

      {/* Bg crossfade overlay — fades in new bg over old */}
      {pendingBg && (
        <div
          className='absolute inset-0'
          style={{ zIndex: 1, backgroundImage: 'url(' + pendingBg + ')', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'bgFade 0.5s ease forwards' }}
        />
      )}

      {/* GIF overlay for mission 5A — anchored to floor */}
      {showGif && (
        <div className='absolute inset-x-0 bottom-0 flex justify-center pointer-events-none' style={{ zIndex: 2 }}>
          <img
            src={mission5AGif()}
            alt=''
            style={{ height: isMobile ? '50vh' : '62vh', width: 'auto', objectFit: 'contain', display: 'block', transform: 'scaleX(-1)' }}
          />
        </div>
      )}

      {/* Top-left: progress canvas — fades out on pick */}
      {bgReady && (!finalPick || toolboxFading) && (
        <div style={{
          position: 'absolute', top: 18, left: 18, zIndex: 30,
          opacity: toolboxFading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          pointerEvents: toolboxFading ? 'none' : undefined,
        }}>
          <ProgressCanvas completed={completedCount} total={totalMissions} />
        </div>
      )}

      {/* Top-right: undo button — fades out on pick */}
      {bgReady && canUndo && missionIndex >= 1 && (!finalPick || toolboxFading) && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 30,
          opacity: toolboxFading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          pointerEvents: toolboxFading ? 'none' : undefined,
        }}>
          <div style={{ position: 'relative' }}>
            <button
              style={{ opacity: 0.85, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              onClick={() => setUndoConfirm(v => !v)}
            >
              <span style={{ fontSize: isMobile ? 15 : 18, color: 'white' }}>&#8618;</span>
            </button>
            {undoConfirm && (
              <>
                {/* Transparent backdrop — click outside to cancel */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  onClick={() => setUndoConfirm(false)}
                />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'rgba(255,255,255,0.97)', borderRadius: 14, padding: isMobile ? '10px 12px' : '14px 18px', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', minWidth: isMobile ? 160 : 200, zIndex: 50, direction: 'rtl' }}>
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

      {/* Mute — fixed bottom-right — fades out on pick */}
      {bgReady && (!finalPick || toolboxFading) && (
        <button
          style={{
            position: 'absolute', bottom: 14, right: 14, zIndex: 30,
            background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
            width: isMobile ? 32 : 36, height: isMobile ? 32 : 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            opacity: toolboxFading ? 0 : 0.75,
            transition: 'opacity 0.3s ease',
            pointerEvents: toolboxFading ? 'none' : undefined,
          }}
          onClick={onMuteToggle}
        >
          <span style={{ fontSize: isMobile ? 16 : 20 }}>{isMuted ? '🔇' : '🔊'}</span>
        </button>
      )}

      {/* Speech bubble with mission number label — fades out on pick */}
      {bgReady && (!finalPick || toolboxFading) && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: isMobile ? '52px 10px 0' : '56px 14px 0',
            display: 'flex', justifyContent: 'center', zIndex: 5,
            opacity: toolboxFading ? 0 : 1,
            transition: 'opacity 0.3s ease',
            pointerEvents: toolboxFading ? 'none' : undefined,
          }}
        >
          <div key={missionIndex} className={(isIdle ? 'idle-pulse ' : '') + 'bubble-enter'} style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', borderRadius: 20, padding: isMobile ? '9px 11px' : '12px 14px', maxWidth: 700, width: '100%' }}>
            <div style={{ textAlign: 'right', fontSize: '0.78rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4, fontFamily: 'var(--font-body)' }}>משימה {missionNo}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 8 : 10 }}>
              <img src={av.image} alt={av.name} style={{ height: isMobile ? 36 : 48, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <p style={{ color: '#1a1a2e', lineHeight: 1.45, fontSize: isMobile ? '0.87rem' : '1rem', margin: 0 }}>{mission.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbox — fades out on pick, then bg crossfades in */}
      {bgReady && (!finalPick || toolboxFading) && (
        <div
          key={'toolbox-' + missionIndex}
          style={{
            position: 'absolute',
            bottom: isMobile ? 52 : isSmallScreen ? 48 : 66,
            left: isMobile ? 16 : isSmallScreen ? 24 : 32,
            zIndex: 20,
            display: 'flex',
            gap: isMobile ? 8 : isSmallScreen ? 8 : 14,
            background: 'rgba(40,25,10,0.82)',
            borderRadius: 16,
            padding: isMobile ? '6px 8px' : isSmallScreen ? '6px 8px' : '10px 14px',
            backdropFilter: 'blur(6px)',
            border: '1.5px solid rgba(180,130,60,0.4)',
            opacity: toolboxFading ? 0 : 1,
            transition: 'opacity 0.3s ease',
            pointerEvents: toolboxFading ? 'none' : undefined,
          }}
        >
          <div className='tool-enter-a'>
            <ToolCard toolSrc={missionTool(missionNo, 'a')} tooltipText={mission.toolA.tooltipText} toolKey='a' isSelected={finalPick === 'a'} isDisabled={finalPick !== null} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={missionIndex} />
          </div>
          <div className='tool-enter-b'>
            <ToolCard toolSrc={missionTool(missionNo, 'b')} tooltipText={mission.toolB.tooltipText} toolKey='b' isSelected={finalPick === 'b'} isDisabled={finalPick !== null} isMobile={isMobile} toolSize={toolSize} onPick={handlePick} resetTooltip={missionIndex} />
          </div>
        </div>
      )}

    </div>
  );
}
