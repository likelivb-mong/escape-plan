import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
  extractKeywordsByCategory,
  generateStoryProposals,
  regenerateSingleProposal,
  regenerateAllProposals,
} from '../utils/story';
import type { StoryProposal } from '../types/story';
import { populateMandalartFromStory } from '../utils/mandalartFromStory';
import StoryPageHeader from '../components/story/StoryPageHeader';
import SelectedKeywordSummary from '../components/story/SelectedKeywordSummary';
import ProjectBriefSection from '../components/story/ProjectBriefSection';
import StoryProposalGrid from '../components/story/StoryProposalGrid';
import StoryDetailModal from '../components/story/StoryDetailModal';

export default function StoryPage() {
  const navigate = useNavigate();
  const {
    projectName, setProjectName, cells, setCells,
    selectedStory, setSelectedStory,
    aiStoryProposals, setAiStoryProposals, projectBrief,
    saveCurrentProject, forkAsNewProject,
  } = useProject();

  // ── Whether this project already has a locked story ────────────────────────
  const isStoryLocked = selectedStory !== null;

  // ── Derived context ────────────────────────────────────────────────────────
  const themeTitle = useMemo(
    () => cells.find((c) => c.isCenter)?.text?.trim() || 'Untitled Theme',
    [cells],
  );

  const categories = useMemo(() => extractKeywordsByCategory(cells), [cells]);

  const allKeywords = useMemo(
    () => categories.flatMap((cat) => cat.keywords),
    [categories],
  );

  // ── State ──────────────────────────────────────────────────────────────────

  const [variantIndices, setVariantIndices] = useState<Record<string, number>>(() => {
    const initial =
      aiStoryProposals && aiStoryProposals.length > 0
        ? aiStoryProposals
        : [];
    return Object.fromEntries(initial.map((p) => [p.id, 0]));
  });

  const [proposals, setProposals] = useState<StoryProposal[]>(() =>
    aiStoryProposals && aiStoryProposals.length > 0
      ? aiStoryProposals
      : selectedStory ? [selectedStory] : [],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelect = (id: string) => {
    // Don't allow selecting the already-locked story
    if (isStoryLocked && selectedStory.id === id) return;
    setSelectedId((prev) => (prev === id || id === '' ? null : id));
  };

  const handleRegenerateSingle = async (id: string) => {
    if (regeneratingId !== null || isAddingBatch) return;
    const target = proposals.find((p) => p.id === id);
    if (!target) return;
    setRegeneratingId(id);
    try {
      const { newVariantIndex, proposal } = await regenerateSingleProposal(
        target.slot,
        variantIndices[id] ?? 0,
        allKeywords,
        themeTitle,
      );
      const newId = `regen-${Date.now()}-slot${target.slot}`;
      const updated = { ...proposal, id: newId, slot: target.slot };
      setVariantIndices((prev) => {
        const next = { ...prev };
        delete next[id];
        next[newId] = newVariantIndex;
        return next;
      });
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setSelectedId((prev) => (prev === id ? null : prev));
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleAddNewBatch = async () => {
    if (isAddingBatch || regeneratingId !== null) return;
    setIsAddingBatch(true);
    try {
      const batchId = Date.now();
      const { newVariantIndices, proposals: newPs } = await regenerateAllProposals(
        [0, 0, 0],
        allKeywords,
        themeTitle,
      );
      const newProposals = newPs.map((p, i) => ({
        ...p,
        id: `new-${batchId}-${i}`,
        slot: i,
      }));
      setVariantIndices((prev) => ({
        ...prev,
        ...Object.fromEntries(newProposals.map((p, i) => [p.id, newVariantIndices[i]])),
      }));
      const merged = [...newProposals, ...proposals];
      setProposals(merged);
      // 생성된 스토리 목록을 context에 저장
      setAiStoryProposals(merged);
      setTimeout(() => saveCurrentProject(), 0);
    } finally {
      setIsAddingBatch(false);
    }
  };

  // ── Continue to Mandalart ─────────────────────────────────────────────────
  const handleContinue = () => {
    const proposal = proposals.find((p) => p.id === selectedId);
    if (!proposal) return;

    if (isStoryLocked && selectedStory.id !== proposal.id) {
      // Different story selected → fork as new project
      forkAsNewProject();
    }

    setSelectedStory(proposal);
    setProjectName(proposal.title);
    setCells(populateMandalartFromStory(proposal));
    setTimeout(() => saveCurrentProject(), 0);
    navigate('/mandalart');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 gap-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => navigate('/plan')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead flex-shrink-0"
          >
            ← Plan
          </button>
          <span className="h-3.5 w-px bg-white/10 flex-shrink-0" />
          <h1 className="text-body font-semibold text-white/85 truncate">{projectName}</h1>
          <span className="hidden sm:block h-3.5 w-px bg-white/10 flex-shrink-0" />
          <span className="hidden sm:block text-footnote text-white/35 font-medium tracking-wide flex-shrink-0">
            Story
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => saveCurrentProject()}
            className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-footnote font-medium text-white/45 hover:border-white/20 hover:text-white/70 transition-all"
          >
            저장
          </button>
          {/* Locked story indicator — hidden on mobile */}
          {isStoryLocked && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-caption font-medium max-w-[140px] truncate">
              ✓ {selectedStory.title}
            </span>
          )}

          <button
            onClick={handleAddNewBatch}
            disabled={isAddingBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote text-white/45 hover:border-white/25 hover:text-white/65 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isAddingBatch ? (
              <>
                <span className="inline-block w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                <span className="hidden sm:inline">생성 중…</span>
              </>
            ) : (
              <><span className="hidden sm:inline">+ NEW </span>스토리</>
            )}
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedId}
            className="px-3 sm:px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">
              {isStoryLocked && selectedId && !proposals.find((p) => p.id === selectedId && p.id === selectedStory.id)
                ? '새 프로젝트로 만다라트 →'
                : '만다라트 편집 →'}
            </span>
            <span className="sm:hidden">다음 →</span>
          </button>
        </div>
      </div>

      {/* Info banner when story is already locked */}
      {isStoryLocked && (
        <div className="px-6 py-2.5 bg-emerald-500/[0.06] border-b border-emerald-500/10">
          <p className="text-caption text-emerald-400/70">
            이 프로젝트의 스토리는 확정되었습니다.
            다른 스토리를 선택하면 <strong>새 프로젝트</strong>가 자동으로 생성됩니다.
          </p>
        </div>
      )}

      {/* Project brief */}
      {projectBrief && <ProjectBriefSection brief={projectBrief} />}

      {/* Keyword summary strip */}
      <SelectedKeywordSummary categories={categories} themeTitle={themeTitle} />

      {/* Main: story cards */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 flex flex-col overflow-y-auto">
        <StoryProposalGrid
          proposals={proposals}
          selectedId={selectedId}
          regeneratingId={regeneratingId}
          isAddingBatch={isAddingBatch}
          onSelect={handleSelect}
          onRegenerate={handleRegenerateSingle}
          onViewDetail={setViewingId}
          lockedStoryId={isStoryLocked ? selectedStory.id : undefined}
        />
      </div>

      {/* Detail modal */}
      {viewingId && (() => {
        const proposal = proposals.find((p) => p.id === viewingId);
        if (!proposal) return null;
        return (
          <StoryDetailModal
            proposal={proposal}
            isSelected={selectedId === viewingId}
            onSelect={() => handleSelect(viewingId)}
            onClose={() => setViewingId(null)}
          />
        );
      })()}
    </div>
  );
}
