// ── Agent Client ──────────────────────────────────────────────────────────────
// sendToAgent      — POST /game/analyze → returns AgentRawResponse (Call 1)
// sendLeadToAgent  — POST /game/complete → fire-and-forget (Call 2)
// sendSessionEndBeacon / sendAbandonmentBeacon — sendBeacon / console fallback

import type { AgentRawResponse, GameState, HollandCode, LeadData, ShareEvent, ProgramClick } from '../types';
import { computeCounts } from './scoring';
import { config } from '../config';

// ── Payload builder ───────────────────────────────────────────────────────────
function buildGamePayload(state: GameState) {
  const deviceType = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
  const countsFirst = computeCounts(state.firstPicksByMissionId);
  const countsFinal = computeCounts(state.finalPicksByMissionId);

  const CODES: HollandCode[] = ['r', 'i', 'a', 's', 'e', 'c'];
  const resolved_scores: Record<HollandCode, number> = {} as Record<HollandCode, number>;
  for (const code of CODES) {
    const raw = countsFinal[code] ?? 0;
    if (code === state.rank1Code)      resolved_scores[code] = raw + 0.5;
    else if (code === state.rank2Code) resolved_scores[code] = raw + 0.3;
    else if (code === state.rank3Code) resolved_scores[code] = raw + 0.1;
    else                               resolved_scores[code] = raw;
  }

  const tieTriggerred = state.tieWinnerCode !== null;
  const tieWinner     = state.tieWinnerCode ?? undefined;
  const tieRank       = tieTriggerred ? (state.tieRank ?? undefined) : undefined;
  const tieLose       = tieTriggerred
    ? (state.tieRank === 1 ? state.rank2Code : state.rank3Code) ?? undefined
    : undefined;

  return {
    run_id: state.run_id,
    avatarGender: state.avatarGender,
    exhibitionChoice: state.exhibitionChoice,
    countsFirst,
    countsFinal,
    resolved_scores,
    rank1Code: state.rank1Code,
    rank2Code: state.rank2Code,
    rank3Code: state.rank3Code,
    firstPicksByMissionId: state.firstPicksByMissionId,
    finalPicksByMissionId: state.finalPicksByMissionId,
    undoEvents: state.undoEvents,
    tieTriggerred,
    tieWinner,
    tieLose,
    tieRank,
    missionShownAtById: Object.fromEntries(
      Object.entries(state.timestamps).map(([id, ts]) => [id, ts.shownAt])
    ),
    missionAnsweredAtById: Object.fromEntries(
      Object.entries(state.timestamps)
        .filter(([, ts]) => ts.answeredAt !== null)
        .map(([id, ts]) => [id, ts.answeredAt as number])
    ),
    utmParams: state.utmData ? {
      utmSource: state.utmData.utm_source ?? undefined,
      utmMedium: state.utmData.utm_medium ?? undefined,
      utmCampaign: state.utmData.utm_campaign ?? undefined,
      referrer: state.utmData.referrer,
    } : undefined,
    status: 'complete' as const,
    clientContext: {
      deviceType,
      screenW: window.screen.width,
      screenH: window.screen.height,
      locale: navigator.language,
    },
  };
}

// ── Call 1: analyze ───────────────────────────────────────────────────────────
export async function sendToAgent(state: GameState): Promise<AgentRawResponse> {
  const payload = buildGamePayload(state);

  const res = await fetch(`${config.agentEndpoint}/game/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-secret': config.agentSecret,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(config.agentTimeoutSeconds * 1000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Agent error ${res.status}`);
  }

  return res.json() as Promise<AgentRawResponse>;
}

// ── Call 2: complete (fire-and-forget) ────────────────────────────────────────
export async function sendLeadToAgent(leadData: LeadData, runId: string): Promise<{ success: true }> {
  const payload = {
    run_id: runId,
    fullName: leadData.fullName,
    email: leadData.email,
    phone: leadData.phone,
    wantsUpdates: leadData.acceptUpdates,
  };

  fetch(`${config.agentEndpoint}/game/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-secret': config.agentSecret,
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.warn('[GrowApp] sendLeadToAgent failed (non-blocking)', err);
  });

  return { success: true };
}

// ── Session-end beacon ────────────────────────────────────────────────────────
export interface SessionEndPayload {
  run_id: string;
  status: 'session_end';
  results_time_spent_ms: number;
  results_scrolled_to_bottom: boolean;
  programs_clicked: ProgramClick[];
  more_matches_clicked: boolean;
  share_events: ShareEvent[];
}

export function sendSessionEndBeacon(payload: SessionEndPayload): void {
  const fullPayload = { ...payload, system_version: config.system_version };
  if (config.agentEndpoint) {
    navigator.sendBeacon(
      config.agentEndpoint + '/session_end',
      new Blob([JSON.stringify(fullPayload)], { type: 'application/json' })
    );
  } else {
    console.log('[GrowApp] sessionEndBeacon (stub)', fullPayload);
  }
}

// ── Abandonment beacon ────────────────────────────────────────────────────────
export interface AbandonmentPayload {
  run_id: string;
  status: 'abandoned';
  abandonedAtScreen: string;
  abandonedAtMission: string | null;
  finalPicksByMissionId: GameState['finalPicksByMissionId'];
  missionShownAt: Record<string, number>;
  missionAnsweredAt: Record<string, number>;
  undoEvents: GameState['undoEvents'];
}

export function sendAbandonmentBeacon(payload: AbandonmentPayload): void {
  const fullPayload = { ...payload, system_version: config.system_version };
  if (config.agentEndpoint) {
    navigator.sendBeacon(
      config.agentEndpoint + '/abandoned',
      new Blob([JSON.stringify(fullPayload)], { type: 'application/json' })
    );
  } else {
    console.log('[GrowApp] abandonmentBeacon (stub)', fullPayload);
  }
}
