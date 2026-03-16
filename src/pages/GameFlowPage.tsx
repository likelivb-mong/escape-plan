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
  } = useProject();

  const [gamePlan, setGamePlan] = useState<GameFlowPlan | null>(gameFlowDesign ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Auto-generate on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePlan) return; // Already has plan
    if (!selectedStory || !cells || cells.length === 0) return;

    const generate = async () => {
      setIsGenerating(true);
      try {
        const plan = await generateGameFlowFromMandala(selectedStory, cells);
        setGamePlan(plan);
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
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdatePlan = (newPlan: GameFlowPlan) => {
    setGamePlan(newPlan);
  };

  const handleAddStep = (stageLabel: StageLabel) => {
    if (!gamePlan) return;
    // Implementation for adding step
  };

  const handleSave = () => {
    if (gamePlan) {
      setGameFlowDesign(gamePlan);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              disabled
              title="준비 중"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:text-white/65 hover:border-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed text-body"
            >
              ↩
            </button>
            <button
              disabled
              title="준비 중"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:text-white/65 hover:border-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed text-body"
            >
              ↪
            </button>
          </div>

          <span className="h-3.5 w-px bg-white/10" />

          {/* Save */}
          <button
            onClick={handleSave}
            className={[
              'px-3 py-1.5 rounded-lg text-footnote font-medium transition-all duration-200 border',
              saved
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
                : 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70',
            ].join(' ')}
          >
            {saved ? '✓ 저장됨' : '저장'}
          </button>

          <span className="h-3.5 w-px bg-white/10" />

          <button
            onClick={() => navigate('/setting')}
            className="text-footnote text-white/35 hover:text-white/50 transition-colors"
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
