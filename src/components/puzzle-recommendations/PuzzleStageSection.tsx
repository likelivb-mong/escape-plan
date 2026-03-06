import type { PuzzleRecommendationGroup, PuzzleRecommendation, PuzzleFilterState } from '../../types/puzzleRecommendation';
import type { PuzzleFlowStageKey } from '../../types/puzzleFlow';
import PuzzleRecommendationCard from './PuzzleRecommendationCard';

interface PuzzleStageSectionProps {
  group: PuzzleRecommendationGroup;
  filters: PuzzleFilterState;
  regeneratingIds: Set<string>;
  onAdopt: (id: string) => void;
  onDiscard: (id: string) => void;
  onRegenerate: (id: string) => void;
  onRegenerateStage: (stageId: string) => void;
  isStageRegenerating: boolean;
}

// ── Stage accent colors ───────────────────────────────────────────────────────

const STAGE_ACCENTS: Record<PuzzleFlowStageKey, { dot: string; label: string; badge: string }> = {
  intro:       { dot: 'bg-sky-400/70',     label: 'text-sky-300/65',     badge: 'bg-sky-500/[0.10] text-sky-300/80 border-sky-400/20' },
  development: { dot: 'bg-emerald-400/70', label: 'text-emerald-300/65', badge: 'bg-emerald-500/[0.10] text-emerald-300/80 border-emerald-400/20' },
  expansion:   { dot: 'bg-amber-400/70',   label: 'text-amber-300/65',   badge: 'bg-amber-500/[0.10] text-amber-300/80 border-amber-400/20' },
  twist:       { dot: 'bg-rose-400/70',    label: 'text-rose-300/65',    badge: 'bg-rose-500/[0.10] text-rose-300/80 border-rose-400/20' },
  ending:      { dot: 'bg-purple-400/70',  label: 'text-purple-300/65',  badge: 'bg-purple-500/[0.10] text-purple-300/80 border-purple-400/20' },
};

// ── Filter logic ──────────────────────────────────────────────────────────────

function filterPuzzles(
  puzzles: PuzzleRecommendation[],
  filters: PuzzleFilterState,
  stageKey: string,
): PuzzleRecommendation[] {
  return puzzles.filter((p) => {
    if (filters.stage !== 'all' && filters.stage !== stageKey) return false;
    if (filters.type !== 'all' && p.type !== filters.type) return false;
    if (filters.difficulty !== 'all' && p.difficulty !== filters.difficulty) return false;
    if (filters.showAdoptedOnly && p.status !== 'adopted' && p.status !== 'edited') return false;
    return true;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleStageSection({
  group,
  filters,
  regeneratingIds,
  onAdopt,
  onDiscard,
  onRegenerate,
  onRegenerateStage,
  isStageRegenerating,
}: PuzzleStageSectionProps) {
  const accent = STAGE_ACCENTS[group.stageKey as PuzzleFlowStageKey] ?? STAGE_ACCENTS.intro;
  const filtered = filterPuzzles(group.recommendations, filters, group.stageKey);

  // If stage filter is active for a different stage, hide this section
  if (filters.stage !== 'all' && filters.stage !== group.stageKey) {
    return null;
  }

  // If all puzzles are filtered out due to type/difficulty/adopted-only
  const hasVisible = filtered.length > 0;

  const adoptedCount = group.recommendations.filter(
    (p) => p.status === 'adopted' || p.status === 'edited',
  ).length;
  const totalCount = group.recommendations.length;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent.dot}`} />
          <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold leading-none ${accent.badge}`}>
            {group.stageLabel}
          </span>
          <h3 className={`text-sm font-semibold ${accent.label}`}>{group.stageTitle}</h3>
          <span className="text-[10px] text-white/25">
            {adoptedCount}/{totalCount} 채택
          </span>
        </div>

        {/* Regenerate stage button */}
        <button
          onClick={() => onRegenerateStage(group.stageId)}
          disabled={isStageRegenerating}
          className="text-[10px] text-white/25 hover:text-white/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0"
        >
          {isStageRegenerating ? (
            <span className="w-2.5 h-2.5 border border-white/20 border-t-white/50 rounded-full animate-spin" />
          ) : (
            '↺'
          )}
          이 단계 재생성
        </button>
      </div>

      {/* ── Cards ── */}
      {hasVisible ? (
        <div className="flex flex-col gap-2.5">
          {filtered.map((puzzle) => (
            <PuzzleRecommendationCard
              key={puzzle.id}
              puzzle={puzzle}
              isRegenerating={regeneratingIds.has(puzzle.id)}
              onAdopt={onAdopt}
              onDiscard={onDiscard}
              onRegenerate={onRegenerate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-6 text-center">
          <p className="text-[11px] text-white/20 italic">이 단계에 표시할 퍼즐이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
