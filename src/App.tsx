// App.tsx - Main state machine and routing
import { useState, useEffect, useRef } from "react";
import type { GameState, ToolKey, LeadData, HollandCode, UndoEvent } from "./types";
import { MISSIONS } from "./data/missions";
import { TIE_MISSIONS } from "./data/tieMissions";
import { computeCounts, rankCodes } from "./utils/scoring";
import { findTieMission, reduceToTwo, resolveRank3, resolveTieWinner } from "./utils/tieBreaker";
import { sendToAgent, sendLeadToAgent, sendAbandonmentBeacon } from "./utils/agent";
import { firePixelEvent } from "./utils/pixels";
import { missionBg, tieBgTool } from "./utils/assets";
import { config } from "./config";
import ExhibitionScreen from "./screens/ExhibitionScreen";
import AvatarScreen from "./screens/AvatarScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import MissionScreen from "./screens/MissionScreen";
import TieScreen from "./screens/TieScreen";
import LeadFormScreen from "./screens/LeadFormScreen";
import ProcessingScreen from "./screens/ProcessingScreen";
import SummaryScreen from "./screens/SummaryScreen";

// Fix 4 — module-level audio singletons: survive Vite HMR, never duplicated
const _bgAudio = new Audio("/assets/audio/bg-music.mp3");
_bgAudio.loop = true; _bgAudio.volume = 0.4;
const _finAudio = new Audio("/assets/audio/final.mp3");
_finAudio.loop = true; _finAudio.volume = 0.4;

