// ── Tie-Breaker Logic ────────────────────────────────────────────────────────
// סעיף 4 במפרט

import type { HollandCode, HollandCounts } from '../types';
import { TIE_MISSIONS } from '../data/tieMissions';
import type { TieMission } from '../types';

// RIASEC hexagon neighbors
const NEIGHBORS: Record<HollandCode, [HollandCode, HollandCode]> = {
  r: ['i', 'c'],
  i: ['r', 'a'],
  a: ['i', 's'],
  s: ['a', 'e'],
  e: ['s', 'c'],
  c: ['e', 'r'],
};

function hexNeighborSum(code: HollandCode, counts: HollandCounts): number {
  return NEIGHBORS[code].reduce((sum, n) => sum + counts[n], 0);
}

// Default tiebreak order when neighbor sums are equal (section 4.3)
const DEFAULT_ORDER: HollandCode[] = ['r', 'i', 'a', 's', 'e', 'c'];

// Reduce candidates to exactly 2 via neighbor sums (Step 2.5)
export function reduceToTwo(candidates: HollandCode[], counts: HollandCounts): [HollandCode, HollandCode] {
  if (candidates.length < 2) {
    const fallback = DEFAULT_ORDER.filter(c => !candidates.includes(c));
    return [candidates[0] ?? fallback[0], candidates[1] ?? fallback[1]];
  }
  const scored = candidates.map((c) => ({
    code: c,
    neighborSum: hexNeighborSum(c, counts),
  }));
  scored.sort((a, b) => {
    if (b.neighborSum !== a.neighborSum) return b.neighborSum - a.neighborSum;
    return DEFAULT_ORDER.indexOf(a.code) - DEFAULT_ORDER.indexOf(b.code);
  });
  return [scored[0].code, scored[1].code];
}

// Build pair key from two codes (sorted alphabetically)
function pairKey(a: HollandCode, b: HollandCode): string {
  return [a, b].sort().join('-');
}

export interface TieResult {
  rank: 1 | 2 | 3;
  tieMission: TieMission | null;  // null means resolved mathematically (rank3)
  winnerCode: HollandCode | null; // set when resolved without mission
}

export function resolveTies(counts: HollandCounts): TieResult[] {
  const ranked = Object.entries(counts)
    .map(([code, count]) => ({ code: code as HollandCode, count }))
    .sort((a, b) => b.count - a.count);

  const results: TieResult[] = [];
  // We process ties at each rank position
  // Build groups of equal counts
  const groups: { code: HollandCode; count: number }[][] = [];
  let i = 0;
  while (i < ranked.length) {
    const group = [ranked[i]];
    let j = i + 1;
    while (j < ranked.length && ranked[j].count === ranked[i].count) {
      group.push(ranked[j]);
      j++;
    }
    groups.push(group);
    i = j;
  }

  // Check rank1 tie
  if (groups[0].length >= 2) {
    const candidates = groups[0].map((g) => g.code);
    const [c1, c2] = candidates.length === 2 ? [candidates[0], candidates[1]] : reduceToTwo(candidates, counts);
    const mission = TIE_MISSIONS.find((m) => m.pairKey === pairKey(c1, c2)) ?? null;
    results.push({ rank: 1, tieMission: mission, winnerCode: null });
  }

  return results;
}

// Resolve Rank 3 mathematically — no mission, always deterministic (Step 4)
// Picks highest-count code among the 4 remaining (excluding rank1 and rank2).
// Tiebreak: neighbor sum → DEFAULT_ORDER (R > I > A > S > E > C)
export function resolveRank3(
  rank1Code: HollandCode,
  rank2Code: HollandCode,
  counts: HollandCounts,
): HollandCode {
  const remaining = (Object.keys(counts) as HollandCode[])
    .filter(c => c !== rank1Code && c !== rank2Code);
  const topCount = Math.max(...remaining.map(c => counts[c]));
  const tied = remaining.filter(c => counts[c] === topCount);
  if (tied.length === 1) return tied[0];
  const scored = tied.map(c => ({ code: c, ns: hexNeighborSum(c, counts) }));
  scored.sort((a, b) =>
    b.ns !== a.ns ? b.ns - a.ns : DEFAULT_ORDER.indexOf(a.code) - DEFAULT_ORDER.indexOf(b.code)
  );
  return scored[0].code;
}

// Given a pair of competing Holland codes, find the tie mission
export function findTieMission(codeA: HollandCode, codeB: HollandCode): TieMission | null {
  const key = pairKey(codeA, codeB);
  return TIE_MISSIONS.find((m) => m.pairKey === key) ?? null;
}

// After tie mission is answered, return winner code based on toolKey
export function resolveTieWinner(
  mission: TieMission,
  chosenKey: 'a' | 'b',
): HollandCode {
  return chosenKey === 'a' ? mission.toolA.hollandCode : mission.toolB.hollandCode;
}
