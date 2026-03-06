import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
  generatePuzzleRecommendations,
  regenerateAllRecommendations,
  regenerateRecommendationsByStage,
  regenerateSingleRecommendation,
  calcRecommendationStats,
} from '../utils/puzzleRecommendations';
import type {
  PuzzleRecommendationGroup,
  PuzzleFilterState,
  PuzzleRecommendationStatus,
} from '../types/puzzleRecommendation';

import PuzzleRecommendationsHeader from '../components/puzzle-recommendations/PuzzleRecommendationsHeader';
import SelectedStoryMiniCard from '../components/puzzle-recommendations/SelectedStoryMiniCard';
import PuzzleRecommendationFilters from '../components/puzzle-recommendations/PuzzleRecommendationFilters';
import PuzzleStageSection from '../components/puzzle-recommendations/PuzzleStageSection';
import PuzzleRecommendationSidebar from '../components/puzzle-recommendations/PuzzleRecommendationSidebar';

// ── Stage label map ───────────────────────────────────────────────────────────

const STAGE_LABEL_MAP: Record<string, string> = {
  intro:       '기',
  development: '승',
  expansion:   '전',
  twist:       '반전',
  ending:      '결',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PuzzleRecommendationsPage() {
  const navigate = useNavigate();
  const { projectName, selectedStory, puzzleFlowPlan, cells, setPuzzleRecommendationGroups } = useProject();

  // ── State ──────────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<PuzzleRecommendationGroup[]>([]);
  const [variant, setVariant] = useState(0);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [regeneratingStageIds, setRegeneratingStageIds] = useState<Set<string>>(new Set());
  const [regeneratingCardIds, setRegeneratingCardIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PuzzleFilterState>({
    stage: 'all',
    type: 'all',
    difficulty: 'all',
    showAdoptedOnly: false,
  });

  // ── Generate on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (puzzleFlowPlan) {
      setGroups(generatePuzzleRecommendations(puzzleFlowPlan, cells, 0));
      setVariant(0);
    }
  }, [puzzleFlowPlan]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers: update a puzzle's status ─────────────────────────────────────
  const updatePuzzleStatus = useCallback((id: string, status: PuzzleRecommendationStatus) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        recommendations: g.recommendations.map((p) =>
          p.id === id ? { ...p, status } : p,
        ),
      })),
    );
  }, []);

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleAdopt = useCallback((id: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        recommendations: g.recommendations.map((p) => {
          if (p.id !== id) return p;
          // Toggle: if already adopted/edited → back to suggested; else adopt
          const next: PuzzleRecommendationStatus =
            p.status === 'adopted' || p.status === 'edited' ? 'suggested' : 'adopted';
          return { ...p, status: next };
        }),
      })),
    );
  }, []);

  const handleDiscard = useCallback((id: string) => {
    updatePuzzleStatus(id, 'discarded');
  }, [updatePuzzleStatus]);

  const handleRegenerate = useCallback(async (id: string) => {
    if (!puzzleFlowPlan) return;
    setRegeneratingCardIds((s) => new Set(s).add(id));
    try {
      // Find the original puzzle
      const original = groups.flatMap((g) => g.recommendations).find((p) => p.id === id);
      if (!original) return;
      const replacement = await regenerateSingleRecommendation(original, puzzleFlowPlan, variant);
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          recommendations: g.recommendations.map((p) => (p.id === id ? replacement : p)),
        })),
      );
      setVariant((v) => v + 1);
    } finally {
      setRegeneratingCardIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }, [puzzleFlowPlan, groups, variant]);

  const handleRegenerateStage = useCallback(async (stageId: string) => {
    if (!puzzleFlowPlan) return;
    setRegeneratingStageIds((s) => new Set(s).add(stageId));
    try {
      const newCards = await regenerateRecommendationsByStage(stageId, puzzleFlowPlan, cells, variant);
      setGroups((prev) =>
        prev.map((g) =>
          g.stageId === stageId ? { ...g, recommendations: newCards } : g,
        ),
      );
      setVariant((v) => v + 1);
    } finally {
      setRegeneratingStageIds((s) => { const n = new Set(s); n.delete(stageId); return n; });
    }
  }, [puzzleFlowPlan, cells, variant]);

  const handleRegenerateAll = useCallback(async () => {
    if (!puzzleFlowPlan || isRegeneratingAll) return;
    setIsRegeneratingAll(true);
    try {
      const newGroups = await regenerateAllRecommendations(puzzleFlowPlan, cells, variant);
      setGroups(newGroups);
      setVariant((v) => v + 1);
    } finally {
      setIsRegeneratingAll(false);
    }
  }, [puzzleFlowPlan, cells, variant, isRegeneratingAll]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = calcRecommendationStats(groups);

  // ── Finalize: save to context → navigate to /draft ─────────────────────────
  const handleFinalize = useCallback(() => {
    setPuzzleRecommendationGroups(groups);
    navigate('/draft');
  }, [groups, setPuzzleRecommendationGroups, navigate]);

  // ── Empty state: missing context ───────────────────────────────────────────
  if (!selectedStory || !puzzleFlowPlan) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-lg">
          🧩
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/70 mb-1">퍼즐 플로우가 없습니다.</p>
          <p className="text-[12px] text-white/35 leading-relaxed">
            먼저 스토리를 선택하고 퍼즐 플로우를 설계해주세요.
          </p>
        </div>
        <button
          onClick={() => navigate('/puzzle-flow')}
          className="mt-2 px-4 py-2 rounded-full border border-white/[0.12] text-xs text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          ← Puzzle Flow로 돌아가기
        </button>
      </div>
    );
  }

  // ── Stage keys for filters ─────────────────────────────────────────────────
  const stageKeys = groups.map((g) => g.stageKey);

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Header ── */}
      <PuzzleRecommendationsHeader
        projectName={projectName}
        isRegenerating={isRegeneratingAll}
        onRegenerateAll={handleRegenerateAll}
      />

      {/* ── Story + plan summary strip ── */}
      <SelectedStoryMiniCard story={selectedStory} plan={puzzleFlowPlan} />

      {/* ── Filter bar ── */}
      <PuzzleRecommendationFilters
        filters={filters}
        onChange={setFilters}
        stageKeys={stageKeys}
        stageLabels={STAGE_LABEL_MAP}
      />

      {/* ── Main content ── */}
      <div className="flex flex-1 gap-5 px-6 py-5 overflow-hidden min-h-0">

        {/* Stage sections (scrollable) */}
        <div className="flex-1 overflow-y-auto min-w-0 pr-1 flex flex-col gap-8">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-[11px] text-white/25">추천 퍼즐 생성 중…</span>
            </div>
          ) : (
            groups.map((group) => (
              <PuzzleStageSection
                key={group.stageId}
                group={group}
                filters={filters}
                regeneratingIds={regeneratingCardIds}
                onAdopt={handleAdopt}
                onDiscard={handleDiscard}
                onRegenerate={handleRegenerate}
                onRegenerateStage={handleRegenerateStage}
                isStageRegenerating={regeneratingStageIds.has(group.stageId)}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col">
          <PuzzleRecommendationSidebar stats={stats} />
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/puzzle-flow')}
          className="text-[11px] text-white/35 hover:text-white/60 transition-colors"
        >
          ← Back to Puzzle Flow
        </button>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <BottomStat label="전체" value={stats.totalPuzzles} />
          <span className="w-px h-3 bg-white/[0.08]" />
          <BottomStat label="채택됨" value={stats.adoptedCount} accent="emerald" />
          <span className="w-px h-3 bg-white/[0.08]" />
          <BottomStat label="제외됨" value={stats.discardedCount} accent="rose" />
        </div>

        <button
          onClick={handleFinalize}
          className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:bg-white/80 transition-colors"
        >
          Finalize Current Draft →
        </button>
      </div>
    </div>
  );
}

// ── Bottom stat ───────────────────────────────────────────────────────────────

function BottomStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'emerald' | 'rose';
}) {
  const cls = accent === 'emerald'
    ? 'text-emerald-300/70'
    : accent === 'rose'
      ? 'text-rose-300/65'
      : 'text-white/60';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/25">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}
