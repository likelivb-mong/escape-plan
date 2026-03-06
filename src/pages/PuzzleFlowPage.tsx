import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { generatePuzzleFlowFromStory, regeneratePuzzleFlow } from '../utils/puzzleFlow';
import { generateGameFlowFromStory, regenerateGameFlow } from '../utils/gameFlow';
import type { PuzzleFlowPlan, PuzzleFlowStage } from '../types/puzzleFlow';
import type { GameFlowPlan } from '../types/gameFlow';

import PuzzleFlowTimeline from '../components/puzzle-flow/PuzzleFlowTimeline';
import PuzzleFlowSidebar from '../components/puzzle-flow/PuzzleFlowSidebar';
import SelectedStorySummary from '../components/puzzle-flow/SelectedStorySummary';
import GameFlowTab from '../components/game-flow/GameFlowTab';

type Tab = 'story' | 'game';

// ── Generic history state ─────────────────────────────────────────────────────
type HistOf<T> = { stack: T[]; idx: number };

function histPush<T>(h: HistOf<T>, item: T): HistOf<T> {
  const ns = h.stack.slice(0, h.idx + 1).concat(item);
  return { stack: ns, idx: ns.length - 1 };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PuzzleFlowPage() {
  const navigate = useNavigate();
  const {
    projectName, cells, selectedStory,
    setPuzzleFlowPlan, setGameFlowDesign,
  } = useProject();

  const [activeTab, setActiveTab] = useState<Tab>('story');

  // ── History stacks ───────────────────────────────────────────────────────────
  const [storyH, setStoryH] = useState<HistOf<PuzzleFlowPlan>>({ stack: [], idx: -1 });
  const [gameH,  setGameH]  = useState<HistOf<GameFlowPlan>>({ stack: [], idx: -1 });

  const storyPlan = storyH.idx >= 0 ? storyH.stack[storyH.idx] : null;
  const gamePlan  = gameH.idx  >= 0 ? gameH.stack[gameH.idx]   : null;

  const canUndoStory = storyH.idx > 0;
  const canRedoStory = storyH.idx < storyH.stack.length - 1;
  const canUndoGame  = gameH.idx > 0;
  const canRedoGame  = gameH.idx < gameH.stack.length - 1;

  const canUndo = activeTab === 'story' ? canUndoStory : canUndoGame;
  const canRedo = activeTab === 'story' ? canRedoStory : canRedoGame;

  const handleUndo = () => {
    if (activeTab === 'story') setStoryH(h => h.idx > 0 ? { ...h, idx: h.idx - 1 } : h);
    else                       setGameH(h  => h.idx > 0 ? { ...h, idx: h.idx - 1 } : h);
  };
  const handleRedo = () => {
    if (activeTab === 'story') setStoryH(h => h.idx < h.stack.length - 1 ? { ...h, idx: h.idx + 1 } : h);
    else                       setGameH(h  => h.idx < h.stack.length - 1 ? { ...h, idx: h.idx + 1 } : h);
  };

  // ── Generate both plans on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStory) return;
    setStoryH({ stack: [generatePuzzleFlowFromStory(selectedStory, cells, 0)], idx: 0 });
    setGameH ({ stack: [generateGameFlowFromStory(selectedStory)],             idx: 0 });
  }, [selectedStory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Regen story flow ─────────────────────────────────────────────────────────
  const [storyVariant, setStoryVariant] = useState(0);
  const [isRegenStory, setIsRegenStory] = useState(false);
  const [isRegenGame,  setIsRegenGame]  = useState(false);

  const handleRegenStory = async () => {
    if (!selectedStory || isRegenStory) return;
    setIsRegenStory(true);
    try {
      const next = await regeneratePuzzleFlow(selectedStory, cells, storyVariant);
      setStoryVariant(v => v + 1);
      setStoryH(h => histPush(h, next));
    } finally {
      setIsRegenStory(false);
    }
  };

  // ── Regen game flow ──────────────────────────────────────────────────────────
  const handleRegenGame = async () => {
    if (!selectedStory || isRegenGame) return;
    setIsRegenGame(true);
    try {
      const next = await regenerateGameFlow(selectedStory);
      setGameH(h => histPush(h, next));
    } finally {
      setIsRegenGame(false);
    }
  };

  // ── Stage edit (Story Flow) ──────────────────────────────────────────────────
  const handleUpdateStage = (stageId: string, updates: Partial<PuzzleFlowStage>) => {
    if (!storyPlan) return;
    const newStages = storyPlan.stages.map(s => s.id === stageId ? { ...s, ...updates } : s);
    const newPlan: PuzzleFlowPlan = {
      ...storyPlan,
      stages: newStages,
      totalPlayTime: newStages.reduce((sum, s) => sum + s.estimatedMinutes, 0),
      totalSuggestedPuzzleCount: newStages.reduce((sum, s) => sum + s.suggestedPuzzleSlots, 0),
    };
    setStoryH(h => histPush(h, newPlan));
  };

  // ── Game plan edit ───────────────────────────────────────────────────────────
  const handleUpdateGamePlan = (newPlan: GameFlowPlan) => {
    setGameH(h => histPush(h, newPlan));
  };

  // ── Tab switch ───────────────────────────────────────────────────────────────
  const switchTab = (tab: Tab) => {
    if (tab === 'game' && storyPlan) setPuzzleFlowPlan(storyPlan);
    setActiveTab(tab);
  };

  const handleContinueToGame = () => {
    if (storyPlan) {
      setPuzzleFlowPlan(storyPlan);
      setActiveTab('game');
    }
  };

  // ── Final save ───────────────────────────────────────────────────────────────
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    if (storyPlan) setPuzzleFlowPlan(storyPlan);
    if (gamePlan)  setGameFlowDesign(gamePlan);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!selectedStory) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-lg">
          📋
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/70 mb-1">스토리가 선택되지 않았습니다.</p>
          <p className="text-[12px] text-white/35 leading-relaxed">
            스토리 선택 후 만다라트를 먼저 완성해 주세요.
          </p>
        </div>
        <button
          onClick={() => navigate('/mandalart')}
          className="mt-2 px-4 py-2 rounded-full border border-white/[0.12] text-xs text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          ← 만다라트로
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/mandalart')}
            className="text-white/30 hover:text-white/60 transition-colors text-xs"
          >
            ← 만다라트
          </button>
          <span className="h-3.5 w-px bg-white/10" />
          <h1 className="text-sm font-semibold text-white/85">{projectName}</h1>
          <span className="h-3.5 w-px bg-white/10" />
          <span className="text-[11px] text-white/25 font-medium tracking-wide">
            Game Flow Design
          </span>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 p-0.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
          <TabButton active={activeTab === 'story'} onClick={() => switchTab('story')}>
            Story Flow
          </TabButton>
          <TabButton active={activeTab === 'game'} onClick={() => switchTab('game')}>
            Game Flow
          </TabButton>
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="실행 취소"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:text-white/65 hover:border-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed text-sm"
            >
              ↩
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="다시 실행"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:text-white/65 hover:border-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed text-sm"
            >
              ↪
            </button>
          </div>

          <span className="h-3.5 w-px bg-white/[0.08]" />

          {/* Save */}
          <button
            onClick={handleSave}
            className={[
              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border',
              saved
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
                : 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70',
            ].join(' ')}
          >
            {saved ? '✓ 저장됨' : '최종 저장'}
          </button>

          <span className="h-3.5 w-px bg-white/[0.08]" />

          <button
            onClick={() => navigate('/draft')}
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
          >
            Draft 보기 →
          </button>
        </div>
      </div>

      {/* ── Story summary strip ── */}
      <SelectedStorySummary story={selectedStory} />

      {/* ── Tab content ── */}
      {activeTab === 'story' ? (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex flex-1 gap-5 px-6 py-5 overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto min-w-0 pr-1">
              {storyPlan ? (
                <PuzzleFlowTimeline plan={storyPlan} onUpdateStage={handleUpdateStage} />
              ) : (
                <LoadingPlaceholder text="스토리 플로우 생성 중…" />
              )}
            </div>
            <div className="w-72 flex-shrink-0">
              {storyPlan && <PuzzleFlowSidebar plan={storyPlan} cells={cells} />}
            </div>
          </div>

          <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <button
              onClick={() => navigate('/mandalart')}
              className="text-[11px] text-white/35 hover:text-white/60 transition-colors"
            >
              ← Back to 만다라트
            </button>
            <button
              onClick={handleRegenStory}
              disabled={isRegenStory}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/[0.10] text-[11px] text-white/40 hover:border-white/20 hover:text-white/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isRegenStory ? (
                <><span className="w-3 h-3 border border-white/25 border-t-white/60 rounded-full animate-spin" /> 재생성 중…</>
              ) : (
                <>↺ Story Flow 재생성</>
              )}
            </button>
            <button
              disabled={!storyPlan}
              onClick={handleContinueToGame}
              className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Game Flow 설계 →
            </button>
          </div>
        </div>
      ) : (
        gamePlan ? (
          <GameFlowTab
            plan={gamePlan}
            isRegenerating={isRegenGame}
            onRegenerate={handleRegenGame}
            onUpdatePlan={handleUpdateGamePlan}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <LoadingPlaceholder text="게임 플로우 생성 중…" />
          </div>
        )
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-150',
        active ? 'bg-white text-black' : 'text-white/40 hover:text-white/65',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function LoadingPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32">
      <span className="text-[11px] text-white/25">{text}</span>
    </div>
  );
}
