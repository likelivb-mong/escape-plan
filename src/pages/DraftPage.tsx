import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { buildDraftDocument, calcDraftStatus } from '../utils/draft';

import DraftHeader from '../components/draft/DraftHeader';
import DraftOverviewSection from '../components/draft/DraftOverviewSection';
import DraftConceptSummary from '../components/draft/DraftConceptSummary';
import DraftStorySection from '../components/draft/DraftStorySection';
import DraftFlowSection from '../components/draft/DraftFlowSection';
import DraftPuzzleSection from '../components/draft/DraftPuzzleSection';
import DraftSidebar from '../components/draft/DraftSidebar';
import DraftDocumentActions from '../components/draft/DraftDocumentActions';
import DraftGameFlowSection from '../components/draft/DraftGameFlowSection';

export default function DraftPage() {
  const navigate = useNavigate();
  const {
    projectName,
    cells,
    selectedStory,
    puzzleFlowPlan,
    puzzleRecommendationGroups,
    gameFlowDesign,
    setGameFlowDesign,
  } = useProject();

  // ── Build draft document ───────────────────────────────────────────────────
  const doc = useMemo(() => {
    if (!selectedStory || !puzzleFlowPlan) return null;
    return buildDraftDocument({
      projectName,
      cells,
      story: selectedStory,
      puzzleFlowPlan,
      puzzleRecommendationGroups,
    });
  }, [projectName, cells, selectedStory, puzzleFlowPlan, puzzleRecommendationGroups]);

  const status = doc ? calcDraftStatus(doc) : null;

  // ── Empty state: no story ──────────────────────────────────────────────────
  if (!selectedStory) {
    return (
      <EmptyState
        icon="📖"
        title="스토리가 선택되지 않았습니다."
        message="Story 페이지에서 스토리를 먼저 선택해주세요."
        actions={[
          { label: '← Story 페이지로', onClick: () => navigate('/story') },
        ]}
      />
    );
  }

  // ── Empty state: no flow plan AND no game flow design ─────────────────────
  if (!puzzleFlowPlan && !gameFlowDesign) {
    return (
      <EmptyState
        icon="🗺"
        title="게임 플로우가 없습니다."
        message="Game Flow 탭에서 플로우를 설계하고 'Draft로 보내기'를 눌러주세요."
        actions={[
          { label: '← Game Flow로', onClick: () => navigate('/puzzle-flow') },
        ]}
      />
    );
  }

  if (!doc || !status) return null;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">

      {/* ── Header ── */}
      <DraftHeader projectName={projectName} doc={doc} />

      {/* ── Main 2-col layout ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

        {/* Left: document body (scrollable) */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-3xl">
            <DraftOverviewSection doc={doc} />
            <DraftConceptSummary doc={doc} />
            <DraftStorySection doc={doc} />
            <DraftFlowSection doc={doc} />
            <DraftPuzzleSection doc={doc} />
            {gameFlowDesign && (
              <DraftGameFlowSection
                plan={gameFlowDesign}
                onUpdatePlan={setGameFlowDesign}
              />
            )}

            {/* Document footer */}
            <div className="mt-6 mb-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-micro font-bold uppercase tracking-widest text-white/15">
                XCAPE Internal · Theme Draft
              </span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>
          </div>
        </div>

        {/* Right: sidebar (fixed width, scrollable internally) */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col overflow-hidden">
          <DraftSidebar doc={doc} status={status} />
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <DraftDocumentActions doc={doc} />
    </div>
  );
}

// ── Empty state component ─────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  message,
  actions,
}: {
  icon: string;
  title: string;
  message: string;
  actions: { label: string; onClick: () => void }[];
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
      <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-body font-semibold text-white/70 mb-1">{title}</p>
        <p className="text-subhead text-white/35 leading-relaxed max-w-xs">{message}</p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