const INITIAL_BASE = { screen: "exhibition" as const, run_id: crypto.randomUUID(), exhibitionChoice: null, avatarGender: null, currentMissionIndex: 0, currentTieId: null, tieRank: null as (1|2|null), firstPicksByMissionId: {}, finalPicksByMissionId: {}, undoEvents: [], timestamps: {}, lastBgDesktop: null, lastBgMobile: null, tieWinnerCode: null, rank1Code: null as (import("./types").HollandCode|null), rank2Code: null as (import("./types").HollandCode|null), rank3Code: null as (import("./types").HollandCode|null), utmData: null, agentResponse: null, leadData: null };

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const p = new URLSearchParams(window.location.search);
    return { ...INITIAL_BASE, utmData: { utm_source: p.get('utm_source'), utm_medium: p.get('utm_medium'), utm_campaign: p.get('utm_campaign'), referrer: document.referrer } };
  });
  const [isMuted, setIsMuted] = useState(false);
  // Fix 4 — refs point to module-level singletons, no useEffect creation needed
  const bgRef = useRef(_bgAudio);
  const finRef = useRef(_finAudio);
  const agentCache = useRef<import("./types").AgentResponse|null>(null);
  const agentCalled = useRef(false);
  const processingEnteredAtRef = useRef<number>(0);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentHint, setAgentHint] = useState(false);
  const agentHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentGenRef = useRef(0);

  // ── stateRef: always holds latest state for event handlers (avoids stale closures) ──
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── Abandonment beacon: fires on page close/refresh ONLY before reaching the lead form ──
  useEffect(() => {
    const COMPLETE_SCREENS = new Set(['lead', 'processing', 'summary']);
    function onBeforeUnload() {
      const s = stateRef.current;
      if (COMPLETE_SCREENS.has(s.screen)) return; // user completed the funnel — no abandonment event
      sendAbandonmentBeacon({
        run_id: s.run_id,
        status: 'abandoned',
        abandonedAtScreen: s.screen,
        abandonedAtMission:
          s.screen === 'mission' ? (MISSIONS[s.currentMissionIndex]?.id ?? null)
          : s.screen === 'tie'   ? s.currentTieId
          : null,
        finalPicksByMissionId: s.finalPicksByMissionId,
        missionShownAt: Object.fromEntries(
          Object.entries(s.timestamps).map(([id, ts]) => [id, ts.shownAt])
        ),
        missionAnsweredAt: Object.fromEntries(
          Object.entries(s.timestamps)
            .filter(([, ts]) => ts.answeredAt !== null)
            .map(([id, ts]) => [id, ts.answeredAt as number])
        ),
        undoEvents: s.undoEvents,
      });
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []); // empty deps — always uses stateRef

  // Pause music when tab/window is hidden, resume when visible again
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        bgRef.current.pause();
        finRef.current.pause();
      } else {
        // Only resume whichever was actually playing (non-paused before hide)
        if (!bgRef.current.ended && bgRef.current.currentTime > 0) bgRef.current.play().catch(()=>{});
        if (!finRef.current.ended && finRef.current.currentTime > 0) finRef.current.play().catch(()=>{});
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Fix 3 — mute: set .muted on both audio singletons
  function mute() { setIsMuted(p => { const n=!p; bgRef.current.muted=n; finRef.current.muted=n; return n; }); }
  function startBg() { bgRef.current.play().catch(()=>{}); }
  function switchFinal() {
    // Stop bg music completely — reset playhead so visibility-change never resumes it
    bgRef.current.pause();
    bgRef.current.currentTime = 0;
    bgRef.current.volume = 0;
    finRef.current.play().catch(()=>{});
  }

  // ── callAgent: guarded agent call, two-phase timeout, generation counter ──────
  function callAgent(currentState: GameState) {
    // Guard — block call if any rank is null
    if (!currentState.rank1Code || !currentState.rank2Code || !currentState.rank3Code) {
      setAgentError('שגיאה פנימית: נתוני דירוג חסרים. אנא התחל מחדש.');
      return;
    }
    agentCalled.current = true;
    const gen = ++agentGenRef.current;

    // Clear any existing timers from a previous call
    if (agentHintTimerRef.current) { clearTimeout(agentHintTimerRef.current); agentHintTimerRef.current = null; }
    if (agentTimeoutRef.current)   { clearTimeout(agentTimeoutRef.current);   agentTimeoutRef.current = null; }

    // Phase 1 — after 30s: show hint, keep call running
    agentHintTimerRef.current = setTimeout(() => setAgentHint(true), 30000);

    // Phase 2 — after agentTimeoutSeconds: show error screen
    agentTimeoutRef.current = setTimeout(() => {
      setAgentError('הניתוח לוקח יותר מדי זמן. ניתן לנסות שוב.');
    }, config.agentTimeoutSeconds * 1000);

    sendToAgent(currentState)
      .then(r => {
        if (gen !== agentGenRef.current) return; // stale call — ignore
        if (agentHintTimerRef.current) { clearTimeout(agentHintTimerRef.current); agentHintTimerRef.current = null; }
        if (agentTimeoutRef.current)   { clearTimeout(agentTimeoutRef.current);   agentTimeoutRef.current = null; }
        // run_id mismatch — response belongs to a different session, discard silently
        if (r.run_id !== currentState.run_id) return;
        // empty result — agent returned nothing useful, show error immediately
        if (!r.result || !r.result.enginesText) {
          setAgentError('הסוכן לא החזיר ניתוח. ניתן לנסות שוב.');
          return;
        }
        agentCache.current = r.result;
        setState(s => ({...s, agentResponse: r.result}));
        setAgentHint(false);
        setAgentError(null);
      })
      .catch(() => {
        if (gen !== agentGenRef.current) return;
        if (agentHintTimerRef.current) { clearTimeout(agentHintTimerRef.current); agentHintTimerRef.current = null; }
        if (agentTimeoutRef.current)   { clearTimeout(agentTimeoutRef.current);   agentTimeoutRef.current = null; }
        setAgentError('אירעה שגיאה בניתוח הפרופיל שלך. ניתן לנסות שוב.');
      });
  }

  // Retry — reset both hint+error, reset both timers, re-call agent
  function retryAgent() {
    agentCalled.current = false;
    setAgentHint(false);
    setAgentError(null);
    callAgent(state);
  }

  // Spec 5.1: send to agent + switch music + fire pixels on entering lead form
  useEffect(() => {
    if (state.screen === "lead") {
      switchFinal();
      firePixelEvent(config.pixels, 'Lead');
      if (!agentCalled.current) callAgent(state);
    } else if (state.screen === "summary") {
      // Belt-and-suspenders: ensure bg track is fully stopped on summary
      bgRef.current.pause();
      bgRef.current.currentTime = 0;
      bgRef.current.volume = 0;
    } else if (state.screen === "exhibition") {
      agentCalled.current = false;
      agentCache.current = null;
      agentGenRef.current++; // invalidate any in-flight call
      setAgentHint(false);
      setAgentError(null);
      if (agentHintTimerRef.current) { clearTimeout(agentHintTimerRef.current); agentHintTimerRef.current = null; }
      if (agentTimeoutRef.current)   { clearTimeout(agentTimeoutRef.current);   agentTimeoutRef.current = null; }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen]);

  // Advance from processing to summary — minimum 2.5s display, then as soon as agent responds
  useEffect(() => {
    if (state.screen !== "processing" || !state.agentResponse) return;
    const elapsed = Date.now() - processingEnteredAtRef.current;
    const delay = Math.max(0, 2500 - elapsed);
    const timer = setTimeout(() => {
      setState(s => ({...s, screen: "summary"}));
    }, delay);
    return () => clearTimeout(timer);
  }, [state.agentResponse, state.screen]);

  function pick(key: ToolKey, bgD: string, bgM: string) {
    setState(s => {
      const m = MISSIONS[s.currentMissionIndex];
      const hc = key === "a" ? m.toolA.hollandCode : m.toolB.hollandCode;
      const now = Date.now();
      const p = {key,hollandCode:hc};
      const fp = {...s.firstPicksByMissionId}; if(!fp[m.id]) fp[m.id]=p;
      const fin = {...s.finalPicksByMissionId,[m.id]:p};
      const ts = {...s.timestamps,[m.id]:{...s.timestamps[m.id],answeredAt:now}};
      // If this pick follows an undo on the same mission, fill in newTrait + timeToNextDecision
      const updatedUndoEvents = s.undoEvents.map(ev =>
        ev.missionId === m.id && ev.newTrait === null
          ? {...ev, newTrait: hc, timeToNextDecision: now - ev.timestamp}
          : ev
      );
      return {...s,firstPicksByMissionId:fp,finalPicksByMissionId:fin,timestamps:ts,lastBgDesktop:bgD,lastBgMobile:bgM,undoEvents:updatedUndoEvents};
    });

    // Preload next background immediately (before timeout) to avoid flash on transition
    const isLastMission = state.currentMissionIndex + 1 >= MISSIONS.length;
    const isMob = window.innerWidth < 768;
    if (!isLastMission) {
      const nextNo = state.currentMissionIndex + 2; // 1-indexed
      const preloadUrl = missionBg(nextNo, isMob ? 'mobile' : 'desktop');
      new window.Image().src = preloadUrl;
    } else {
      // Last mission — preload lead form background so it's cached on arrival
      new window.Image().src = isMob ? '/assets/form/bg_form_mobile.webp' : '/assets/form/bg_form_desktop.webp';
    }

    // Check if this is the last mission
    if (isLastMission) {
      setTimeout(() => { setState(s => {      // switch at 800ms
        const counts = computeCounts(s.finalPicksByMissionId);
        const sorted = rankCodes(counts);
        const topCount = sorted[0][1];
        const rank1Cands = sorted.filter(([,v])=>v===topCount).map(([k])=>k) as HollandCode[];

        // ── Rank 1 tie? ──────────────────────────────────────────────────────
        if (rank1Cands.length >= 2) {
          const [cA,cB] = rank1Cands.length===2 ? [rank1Cands[0],rank1Cands[1]] : reduceToTwo(rank1Cands,counts);
          const tie = findTieMission(cA,cB);
          if (tie) return {...s,screen:"tie",currentTieId:tie.id,tieRank:1,rank1Code:null,rank2Code:null,rank3Code:null};
          // fallback: no tie mission found → mathematical
          return {...s,screen:"lead",rank1Code:cA,rank2Code:cB,rank3Code:resolveRank3(cA,cB,counts)};
        }

        // ── Rank 1 clear — check Rank 2 ──────────────────────────────────────
        const rank1Code = rank1Cands[0];
        const rem = (Object.entries(counts) as [HollandCode,number][]).filter(([k])=>k!==rank1Code).sort(([,a],[,b])=>b-a);
        const rank2Count = rem[0]?.[1] ?? 0;
        const rank2Cands = rem.filter(([,v])=>v===rank2Count).map(([k])=>k) as HollandCode[];

        if (rank2Cands.length === 1) {
          const rank2Code = rank2Cands[0];
          return {...s,screen:"lead",rank1Code,rank2Code,rank3Code:resolveRank3(rank1Code,rank2Code,counts)};
        }

        // ── Rank 2 tie? ───────────────────────────────────────────────────────
        const [cA,cB] = rank2Cands.length===2 ? [rank2Cands[0],rank2Cands[1]] : reduceToTwo(rank2Cands,counts);
        const tie2 = findTieMission(cA,cB);
        if (tie2) return {...s,screen:"tie",currentTieId:tie2.id,tieRank:2,rank1Code,rank2Code:null,rank3Code:null};
        // fallback
        return {...s,screen:"lead",rank1Code,rank2Code:cA,rank3Code:resolveRank3(rank1Code,cA,counts)};
      }); }, 800); // same delay as regular missions so after-pick bg is visible
    } else {
      setTimeout(() => setState(s => {
        const ni = s.currentMissionIndex+1; // switch at 800ms
        const nm = MISSIONS[ni];
        return {...s,screen:"mission",currentMissionIndex:ni,timestamps:{...s.timestamps,[nm.id]:{shownAt:Date.now(),answeredAt:null}}};
      }), 800);
    }
  }

  function undo() {
    setState(s => {
      if (s.currentMissionIndex < 1) return s;
      const pi = s.currentMissionIndex-1;
      const pm = MISSIONS[pi];
      const pp = s.finalPicksByMissionId[pm.id];
      const nf = {...s.finalPicksByMissionId}; delete nf[pm.id];
      const ev: UndoEvent = {missionId:pm.id,prevTrait:pp?.hollandCode??"r",newTrait:null,timestamp:Date.now(),timeToNextDecision:null};
      return {...s,screen:"mission",currentMissionIndex:pi,finalPicksByMissionId:nf,undoEvents:[...s.undoEvents,ev]};
    });
  }

  function lead(data: LeadData) {
    // Stamp entry time BEFORE setState so minimum-display check is accurate
    processingEnteredAtRef.current = Date.now();
    sendLeadToAgent(data, stateRef.current.run_id).catch(console.error);
    setState(s => ({...s, leadData: data, screen: "processing"}));
  }

  const s=state, mob=window.innerWidth<768;
  if(s.screen==="exhibition") return <ExhibitionScreen onSelect={id=>{setState(ss=>({...ss,exhibitionChoice:id,screen:"avatar"}));startBg();}} />;
  if(s.screen==="avatar") return <AvatarScreen onSelect={g=>setState(ss=>({...ss,avatarGender:g,screen:"welcome"}))} isMuted={isMuted} onMuteToggle={mute} />;
  if(s.screen==="welcome"&&s.avatarGender) return <WelcomeScreen gender={s.avatarGender} onStart={()=>{ const m=MISSIONS[0]; setState(ss=>({...ss,screen:"mission",currentMissionIndex:0,timestamps:{...ss.timestamps,[m.id]:{shownAt:Date.now(),answeredAt:null}}})); }} isMuted={isMuted} onMuteToggle={mute} />;
  if(s.screen==="mission"&&s.avatarGender!==null) {
    const m=MISSIONS[s.currentMissionIndex], fp=s.finalPicksByMissionId[m.id]?.key??null;
    return <MissionScreen mission={m} missionIndex={s.currentMissionIndex} totalMissions={MISSIONS.length} completedCount={Object.keys(s.finalPicksByMissionId).length} gender={s.avatarGender} finalPick={fp} lastBg={mob?(s.lastBgMobile??undefined):(s.lastBgDesktop??undefined)} isMuted={isMuted} canUndo={true} onPick={pick} onUndo={undo} onMuteToggle={mute} />;
  }
  if(s.screen==="tie"&&s.currentTieId&&s.avatarGender) {
    const tm=TIE_MISSIONS.find(t=>t.id===s.currentTieId);
    const tn=parseInt((s.currentTieId??"").replace("T",""),10);
    // Fix 1 — store tie-breaker winner code in state
    if(tm) return <TieScreen tieMission={tm} tieNo={tn} gender={s.avatarGender} isMuted={isMuted} lastBg={mob?(s.lastBgMobile??undefined):(s.lastBgDesktop??undefined)}
      onUndo={() => {
        // Return to mission 15 (index 14), clear its final pick so it can be re-answered
        setState(ss => {
          const lastMission = MISSIONS[14];
          const nf = {...ss.finalPicksByMissionId};
          delete nf[lastMission.id];
          return {
            ...ss, screen:"mission", currentMissionIndex:14,
            currentTieId:null, tieRank:null,
            rank1Code:null, rank2Code:null, rank3Code:null,
            finalPicksByMissionId: nf,
          };
        });
      }}
      onPick={(key: ToolKey) => {
        // Preload lead form bg immediately so it's cached when we arrive
        const isMobTie = window.innerWidth < 768;
        new window.Image().src = isMobTie ? '/assets/form/bg_form_mobile.webp' : '/assets/form/bg_form_desktop.webp';
        // Capture tie after-pick bg — passed as lastBg to LeadFormScreen for smooth crossfade
        const tieBgD = tieBgTool(tn, key, 'desktop');
        const tieBgM = tieBgTool(tn, key, 'mobile');
        const winner = resolveTieWinner(tm, key);
        const loser: HollandCode = key === 'a' ? tm.toolB.hollandCode : tm.toolA.hollandCode;
        setTimeout(() => setState(ss => {
          const counts = computeCounts(ss.finalPicksByMissionId);
          if (ss.tieRank === 1) {
            // Rank 1 resolved: winner=Rank1, loser=Rank2 auto, Rank3 mathematical
            return {...ss, screen:"lead", lastBgDesktop:tieBgD, lastBgMobile:tieBgM, tieWinnerCode:winner, rank1Code:winner, rank2Code:loser, rank3Code:resolveRank3(winner,loser,counts)};
          } else {
            // Rank 2 resolved: winner=Rank2, Rank3 ALWAYS mathematical — never the tie-loser
            const rank3 = ss.rank1Code ? resolveRank3(ss.rank1Code, winner, counts) : winner;
            return {...ss, screen:"lead", lastBgDesktop:tieBgD, lastBgMobile:tieBgM, tieWinnerCode:winner, rank2Code:winner, rank3Code:rank3};
          }
        }), 800);
      }}
      onMuteToggle={mute} />;
  }
  // Fix 3 — pass isMuted + onMuteToggle to LeadFormScreen
  if(s.screen==="lead") return <LeadFormScreen onSubmit={lead} lastBg={mob?(s.lastBgMobile??undefined):(s.lastBgDesktop??undefined)} isMuted={isMuted} onMuteToggle={mute} />;
  if(s.screen==="processing") {
    // Fix 3 — show friendly error screen if agent timed out or errored
    if (agentError) {
      const errBg = mob ? '/assets/form/bg_form_mobile.webp' : '/assets/form/bg_form_desktop.webp';
      return (
        <div style={{ height:'100vh', overflow:'hidden', backgroundImage:`url(${errBg})`, backgroundSize:'cover', backgroundPosition:'center', display:'flex', alignItems:'center', justifyContent:'center', direction:'rtl', fontFamily:'var(--font-body)' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }} />
          <div style={{ position:'relative', zIndex:1, background:'rgba(255,255,255,0.97)', borderRadius:20, padding: mob ? '28px 20px' : '36px 32px', maxWidth:380, width:'calc(100% - 40px)', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:'2.8rem', marginBottom:12 }}>⏱️</div>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.25rem', color:'#1a1a2e', marginBottom:10, fontWeight:700 }}>הניתוח לוקח קצת יותר זמן</h2>
            <p style={{ color:'#555', marginBottom:24, lineHeight:1.6, fontSize:'0.95rem' }}>{agentError}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <button onClick={retryAgent} style={{ background:'#4a90c4', color:'white', border:'none', borderRadius:12, padding:'13px 24px', fontSize:'1rem', fontFamily:'var(--font-body)', cursor:'pointer', fontWeight:700 }}>
                נסה שוב
              </button>
              <button onClick={() => { agentGenRef.current++; if(agentHintTimerRef.current) clearTimeout(agentHintTimerRef.current); agentHintTimerRef.current=null; if(agentTimeoutRef.current) clearTimeout(agentTimeoutRef.current); agentTimeoutRef.current=null; setState({...INITIAL_BASE, utmData:state.utmData}); setAgentHint(false); setAgentError(null); agentCalled.current=false; agentCache.current=null; }} style={{ background:'transparent', color:'#4a90c4', border:'2px solid #4a90c4', borderRadius:12, padding:'11px 24px', fontSize:'1rem', fontFamily:'var(--font-body)', cursor:'pointer' }}>
                התחל מחדש
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <ProcessingScreen lastBg={mob?(s.lastBgMobile??undefined):(s.lastBgDesktop??undefined)} showHint={agentHint} />;
  }
  if(s.screen==="summary"&&s.agentResponse&&s.leadData) return <SummaryScreen agentResponse={s.agentResponse} firstName={(s.leadData.fullName??'').trim().split(' ').filter(Boolean)[0]??''} runId={s.run_id} isMuted={isMuted} onMuteToggle={mute} />;
  return <ExhibitionScreen onSelect={id=>{setState(ss=>({...ss,exhibitionChoice:id,screen:"avatar"}));}} />;
}
