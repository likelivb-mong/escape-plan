import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { generateGameFlowFromMandala, regenerateGameFlow } from '../utils/gameFlow';
import type { GameFlowPlan, StageLabel } from '../types/gameFlow';
import GameFlowTab from '../components/game-flow/GameFlowTab';

export default function GameFlowPage() {
  const navigate = useNavigate();
  const {
    projectName,
    cells,
    selectedStory,
    gameFlowDesign,
    setGameFlowDesign,
    saveCurrentProject,
  } = useProject();

  // ── Temporary state (editing) vs. saved state ──────────────────────────────────
  const [gamePlan, setGamePlan] = useState<GameFlowPlan | null>(gameFlowDesign ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Auto-generate on mount (if no plan exists) ─────────────────────────────────
  useEffect(() => {
    if (gamePlan) return; // Already has plan
    if (!selectedStory || !cells || cells.length === 0) return;

    const generate = async () => {
      setIsGenerating(true);
      try {
        const plan = await generateGameFlowFromMandala(selectedStory, cells);
        setGamePlan(plan);
        setHasChanges(false);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [selectedStory, cells, gamePlan]);

  const handleRegenerate = async () => {
    if (!selectedStory || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const plan = await regenerateGameFlow(selectedStory, cells);
      setGamePlan(plan);
      setHasChanges(true); // Mark as changed since user regenerated
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdatePlan = (newPlan: GameFlowPlan) => {
    setGamePlan(newPlan);
    setHasChanges(true); // Mark as changed when user edits
  };

  const handleAddStep = (stageLabel: StageLabel) => {
    if (!gamePlan) return;
    // Implementation for adding step
  };

  const handleSave = () => {
    if (gamePlan) {
      setGameFlowDesign(gamePlan);
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        saveCurrentProject();
      }, 300);
    }
  };

  const handleGoToSetting = () => {
    if (gamePlan) {
      setGameFlowDesign(gamePlan);
      setHasChanges(false);
      setTimeout(() => saveCurrentProject(), 0);
    }
    navigate('/setting');
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!selectedStory) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
          🎮
        </div>
        <div className="text-center">
          <p className="text-body font-semibold text-white/70 mb-1">스토리가 선택되지 않았습니다.</p>
          <p className="text-subhead text-white/35 leading-relaxed">
            만다라트를 먼저 완성한 후 와주세요.
          </p>
        </div>
        <button
          onClick={() => navigate('/mandalart')}
          className="mt-2 px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          ← 만다라트로
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/mandalart')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead"
          >
            ← Mandala Chart
          </button>
          <span className="h-3.5 w-px bg-white/10" />
          <h1 className="text-body font-semibold text-white/85">{projectName}</h1>
          <span className="h-3.5 w-px bg-white/10" />
          <span className="text-footnote text-white/35 font-medium tracking-wide">
            Game Flow
          </span>
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2">
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={[
              'px-3 py-1.5 rounded-lg text-footnote font-medium transition-all duration-200 border',
              saved
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
                : hasChanges
                ? 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70'
                : 'border-white/[0.08] text-white/25 cursor-not-allowed',
            ].join(' ')}
          >
            {saved ? '✓ 저장됨' : hasChanges ? '저장' : '저장됨'}
          </button>

          <button
            onClick={handleGoToSetting}
            className="px-4 py-1.5 rounded-lg bg-white text-black text-footnote font-semibold hover:bg-white/90 transition-colors"
          >
            Setting →
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {isGenerating ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <p className="text-footnote text-white/35">Game Flow를 AI로 생성 중...</p>
          </div>
        </div>
      ) : gamePlan ? (
        <GameFlowTab
          plan={gamePlan}
          isRegenerating={isRegenerating}
          onRegenerate={handleRegenerate}
          onUpdatePlan={handleUpdatePlan}
          onAddStep={handleAddStep}
        />
      ) : null}
    </div>
  );
}
