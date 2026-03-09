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
  const { projectName, setProjectName, cells, setCells, setSelectedStory, aiStoryProposals, projectBrief } = useProject();

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

  // ── Continue to Mandalart ─────────────────────────────────────────────────
  const handleContinue = () => {
    const proposal = proposals.find((p) => p.id === selectedId);
    if (proposal) {
      setSelectedStory(proposal);
      setProjectName(proposal.title);
      setCells(populateMandalartFromStory(proposal));
      navigate('/mandalart');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
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
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto min-h-0 flex flex-col">
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
