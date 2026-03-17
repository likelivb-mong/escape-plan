import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { generateGameFlowFromMandala, regenerateGameFlow } from '../utils/gameFlow';
import type { GameFlowPlan } from '../types/gameFlow';
import GameFlowTab from '../components/game-flow/GameFlowTab';
import GameFlowStepsView from '../components/game-flow/GameFlowStepsView';
import GameFlowSummaryView from '../components/game-flow/GameFlowSummaryView';
import WorkflowStepBar from '../components/layout/WorkflowStepBar';

type SubTab = 'chart' | 'steps' | 'summary';

export default function GameFlowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    projectName,
    cells,
    selectedStory,
    gameFlowDesign,
    setGameFlowDesign,
    persistProject,
    saveVersion,
  } = useProject();

  const [gamePlan, setGamePlan] = useState<GameFlowPlan | null>(gameFlowDesign ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<SubTab>('chart');
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const applyHandled = useRef(false);

  // ── Generate from previous page if applyFromPrev ───────────────────────────
  useEffect(() => {
    if (applyHandled.current) return;
    const applyFromPrev = (location.state as { applyFromPrev?: boolean } | null)?.applyFromPrev;

    if (applyFromPrev && selectedStory && cells?.length > 0) {
      applyHandled.current = true;
      // Clear navigation state
      window.history.replaceState({}, '');

      const generate = async () => {
        setIsGenerating(true);
        try {
          const plan = await generateGameFlowFromMandala(selectedStory, cells);
          setGamePlan(plan);
          setHasChanges(true);
        } finally {
          setIsGenerating(false);
        }
      };
      generate();
      return;
    }

    // If no apply flag and no existing plan, auto-generate once
    if (!gamePlan && selectedStory && cells?.length > 0) {
      applyHandled.current = true;
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
    }
  }, [location.state, selectedStory, cells, gamePlan]);

  const handleRegenerate = async () => {
    if (!selectedStory || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const plan = await regenerateGameFlow(selectedStory, cells);
      setGamePlan(plan);
      setHasChanges(true);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdatePlan = (newPlan: GameFlowPlan) => {
    setGamePlan(newPlan);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (gamePlan) {
      setGameFlowDesign(gamePlan);
      setHasChanges(false);
      const v = saveVersion('gameFlow');
      setSavedLabel(`v${v} 저장됨`);
      setTimeout(() => setSavedLabel(null), 2000);
    }
  };

  const handleGoToSetting = () => {
    setShowApplyDialog(true);
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!selectedStory) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-5 px-6">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl">
          🎮
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white/80 mb-1.5">스토리가 선택되지 않았습니다</p>
          <p className="text-sm text-white/35 leading-relaxed max-w-xs">
            만다라트를 먼저 완성한 후 Game Flow를 생성할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/mandalart')}
          className="mt-1 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-sm text-white/60 hover:bg-white/[0.10] hover:text-white/80 transition-all"
        >
          ← 만다라트로 이동
        </button>
      </div>
    );
  }

  const SUB_TABS: { key: SubTab; label: string; icon: string }[] = [
    { key: 'chart', label: 'Chart', icon: '◫' },
    { key: 'steps', label: 'Steps', icon: '☰' },
    { key: 'summary', label: 'Summary', icon: '◉' },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-white/[0.06] flex-shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => navigate('/mandalart')}
            className="text-white/30 hover:text-white/60 transition-colors text-sm flex-shrink-0"
          >
            <span className="hidden sm:inline">← Mandala</span>
            <span className="sm:hidden">←</span>
          </button>
          <span className="h-3.5 w-px bg-white/[0.08] flex-shrink-0" />
          <h1 className="text-[15px] font-semibold text-white/90 truncate">{projectName}</h1>
          <span className="hidden sm:inline text-xs text-white/25 font-medium tracking-wide flex-shrink-0">
            Game Flow
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={!hasChanges && !savedLabel}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              savedLabel
                ? 'bg-emerald-500/15 text-emerald-400/90 border border-emerald-500/25'
                : hasChanges
                ? 'bg-white/[0.06] text-white/60 border border-white/[0.10] hover:bg-white/[0.10] hover:text-white/80'
                : 'bg-white/[0.03] text-white/20 border border-white/[0.06] cursor-not-allowed'
            }`}
          >
            {savedLabel ?? (hasChanges ? '저장' : '저장됨')}
          </button>

          <button
            onClick={handleGoToSetting}
            className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            Pass Map →
          </button>
        </div>
      </div>

      {/* Workflow step bar */}
      <WorkflowStepBar onBeforeNavigate={handleSave} />

      {/* ── Sub-tab bar ── */}
      {gamePlan && !isGenerating && (
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5 border-b border-white/[0.05] flex-shrink-0">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <span className="hidden sm:inline text-[10px] opacity-60">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-white/25">
            <span>{gamePlan.steps.length} steps</span>
            <span className="w-px h-3 bg-white/[0.08]" />
            <span>{gamePlan.rooms.length} rooms</span>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isGenerating ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="w-10 h-10 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-sm text-white/50 mb-1">Game Flow 생성 중</p>
              <p className="text-xs text-white/25">AI가 스토리를 분석하고 있습니다...</p>
            </div>
          </div>
        </div>
      ) : gamePlan ? (
        <>
          {activeTab === 'chart' && (
            <GameFlowTab
              plan={gamePlan}
              isRegenerating={isRegenerating}
              onRegenerate={handleRegenerate}
              onUpdatePlan={handleUpdatePlan}
            />
          )}
          {activeTab === 'steps' && (
            <GameFlowStepsView
              plan={gamePlan}
              onUpdatePlan={handleUpdatePlan}
            />
          )}
          {activeTab === 'summary' && (
            <GameFlowSummaryView plan={gamePlan} />
          )}
        </>
      ) : null}

      {/* ── Apply Confirm Dialog ── */}
      {showApplyDialog && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowApplyDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] border border-white/[0.10] rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-[15px] font-semibold text-white/90 mb-2">
                Pass Map에 반영하시겠습니까?
              </h3>
              <p className="text-[13px] text-white/40 leading-relaxed mb-1">
                Game Flow의 룸 구성을 기반으로 배치도를 AI가 새로 생성합니다.
              </p>
              <p className="text-[11px] text-white/25 mb-5">
                기존 Pass Map 데이터가 있으면 새로 대체됩니다.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (gamePlan) {
                      setGameFlowDesign(gamePlan);
                      setHasChanges(false);
                    }
                    persistProject();
                    navigate('/setting', { state: { applyFromPrev: true } });
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
                >
                  Game Flow → Pass Map 반영하기
                </button>
                <button
                  onClick={() => {
                    if (gamePlan) {
                      setGameFlowDesign(gamePlan);
                      setHasChanges(false);
                    }
                    persistProject();
                    navigate('/setting');
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/[0.10] text-[13px] font-medium text-white/50 hover:text-white/70 hover:border-white/20 transition-all"
                >
                  반영 없이 이동
                </button>
                <button
                  onClick={() => setShowApplyDialog(false)}
                  className="w-full py-2 text-[12px] text-white/25 hover:text-white/45 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
