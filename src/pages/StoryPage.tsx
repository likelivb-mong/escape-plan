import { useState, useMemo, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  extractKeywordsByCategory,
  generateStoryProposals,
  regenerateSingleProposal,
  regenerateAllProposals,
} from '../utils/story';
import type { StoryProposal } from '../types/story';
import { populateMandalartFromStory } from '../utils/mandalartFromStory';
import {
  loadHistory,
  saveHistory,
  cleanExpiredSnapshots,
  createSnapshot,
  type StoryFlowSnapshot,
} from '../utils/storyFlowHistory';
import StoryPageHeader from '../components/story/StoryPageHeader';
import SelectedKeywordSummary from '../components/story/SelectedKeywordSummary';
import ProjectBriefSection from '../components/story/ProjectBriefSection';
import StoryProposalGrid from '../components/story/StoryProposalGrid';
import StoryDetailModal from '../components/story/StoryDetailModal';

export default function StoryPage() {
  const {
    projectName, setProjectName,
    currentProjectId,
    cells, setCells,
    setSelectedStory,
    aiStoryProposals,
    projectBrief,
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

  // ── History state ────────────────────────────────────────────────────────
  const [history, setHistory] = useState<StoryFlowSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load & clean history on mount
  useEffect(() => {
    const loaded = loadHistory(currentProjectId, projectName);
    const cleaned = cleanExpiredSnapshots(loaded);
    if (cleaned.length !== loaded.length) {
      saveHistory(currentProjectId, projectName, cleaned);
    }
    setHistory(cleaned);
    if (cleaned.length > 0) {
      setHistoryIndex(cleaned.length - 1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Story Flow 확정 ─────────────────────────────────────────────────────
  const handleContinue = () => {
    if (!selectedId) return;
    const proposal = proposals.find((p) => p.id === selectedId);
    if (!proposal) return;

    // Update context so other pages can use the confirmed story
    setSelectedStory(proposal);
    setProjectName(proposal.title);
    setCells(populateMandalartFromStory(proposal));

    // Build snapshot
    const snapshot = createSnapshot(selectedId, proposals, variantIndices);

    // If viewing a past snapshot, truncate forward history
    const base =
      historyIndex >= 0 && historyIndex < history.length
        ? history.slice(0, historyIndex + 1)
        : [...history];

    const updated = [...base, snapshot];
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    saveHistory(currentProjectId, projectName, updated);
  };

  // ── History navigation ──────────────────────────────────────────────────
  const handleHistoryBack = () => {
    const newIdx = Math.max(0, historyIndex - 1);
    if (newIdx === historyIndex) return;
    applySnapshot(history[newIdx], newIdx);
  };

  const handleHistoryForward = () => {
    const newIdx = Math.min(history.length - 1, historyIndex + 1);
    if (newIdx === historyIndex) return;
    applySnapshot(history[newIdx], newIdx);
  };

  const applySnapshot = (snapshot: StoryFlowSnapshot, idx: number) => {
    setHistoryIndex(idx);
    setProposals(snapshot.proposals);
    setSelectedId(snapshot.selectedId);
    setVariantIndices(snapshot.variantIndices);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Page header with breadcrumb + action buttons */}
      <StoryPageHeader
        projectName={projectName}
        selectedId={selectedId}
        isAddingBatch={isAddingBatch}
        onAddNewBatch={handleAddNewBatch}
        onContinue={handleContinue}
        historyIndex={historyIndex}
        historyLength={history.length}
        onHistoryBack={handleHistoryBack}
        onHistoryForward={handleHistoryForward}
      />

      {/* Project brief (YouTube or manual) */}
      {projectBrief && <ProjectBriefSection brief={projectBrief} />}

      {/* Keyword summary strip */}
      <SelectedKeywordSummary categories={categories} themeTitle={themeTitle} />

      {/* Main: 3-column grid of story cards */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 flex flex-col">
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
