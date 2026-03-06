// TODO: Replace mock generator with real AI API calls.
// All functions follow the same async pattern so the swap is a one-liner.

import { PUZZLE_POOL } from '../data/mockPuzzleRecommendations';
import type {
  PuzzleRecommendation,
  PuzzleRecommendationGroup,
  RecommendationStats,
  PuzzleType,
} from '../types/puzzleRecommendation';
import type { PuzzleFlowPlan, PuzzleFlowStage, PuzzleFlowStageKey } from '../types/puzzleFlow';
import type { MandalartCellData } from '../types/mandalart';

// ── Stage label map ───────────────────────────────────────────────────────────

const STAGE_LABELS: Record<PuzzleFlowStageKey, '기' | '승' | '전' | '반전' | '결'> = {
  intro:       '기',
  development: '승',
  expansion:   '전',
  twist:       '반전',
  ending:      '결',
};

// ── ID generator ──────────────────────────────────────────────────────────────

let _idCounter = 0;
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_idCounter}`;
}

// ── Generate recommendations for a single stage ───────────────────────────────

function buildRecommendationsForStage(
  stage: PuzzleFlowStage,
  variant: number,
  relatedKeywords: string[],
): PuzzleRecommendation[] {
  const key = stage.key as PuzzleFlowStageKey;
  const pool = PUZZLE_POOL[key];
  if (!pool || pool.length === 0) return [];

  const vi = variant % pool.length;
  const templates = pool[vi];

  // Limit by suggestedPuzzleSlots
  const count = Math.min(stage.suggestedPuzzleSlots, templates.length);

  return templates.slice(0, count).map((tmpl) => ({
    ...tmpl,
    id: genId(`puzzle-${key}`),
    stageId: stage.id,
    stageKey: key,
    stageLabel: STAGE_LABELS[key],
    // Merge stage's related keywords into clueUsage if not already present
    clueUsage: Array.from(new Set([...tmpl.clueUsage, ...relatedKeywords.slice(0, 2)])),
    status: 'suggested' as const,
  }));
}

// ── Primary generator ─────────────────────────────────────────────────────────

export function generatePuzzleRecommendations(
  plan: PuzzleFlowPlan,
  _cells: MandalartCellData[],
  variant = 0,
): PuzzleRecommendationGroup[] {
  return plan.stages.map((stage) => {
    const recommendations = buildRecommendationsForStage(
      stage,
      variant,
      stage.relatedKeywords,
    );

    return {
      stageId: stage.id,
      stageKey: stage.key,
      stageLabel: STAGE_LABELS[stage.key as PuzzleFlowStageKey],
      stageTitle: stage.title,
      recommendations,
    };
  });
}

// ── Regenerate all ────────────────────────────────────────────────────────────

export async function regenerateAllRecommendations(
  plan: PuzzleFlowPlan,
  cells: MandalartCellData[],
  currentVariant: number,
): Promise<PuzzleRecommendationGroup[]> {
  // Simulate API latency
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));
  return generatePuzzleRecommendations(plan, cells, currentVariant + 1);
}

// ── Regenerate by stage ───────────────────────────────────────────────────────

export async function regenerateRecommendationsByStage(
  stageId: string,
  plan: PuzzleFlowPlan,
  _cells: MandalartCellData[],
  currentVariant: number,
): Promise<PuzzleRecommendation[]> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

  const stage = plan.stages.find((s) => s.id === stageId);
  if (!stage) return [];

  return buildRecommendationsForStage(stage, currentVariant + 1, stage.relatedKeywords);
}

// ── Regenerate single card ────────────────────────────────────────────────────

export async function regenerateSingleRecommendation(
  recommendation: PuzzleRecommendation,
  plan: PuzzleFlowPlan,
  currentVariant: number,
): Promise<PuzzleRecommendation> {
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

  const stage = plan.stages.find((s) => s.id === recommendation.stageId);
  if (!stage) return recommendation;

  const key = stage.key as PuzzleFlowStageKey;
  const pool = PUZZLE_POOL[key];
  if (!pool || pool.length === 0) return recommendation;

  // Pick a different template
  const vi = (currentVariant + 1) % pool.length;
  const templates = pool[vi];

  // Find a template with a different title
  const alt =
    templates.find((t) => t.title !== recommendation.title) ??
    templates[0];

  return {
    ...alt,
    id: genId(`puzzle-${key}`),
    stageId: recommendation.stageId,
    stageKey: key,
    stageLabel: STAGE_LABELS[key],
    clueUsage: Array.from(new Set([...alt.clueUsage, ...stage.relatedKeywords.slice(0, 2)])),
    status: 'suggested' as const,
  };
}

// ── Stats calculator ──────────────────────────────────────────────────────────

export function calcRecommendationStats(
  groups: PuzzleRecommendationGroup[],
): RecommendationStats {
  const all = groups.flatMap((g) => g.recommendations);
  const active = all.filter((r) => r.status !== 'discarded');

  // Type variety
  const typeSet = new Set<PuzzleType>(active.map((r) => r.type));
  const varietyScore = Math.round((typeSet.size / 7) * 100); // 7 possible types

  // Consistency: fraction that has clueUsage items
  const withClues = active.filter((r) => r.clueUsage.length > 0).length;
  const consistencyScore = active.length > 0
    ? Math.round((withClues / active.length) * 100)
    : 0;

  const difficultyBalance = {
    easy:   active.filter((r) => r.difficulty === 'easy').length,
    medium: active.filter((r) => r.difficulty === 'medium').length,
    hard:   active.filter((r) => r.difficulty === 'hard').length,
  };

  return {
    totalPuzzles: active.length,
    adoptedCount: all.filter((r) => r.status === 'adopted' || r.status === 'edited').length,
    discardedCount: all.filter((r) => r.status === 'discarded').length,
    varietyScore,
    consistencyScore,
    difficultyBalance,
  };
}
