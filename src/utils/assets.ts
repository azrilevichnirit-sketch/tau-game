// ── Asset path helpers ───────────────────────────────────────────────────────
import type { AvatarGender } from '../types';

type Device = 'desktop' | 'mobile';

// Finding 18 — explicit comments explaining each exception
// BASE bg exceptions (desktop file named mission_N.webp, not mission_N_desk.webp):
//   1  → mission_1.webp
//   10 → mission_10.webp
//   13 → mission_13.webp
const BASE_NO_DESK = [1, 10, 13];

// AFTER-PICK bg exceptions (desktop file named mission_N_T.webp, not mission_N_T_desk.webp):
//   10 → mission_10_a/b.webp
//   11 → mission_11_a/b.webp  (shares mission-10 bg canvas)
//   13 → mission_13_a/b.webp
//   15 → mission_15_a/b.webp
const PICK_NO_DESK = [10, 11, 13, 15];

// AFTER-PICK mobile bg exceptions (file named mission_N_T.webp, not mission_N_T_mobile.webp):
//   3 → mission_3_a.webp / mission_3_b.webp
const MOBILE_PICK_NO_SUFFIX = [3];

// Mission base background (before tool pick)
export function missionBg(missionNo: number, device: Device): string {
  if (device === 'mobile') {
    return `/assets/mission/bg/mobile/mission_${missionNo}_mobile.webp`;
  }
  if (BASE_NO_DESK.includes(missionNo)) {
    return `/assets/mission/bg/desktop/mission_${missionNo}.webp`;
  }
  return `/assets/mission/bg/desktop/mission_${missionNo}_desk.webp`;
}

// Mission background after picking tool A or B
export function missionBgTool(
  missionNo: number,
  tool: 'a' | 'b',
  device: Device,
  gender?: AvatarGender,
): string {
  const suf = device === 'desktop' ? 'desk' : 'mobile';
  const dir = device === 'desktop' ? 'desktop' : 'mobile';

  // Gender-specific backgrounds
  const genderedKeys = ['4-b', '8-a', '8-b', '11-a'];
  const gk = `${missionNo}-${tool}`;
  if (genderedKeys.includes(gk) && gender) {
    const g = gender === 'female' ? 'f' : 'm';
    return `/assets/mission/bg/${dir}/mission_${missionNo}_${tool}_${g}_${suf}.webp`;
  }

  // Desktop missions that lack the _desk suffix on after-pick files
  if (device === 'desktop' && PICK_NO_DESK.includes(missionNo)) {
    return `/assets/mission/bg/desktop/mission_${missionNo}_${tool}.webp`;
  }

  // Mobile missions that lack the _mobile suffix on after-pick files
  if (device === 'mobile' && MOBILE_PICK_NO_SUFFIX.includes(missionNo)) {
    return `/assets/mission/bg/mobile/mission_${missionNo}_${tool}.webp`;
  }

  return `/assets/mission/bg/${dir}/mission_${missionNo}_${tool}_${suf}.webp`;
}

// Mission tool image
export function missionTool(missionNo: number, tool: 'a' | 'b'): string {
  const num = String(missionNo).padStart(2, '0');
  return `/assets/mission/tools/studio_${num}_${tool}.webp`;
}

// Mission 5A gif
export function mission5AGif(): string {
  return '/assets/mission/tools/studio_05_a_gif.gif';
}

// Tie mission background
export function tieBg(tieNo: number, device: Device): string {
  return `/assets/tie/bg/${device}/t${tieNo}_${device === 'desktop' ? 'desk' : 'mobile'}.webp`;
}

export function tieBgTool(tieNo: number, tool: 'a' | 'b', device: Device): string {
  return `/assets/tie/bg/${device}/t${tieNo}_${tool}_${device === 'desktop' ? 'desk' : 'mobile'}.webp`;
}

export function tieTool(tieNo: number, tool: 'a' | 'b'): string {
  return `/assets/tie/tools/t${tieNo}_tool_${tool}.webp`;
}
