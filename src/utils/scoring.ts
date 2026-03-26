// ── Holland Code Scoring ─────────────────────────────────────────────────────
// סעיף 3 במפרט

import type { HollandCode, HollandCounts, ToolPick } from '../types';

export function computeCounts(finalPicks: Record<string, ToolPick>): HollandCounts {
  const counts: HollandCounts = { r: 0, i: 0, a: 0, s: 0, e: 0, c: 0 };
  for (const pick of Object.values(finalPicks)) {
    counts[pick.hollandCode]++;
  }
  return counts;
}

// Returns rank-sorted list: [{ code, count }]
export function rankCodes(counts: HollandCounts) {
  return (Object.entries(counts) as [HollandCode, number][])
    .sort(([, a], [, b]) => b - a);
}
