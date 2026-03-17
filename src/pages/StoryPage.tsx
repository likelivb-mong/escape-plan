import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import {
  extractKeywordsByCategory,
  regenerateSingleProposal,
  regenerateAllProposals,
  buildBriefContext,
} from '../utils/story';
import type { StoryProposal, StoryBeat, TwistIntensity } from '../types/story';
import { populateMandalartFromStory } from '../utils/mandalartFromStory';
import ProjectBriefSection from '../components/story/ProjectBriefSection';
import StoryProposalGrid from '../components/story/StoryProposalGrid';
import StoryDetailModal from '../components/story/StoryDetailModal';

const GENRE_LABELS: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처', thriller: '스릴러',
  fantasy: '판타지', 'sci-fi': 'SF', romance: '로맨스', comedy: '코미디',
};

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
    () => cells.find((c) => c.isCenter)?.text?.trim() || projectName || 'Untitled Theme',
    [cells, projectName],
  );

  const categories = useMemo(() => extractKeywordsByCategory(cells), [cells]);

  const allKeywords = useMemo(
    () => categories.flatMap((cat) => cat.keywords),
    [categories],
  );

  // ── Brief context for AI generation ────────────────────────────────────────
  const briefCtx = useMemo(
    () => projectBrief ? buildBriefContext(projectBrief, projectName) : undefined,
    [projectBrief, projectName],
  );

  // ── Source story from projectBrief ─────────────────────────────────────────
  const sourceStory: StoryProposal | null = useMemo(() => {
    if (!projectBrief || (!projectBrief.synopsis && projectBrief.beats.length === 0)) return null;
    const isYoutube = projectBrief.source === 'youtube';
    return {
      id: 'source-story',
      slot: -1,
      title: isYoutube ? (projectBrief.videoTitle || projectName) : projectName,
      genre: projectBrief.genres.map(g => GENRE_LABELS[g] ?? g).join(' · ') || '미분류',
      tone: isYoutube ? 'YouTube 원작 기반' : '직접 작성',
      logline: projectBrief.synopsis?.slice(0, 120) || '',
      synopsis: projectBrief.synopsis || '',
      beats: projectBrief.beats as StoryBeat[],
      meta: {
        playtime: `${projectBrief.playTimes[0] ?? 60}분`,
        playerCount: '2-6인',
        twistIntensity: 'medium' as TwistIntensity,
      },
    };
  }, [projectBrief, projectName]);

  // ── State ──────────────────────────────────────────────────────────────────

  const [variantIndices, setVariantIndices] = useState<Record<string, number>>(() => {
    const initial =
      aiStoryProposals && aiStoryProposals.length > 0
        ? aiStoryProposals
        : [];
    return Object.fromEntries(initial.map((p) => [p.id, 0]));
  });

  const [aiProposals, setAiProposals] = useState<StoryProposal[]>(() => {
    if (aiStoryProposals && aiStoryProposals.length > 0) return aiStoryProposals;
    if (selectedStory && selectedStory.id !== 'source-story') return [selectedStory];
    return [];
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  // ── Combined list for lookup ───────────────────────────────────────────────
  const allProposals = useMemo(() => {
    const list: StoryProposal[] = [];
    if (sourceStory) list.push(sourceStory);
    list.push(...aiProposals);
    return list;
  }, [sourceStory, aiProposals]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelect = (id: string) => {
    if (isStoryLocked && selectedStory.id === id) return;
    setSelectedId((prev) => (prev === id || id === '' ? null : id));
  };

  const handleRegenerateSingle = async (id: string) => {
    if (regeneratingId !== null || isAddingBatch) return;
    const target = aiProposals.find((p) => p.id === id);
    if (!target) return;
    setRegeneratingId(id);
    try {
      const { newVariantIndex, proposal } = await regenerateSingleProposal(
        target.slot,
        variantIndices[id] ?? 0,
        allKeywords,
        themeTitle,
        briefCtx,
      );
      const newId = `regen-${Date.now()}-slot${target.slot}`;
      const updated = { ...proposal, id: newId, slot: target.slot };
      setVariantIndices((prev) => {
        const next = { ...prev };
        delete next[id];
        next[newId] = newVariantIndex;
        return next;
      });
      setAiProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
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
        briefCtx,
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
      const merged = [...newProposals, ...aiProposals];
      setAiProposals(merged);
      setAiStoryProposals(merged);
      setTimeout(() => saveCurrentProject(), 0);
    } finally {
      setIsAddingBatch(false);
    }
  };

  // ── Continue to Mandalart ─────────────────────────────────────────────────
  const handleContinue = () => {
    const proposal = allProposals.find((p) => p.id === selectedId);
    if (!proposal) return;

    if (isStoryLocked && selectedStory.id !== proposal.id) {
      forkAsNewProject();
    }

    setSelectedStory(proposal);
    setProjectName(proposal.title);
    setCells(populateMandalartFromStory(proposal));
    setTimeout(() => saveCurrentProject(), 0);
    navigate('/mandalart');
  };

  // ── Source story section label ──────────────────────────────────────────────
  const sourceLabel = projectBrief?.source === 'youtube'
    ? '유튜브 스토리 구조'
    : '직접 작성한 스토리 흐름';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 gap-2">
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

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => saveCurrentProject()}
            className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-footnote font-medium text-white/45 hover:border-white/20 hover:text-white/70 transition-all"
          >
            저장
          </button>
          {isStoryLocked && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-caption font-medium max-w-[140px] truncate">
              ✓ {selectedStory.title}
            </span>
          )}
          <button
            onClick={handleContinue}
            disabled={!selectedId}
            className="px-3 sm:px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">
              {isStoryLocked && selectedId && !allProposals.find((p) => p.id === selectedId && p.id === selectedStory.id)
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

      {/* Project brief (collapsed info) */}
      {projectBrief && <ProjectBriefSection brief={projectBrief} />}

      {/* Main content */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 flex flex-col overflow-y-auto">

        {/* ── Source Story Section ── */}
        {sourceStory && (
          <div className="mb-6">
            <p className="text-caption text-white/25 uppercase tracking-widest mb-3">{sourceLabel}</p>
            <SourceStoryCard
              story={sourceStory}
              isYoutube={projectBrief?.source === 'youtube'}
              isSelected={selectedId === 'source-story'}
              isLocked={isStoryLocked && selectedStory?.id === 'source-story'}
              onSelect={() => handleSelect('source-story')}
              onViewDetail={() => setViewingId('source-story')}
            />
          </div>
        )}

        {/* ── AI Story Proposals Section ── */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-caption text-white/25 uppercase tracking-widest">AI 스토리 제안</p>
            {aiProposals.length > 0 && (
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
                  <><span className="hidden sm:inline">+ 새 </span>AI 스토리</>
                )}
              </button>
            )}
          </div>

          {aiProposals.length > 0 ? (
            <StoryProposalGrid
              proposals={aiProposals}
              selectedId={selectedId}
              regeneratingId={regeneratingId}
              isAddingBatch={isAddingBatch}
              onSelect={handleSelect}
              onRegenerate={handleRegenerateSingle}
              onViewDetail={setViewingId}
              lockedStoryId={isStoryLocked && selectedStory.id !== 'source-story' ? selectedStory.id : undefined}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015]">
              <p className="text-subhead text-white/30 mb-4 text-center px-4">
                기획안을 기반으로 AI가 방탈출 시나리오 스토리 3개를 제안합니다
              </p>
              <button
                onClick={handleAddNewBatch}
                disabled={isAddingBatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-subhead font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {isAddingBatch ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black/70 rounded-full animate-spin" />
                    AI 스토리 생성 중…
                  </>
                ) : (
                  'AI 스토리 3개 생성하기'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {viewingId && (() => {
        const proposal = allProposals.find((p) => p.id === viewingId);
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

// ── Source Story Card ─────────────────────────────────────────────────────────

function SourceStoryCard({
  story,
  isYoutube,
  isSelected,
  isLocked,
  onSelect,
  onViewDetail,
}: {
  story: StoryProposal;
  isYoutube?: boolean;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div
      className={[
        'rounded-2xl border-2 transition-all duration-300 overflow-hidden',
        isLocked
          ? 'border-emerald-400/40 bg-emerald-500/[0.03] opacity-60'
          : isSelected
            ? 'border-emerald-400/60 bg-emerald-500/[0.04] shadow-[0_0_24px_rgba(52,211,153,0.12)] ring-1 ring-emerald-400/20'
            : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.03]',
      ].join(' ')}
    >
      {isSelected && !isLocked && (
        <div className="h-1 bg-gradient-to-r from-emerald-400/70 via-emerald-300/50 to-emerald-400/70" />
      )}

      {/* Clickable body */}
      <div className="cursor-pointer" onClick={onViewDetail}>
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full border text-micro font-medium ${
              isYoutube
                ? 'bg-red-500/[0.12] border-red-500/20 text-red-400/70'
                : 'bg-sky-500/[0.12] border-sky-500/20 text-sky-400/70'
            }`}>
              {isYoutube ? 'YouTube 원작' : '직접 작성'}
            </span>
            <span className="px-2 py-0.5 rounded-md border border-white/[0.10] text-micro text-white/40 bg-white/[0.03]">
              {story.genre}
            </span>
            <span className="text-caption text-white/30">{story.meta.playtime}</span>
            {isLocked && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-micro font-medium">
                확정됨
              </span>
            )}
          </div>

          <h3 className={`text-body font-semibold mb-2 leading-snug ${isSelected ? 'text-emerald-200/95' : 'text-white/90'}`}>
            {story.title}
          </h3>
          {story.synopsis && (
            <p className="text-footnote text-white/50 leading-relaxed line-clamp-3">{story.synopsis}</p>
          )}
        </div>

        {/* Beats */}
        {story.beats.length > 0 && (
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <p className="text-micro font-semibold text-white/20 uppercase tracking-widest mb-3">스토리 구조</p>
            <div className="grid grid-cols-5 gap-2">
              {story.beats.map((beat) => (
                <div key={beat.label} className="min-w-0">
                  <p className="text-micro font-bold text-white/35 mb-1">{beat.label}</p>
                  <p className="text-caption text-white/45 leading-relaxed line-clamp-3">{beat.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex gap-2">
        {isLocked ? (
          <span className="flex-1 py-2 rounded-xl text-subhead font-semibold text-center bg-emerald-400/20 text-emerald-300/70 cursor-default">
            현재 프로젝트 스토리
          </span>
        ) : (
          <button
            onClick={onSelect}
            className={[
              'flex-1 py-2 rounded-xl text-subhead font-semibold transition-all duration-200',
              isSelected
                ? 'bg-emerald-400/90 text-black hover:bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                : 'bg-white/[0.07] text-white/55 hover:bg-white/[0.12] hover:text-white/80',
            ].join(' ')}
          >
            {isSelected ? '✓ 선택됨' : '이 스토리로 진행'}
          </button>
        )}
      </div>
    </div>
  );
}
