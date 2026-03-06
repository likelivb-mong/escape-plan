import type { PuzzleFlowPlan, PuzzleFlowStage, PuzzleFlowStageKey } from '../types/puzzleFlow';
import type { StoryProposal } from '../types/story';
import type { MandalartCellData } from '../types/mandalart';
import { STAGE_TITLES, OBJECTIVES, EFFECTS_POOL } from '../data/mockPuzzleFlow';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePlaytime(playtime: string): number {
  const m = playtime.match(/\d+/);
  return m ? parseInt(m[0], 10) : 60;
}

/** Total puzzle count recommendation by playtime */
function calcTotalPuzzles(minutes: number): number {
  if (minutes >= 90) return 16;
  if (minutes >= 80) return 14;
  if (minutes >= 70) return 13;
  return 11; // 60분
}

type FiveTuple = [number, number, number, number, number];

/**
 * Distribute total time across 5 stages.
 * 기 13% / 승 25% / 전 25% / 반전 20% / 결 17%
 */
function distributeTime(total: number): FiveTuple {
  const ratios: FiveTuple = [0.13, 0.25, 0.25, 0.20, 0.17];
  const raw = ratios.map((r) => Math.round(total * r)) as FiveTuple;
  // Correct rounding drift on 승 (index 1)
  const drift = total - (raw[0] + raw[1] + raw[2] + raw[3] + raw[4]);
  raw[1] += drift;
  return raw;
}

/**
 * Distribute puzzle slots across 5 stages.
 * Base: 기1 / 승3 / 전3 / 반전2 / 결1 = 10
 * Remaining slots go to 승 → 전 → 반전 in rotation.
 */
function distributePuzzles(total: number): FiveTuple {
  const dist: FiveTuple = [1, 3, 3, 2, 1];
  let remaining = total - 10;
  const spillover = [1, 2, 3]; // indices for 승, 전, 반전
  let si = 0;
  while (remaining > 0) {
    dist[spillover[si % spillover.length]]++;
    si++;
    remaining--;
  }
  return dist;
}

// Stage configuration: ordered 기→승→전→반전→결
const STAGE_CONFIGS: Array<{
  key: PuzzleFlowStageKey;
  label: '기' | '승' | '전' | '반전' | '결';
}> = [
  { key: 'intro',       label: '기' },
  { key: 'development', label: '승' },
  { key: 'expansion',   label: '전' },
  { key: 'twist',       label: '반전' },
  { key: 'ending',      label: '결' },
];

/** Pick up to `n` items from `arr`, offset by `offset` (for variant rotation). */
function pick<T>(arr: T[], n: number, offset = 0): T[] {
  if (arr.length === 0) return [];
  return Array.from({ length: Math.min(n, arr.length) }, (_, i) => arr[(i + offset) % arr.length]);
}

/** Assign relevant mandalart keywords to each stage by theme affinity. */
function pickKeywordsForStage(
  key: PuzzleFlowStageKey,
  cells: MandalartCellData[],
  offset = 0,
): string[] {
  const filled = cells.filter((c) => !c.isCenter && c.text.trim());
  const rose  = filled.filter((c) => c.theme === 'rose').map((c) => c.text.trim());
  const sky   = filled.filter((c) => c.theme === 'sky').map((c) => c.text.trim());
  const amber = filled.filter((c) => c.theme === 'amber').map((c) => c.text.trim());
  const other = filled.filter((c) => !c.theme).map((c) => c.text.trim());

  // Rotate picks by offset to vary them on regenerate
  switch (key) {
    case 'intro':       return [...pick(other, 2, offset), ...pick(amber, 1, offset)];
    case 'development': return [...pick(sky,   2, offset), ...pick(amber, 2, offset)];
    case 'expansion':   return [...pick(sky,   1, offset), ...pick(rose,  1, offset), ...pick(other, 1, offset)];
    case 'twist':       return [...pick(rose,  3, offset)];
    case 'ending':      return [...pick(amber, 2, offset), ...pick(rose,  1, offset)];
    default:            return pick(other, 3, offset);
  }
}

// ── Main generator ────────────────────────────────────────────────────────────

/**
 * Generate a PuzzleFlowPlan from a StoryProposal and MandalartCells.
 *
 * `variant` cycles between 0 and 1 to produce slightly different wording
 * without needing a real API call.
 *
 * TODO: Replace with real API call —
 *   const plan = await fetch('/api/puzzle-flow', {
 *     method: 'POST',
 *     body: JSON.stringify({ story, cells, variant }),
 *   }).then(r => r.json());
 */
export function generatePuzzleFlowFromStory(
  story: StoryProposal,
  cells: MandalartCellData[],
  variant = 0,
): PuzzleFlowPlan {
  const totalMinutes = parsePlaytime(story.meta.playtime);
  const totalPuzzles = calcTotalPuzzles(totalMinutes);
  const timeDist     = distributeTime(totalMinutes);
  const puzzleDist   = distributePuzzles(totalPuzzles);
  const v = variant % 2;

  const stages: PuzzleFlowStage[] = STAGE_CONFIGS.map((cfg, i) => {
    const beat = story.beats.find((b) => b.label === cfg.label);
    return {
      id: `stage-${cfg.key}`,
      key: cfg.key,
      label: cfg.label,
      title: STAGE_TITLES[cfg.key][v],
      description: beat?.description ?? `${cfg.label} 단계 — 플레이어가 핵심 단서를 발견하고 다음 단계로 진입한다.`,
      estimatedMinutes: timeDist[i],
      objective: OBJECTIVES[cfg.key][v],
      suggestedPuzzleSlots: puzzleDist[i],
      effectsNotes: EFFECTS_POOL[cfg.key][v],
      relatedKeywords: pickKeywordsForStage(cfg.key, cells, variant),
    };
  });

  return {
    storyId: story.id,
    totalPlayTime: totalMinutes,
    totalSuggestedPuzzleCount: totalPuzzles,
    stages,
  };
}

/**
 * Regenerate the flow with the next variant (simulates a real API round-trip).
 *
 * TODO: Replace with real API call targeting flow regeneration.
 */
export async function regeneratePuzzleFlow(
  story: StoryProposal,
  cells: MandalartCellData[],
  currentVariant: number,
): Promise<PuzzleFlowPlan> {
  await new Promise((res) => setTimeout(res, 900 + Math.random() * 500));
  return generatePuzzleFlowFromStory(story, cells, currentVariant + 1);
}
