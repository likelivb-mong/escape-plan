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
    aiStoryProposals, projectBrief,
    saveCurrentProject, resetForNewProject,
  } = useProject();

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

  // variantIndices: proposal.id → variant index (for mock rotation)
  const [variantIndices, setVariantIndices] = useState<Record<string, number>>(() => {
    const initial =
      aiStoryProposals && aiStoryProposals.length > 0
        ? aiStoryProposals
        : generateStoryProposals(allKeywords, themeTitle, [0, 0, 0]);
    return Object.fromEntries(initial.map((p) => [p.id, 0]));
  });

  // Use AI-generated proposals (from YouTube flow) if available; otherwise mock
  const [proposals, setProposals] = useState<StoryProposal[]>(() =>
    aiStoryProposals && aiStoryProposals.length > 0
      ? aiStoryProposals
      : generateStoryProposals(allKeywords, themeTitle, [0, 0, 0]),
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelect = (id: string) => {
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

  // "+ NEW 스토리 생성": 새 3개를 기존 목록 위(앞)에 추가
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
      setProposals((prev) => [...newProposals, ...prev]);
    } finally {
      setIsAddingBatch(false);
    }
  };

  // ── Continue to Mandalart (select & lock story) ────────────────────────────
  const handleContinue = () => {
    const proposal = proposals.find((p) => p.id === selectedId);
    if (proposal) {
      setSelectedStory(proposal);
      setProjectName(proposal.title);
      setCells(populateMandalartFromStory(proposal));
      // Auto-save so the story selection persists
      setTimeout(() => saveCurrentProject(), 0);
      navigate('/mandalart');
    }
  };

  // ── Fork: create new project with a different story ────────────────────────
  const handleForkWithStory = (proposal: StoryProposal) => {
    resetForNewProject();
    setSelectedStory(proposal);
    setProjectName(proposal.title);
    setCells(populateMandalartFromStory(proposal));
    setTimeout(() => saveCurrentProject(), 0);
    navigate('/mandalart');
  };

  // ── If story is already locked, show locked view ──────────────────────────
  if (selectedStory) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/projects')}
              className="text-white/30 hover:text-white/60 transition-colors text-subhead"
            >
              ← 내 프로젝트
            </button>
            <span className="h-3.5 w-px bg-white/10" />
            <h1 className="text-body font-semibold text-white/85">{projectName}</h1>
            <span className="h-3.5 w-px bg-white/10" />
            <span className="text-footnote text-white/35 font-medium tracking-wide">
              Story (확정됨)
            </span>
          </div>
          <button
            onClick={() => navigate('/mandalart')}
            className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 transition-colors"
          >
            만다라트 편집 →
          </button>
        </div>

        {/* Locked story card */}
        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-caption font-medium">
                  선택 확정됨
                </span>
              </div>
              <h2 className="text-title1 font-bold text-white/90 mb-2">
                {selectedStory.title}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-subhead text-white/40">{selectedStory.genre}</span>
                <span className="h-3 w-px bg-white/10" />
                <span className="text-subhead text-white/40">{selectedStory.tone}</span>
                <span className="h-3 w-px bg-white/10" />
                <span className="text-subhead text-white/40">{selectedStory.meta.playtime}</span>
              </div>
              <p className="text-body text-white/60 leading-relaxed mb-6">
                {selectedStory.synopsis}
              </p>

              {/* Beats */}
              {selectedStory.beats.length > 0 && (
                <div className="flex flex-col gap-2">
                  {selectedStory.beats.map((beat) => (
                    <div key={beat.label} className="flex gap-3">
                      <span className="text-subhead font-semibold text-white/30 w-8 flex-shrink-0 text-right">
                        {beat.label}
                      </span>
                      <span className="text-subhead text-white/50">{beat.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Option to create a new project with different story */}
            <div className="mt-8 text-center">
              <p className="text-footnote text-white/25 mb-3">
                다른 스토리로 진행하려면 새 프로젝트를 만들어야 합니다
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-xl border border-white/10 text-subhead text-white/40 hover:text-white/70 hover:border-white/25 transition-all"
              >
                + 새 프로젝트 만들기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal render (no story locked yet) ─────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Page header with breadcrumb + action buttons */}
      <StoryPageHeader
        projectName={projectName}
        selectedId={selectedId}
        isAddingBatch={isAddingBatch}
        onAddNewBatch={handleAddNewBatch}
        onContinue={handleContinue}
      />

      {/* Project brief (YouTube or manual) */}
      {projectBrief && <ProjectBriefSection brief={projectBrief} />}

      {/* Keyword summary strip */}
      <SelectedKeywordSummary categories={categories} themeTitle={themeTitle} />

      {/* Main: 3-column grid of story cards */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 flex flex-col overflow-y-auto">
        <StoryProposalGrid
          proposals={proposals}
          selectedId={selectedId}
          regeneratingId={regeneratingId}
          isAddingBatch={isAddingBatch}
          onSelect={handleSelect}
          onRegenerate={handleRegenerateSingle}
          onViewDetail={setViewingId}
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
