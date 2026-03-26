// ── GrowApp Studio — Shared Types ───────────────────────────────────────────

export type Screen =
  | 'exhibition'
  | 'avatar'
  | 'welcome'
  | 'mission'
  | 'tie'
  | 'lead'
  | 'processing'
  | 'summary';

export type AvatarGender = 'female' | 'male';
export type HollandCode = 'r' | 'i' | 'a' | 's' | 'e' | 'c';
export type ToolKey = 'a' | 'b';

export interface ToolPick {
  key: ToolKey;
  hollandCode: HollandCode;
}

export interface Mission {
  id: string;           // m_1 … m_15
  text: string;
  toolA: { hollandCode: HollandCode; tooltipText: string };
  toolB: { hollandCode: HollandCode; tooltipText: string };
}

export interface TieMission {
  id: string;           // T1 … T15
  codes: string;        // e.g. "I-R"
  pairKey: string;      // sorted pair e.g. "i-r"
  text: string;
  toolA: { hollandCode: HollandCode; tooltipText: string };
  toolB: { hollandCode: HollandCode; tooltipText: string };
}

export interface UndoEvent {
  missionId: string;
  prevTrait: HollandCode;
  newTrait: HollandCode | null;       // updated when player re-picks after undo
  timestamp: number;                  // when undo was pressed
  timeToNextDecision: number | null;  // ms from undo press to final re-pick
}

export interface HollandCounts {
  r: number; i: number; a: number; s: number; e: number; c: number;
}

export interface GameState {
  screen: Screen;
  exhibitionChoice: string | null;
  avatarGender: AvatarGender | null;
  currentMissionIndex: number;        // 0-based index into missions array
  currentTieId: string | null;
  firstPicksByMissionId: Record<string, ToolPick>;
  finalPicksByMissionId: Record<string, ToolPick>;
  undoEvents: UndoEvent[];
  timestamps: Record<string, { shownAt: number; answeredAt: number | null }>;
  lastBgDesktop: string | null;       // for processing screen background
  lastBgMobile: string | null;
  run_id: string;                     // UUID generated at game start, sent in both payloads
  tieWinnerCode: HollandCode | null;  // winner code from tie-breaker mission (legacy)
  tieRank: 1 | 2 | null;             // which rank the current tie mission is resolving
  rank1Code: HollandCode | null;      // determined Rank 1 Holland code
  rank2Code: HollandCode | null;      // determined Rank 2 Holland code
  rank3Code: HollandCode | null;      // determined Rank 3 Holland code (always mathematical)
  utmData: UtmData | null;
  agentResponse: AgentResponse | null;
  leadData: LeadData | null;
}

export interface LeadData {
  fullName: string;
  email: string;
  phone: string;
  acceptUpdates: boolean;
}

export interface PixelConfig {
  type: 'facebook' | 'tiktok' | 'google' | 'custom';
  pixelId: string;
  enabled: boolean;
}

export interface UtmData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string;
}

// Raw envelope returned by the agent HTTP endpoint
export interface AgentRawResponse {
  run_id: string;           // must match the run_id sent in the payload
  result: AgentResponse | null; // null or missing = agent returned empty content
}

// ── Tracking types ───────────────────────────────────────────────────────────
export interface ShareEvent {
  platform: string;   // 'whatsapp' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok' | 'email' | 'copy'
  timestamp: number;  // Date.now()
}

export interface ProgramClick {
  programId: string;  // accordion title used as id
  position: number;   // 0-based index in the list
  timestamp: number;
}

// Agent response shape (stub — will be finalized with Agent Spec)
export interface AgentResponse {
  pageTitle: string;                      // כותרת ראשית דינמית (למשל "Mojo Unlocked: המנועים שמובילים אותך")
  enginesText: string;                    // טקסט מנועים
  programsTitle: string;                  // כותרת תוכניות
  programsMarkdown: string;               // markdown עם **שם** ואחריו פסקה
  extraProgramsMarkdown: string | null;   // null = no "show more" button; string = show button + content
}
