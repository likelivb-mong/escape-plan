import { useState, useRef, useMemo } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel, ProblemMode, AnswerType } from '../../types/gameFlow';
import type { MandalartCellData } from '../../types/mandalart';
import StepDetailDrawer from './StepDetailDrawer';
import { StageBadge } from './badges';
import { TechSettingsBar } from './TechSettings';

const STAGES: { label: StageLabel; title: string; accent: string; accentBg: string; border: string }[] = [
  { label: '기', title: '오프닝',  accent: 'text-red-400',    accentBg: 'bg-red-500/10',    border: 'border-red-500/20' },
  { label: '승', title: '전개',    accent: 'text-orange-400', accentBg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { label: '전', title: '확장',    accent: 'text-yellow-400', accentBg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { label: '반전', title: '반전',  accent: 'text-purple-400', accentBg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { label: '결', title: '엔딩',    accent: 'text-sky-400',    accentBg: 'bg-sky-500/10',    border: 'border-sky-500/20' },
];

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

// ── Sub-goal config (mirrors mandalartFromStory.ts) ─────────────────────────
const SUB_GOALS = [
  { label: '분위기', row: 3, col: 3, theme: 'rose' },
  { label: '스토리', row: 3, col: 4, theme: 'rose' },
  { label: '퍼즐',   row: 3, col: 5, theme: 'sky' },
  { label: '인물',   row: 4, col: 3, theme: 'rose' },
  { label: '단서',   row: 4, col: 5, theme: 'amber' },
  { label: '장치',   row: 5, col: 3, theme: 'sky' },
  { label: '공간',   row: 5, col: 4, theme: 'rose' },
  { label: '반전',   row: 5, col: 5, theme: 'amber' },
] as const;

const GOAL_THEME_CLASS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  rose:  { bg: 'bg-rose-500/[0.06]',  border: 'border-rose-500/15',  text: 'text-rose-300/80',  dot: 'bg-rose-400/60' },
  sky:   { bg: 'bg-sky-500/[0.06]',   border: 'border-sky-500/15',   text: 'text-sky-300/80',   dot: 'bg-sky-400/60' },
  amber: { bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/15', text: 'text-amber-300/80', dot: 'bg-amber-400/60' },
};


interface GameFlowChartProps {
  plan: GameFlowPlan;
  cells?: MandalartCellData[];
  onUpdateStep?: (stepId: string, updates: Partial<GameFlowStep>) => void;
  onAddStep?: (stageLabel: StageLabel) => void;
  onDeleteStep?: (stepId: string) => void;
  onReorderSteps?: (stepId: string, newStage: StageLabel, insertIndex: number) => void;
}

export default function GameFlowChart({
  plan,
  cells,
  onUpdateStep,
  onAddStep,
  onDeleteStep,
  onReorderSteps,
}: GameFlowChartProps) {
  const [selectedStep, setSelectedStep] = useState<GameFlowStep | null>(null);
  const [showGoals, setShowGoals] = useState(false);

  // ── Extract mandalart sub-goals ──
  const subGoals = useMemo(() => {
    if (!cells?.length) return [];
    return SUB_GOALS.map((g) => {
      const cell = cells.find((c) => c.row === g.row && c.col === g.col);
      const text = cell?.text || g.label;
      const matchCount = plan.steps.filter((s) =>
        s.clueTags?.some((t) => t.includes(g.label) || g.label.includes(t)) ||
        s.clueTitle?.includes(g.label) ||
        (g.label === '장치' && (s.problemMode === 'device' || s.problemMode === 'clue_device')) ||
        (g.label === '반전' && s.stageLabel === '반전')
      ).length;
      return { ...g, text, matchCount };
    });
  }, [cells, plan.steps]);

  // ── Drag state ──────────────────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ stage: StageLabel; index: number } | null>(null);
  const dragCounter = useRef(0);

  const stepsByStage = STAGES.map((stage) => ({
    ...stage,
    steps: plan.steps.filter((s) => s.stageLabel === stage.label),
  }));

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggingId(stepId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', stepId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
    dragCounter.current = 0;
  };

  const handleColumnDragOver = (e: React.DragEvent, stage: StageLabel, stageSteps: GameFlowStep[]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const el = e.currentTarget as HTMLElement;
    const cards = Array.from(el.querySelectorAll('[data-step-card]'));
    let insertIndex = stageSteps.length;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        insertIndex = i;
        break;
      }
    }
    setDropTarget({ stage, index: insertIndex });
  };

  const handleColumnDrop = (e: React.DragEvent, stage: StageLabel) => {
    e.preventDefault();
    const stepId = e.dataTransfer.getData('text/plain');
    if (!stepId || !onReorderSteps || !dropTarget) return;
    onReorderSteps(stepId, stage, dropTarget.index);
    setDraggingId(null);
    setDropTarget(null);
  };

  const syncedSelected = selectedStep
    ? plan.steps.find((s) => s.id === selectedStep.id) ?? null
    : null;

  return (
    <>
      {/* ── Mandalart Sub-Goals Panel ── */}
      {subGoals.length > 0 && (
        <div className="px-5 pt-3 pb-0 flex-shrink-0">
          <button
            onClick={() => setShowGoals(!showGoals)}
            className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/60 transition-colors mb-2"
          >
            <svg className={`w-3 h-3 transition-transform ${showGoals ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold tracking-wide">MANDALART GOALS</span>
            <span className="text-white/20 font-mono">{subGoals.length}</span>
          </button>
          {showGoals && (
            <div className="flex items-center gap-2 flex-wrap pb-3">
              {subGoals.map((g) => {
                const tc = GOAL_THEME_CLASS[g.theme] ?? GOAL_THEME_CLASS.rose;
                return (
                  <div
                    key={g.label}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tc.bg} ${tc.border}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                    <span className={`text-[11px] font-medium ${tc.text}`}>{g.text}</span>
                    {g.matchCount > 0 && (
                      <span className="text-[10px] font-mono text-white/35 tabular-nums">
                        {g.matchCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: 'max-content' }}>
          {stepsByStage.map((stage) => {
            const isOver = dropTarget?.stage === stage.label;

            return (
              <div
                key={stage.label}
                className={`flex-shrink-0 w-[260px] flex flex-col rounded-xl border transition-all duration-150 ${
                  isOver
                    ? `${stage.border} bg-white/[0.03]`
                    : 'border-white/[0.06] bg-white/[0.015]'
                }`}
                onDragOver={(e) => handleColumnDragOver(e, stage.label, stage.steps)}
                onDragLeave={() => {
                  dragCounter.current--;
                  if (dragCounter.current <= 0) setDropTarget(null);
                }}
                onDragEnter={() => { dragCounter.current++; }}
                onDrop={(e) => handleColumnDrop(e, stage.label)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.06] flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <StageBadge label={stage.label} />
                    <span className="text-[13px] font-semibold text-white/80 tracking-tight">{stage.title}</span>
                  </div>
                  <span className={`text-[13px] font-mono font-bold tabular-nums ${stage.accent}`}>
                    {stage.steps.length}
                  </span>
                </div>

                {/* Steps list */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-[120px]">
                  {stage.steps.map((step, idx) => {
                    const isDragging = draggingId === step.id;
                    const showTopLine = isOver && dropTarget?.index === idx;
                    const showBottomLine = isOver && dropTarget?.index === stage.steps.length && idx === stage.steps.length - 1;

                    return (
                      <div key={step.id} data-step-card>
                        {showTopLine && draggingId !== step.id && (
                          <div className={`h-0.5 rounded-full mb-1 ${stage.accent.replace('text-', 'bg-')}`} />
                        )}

                        <StepCard
                          step={step}
                          isDragging={isDragging}
                          onSelect={() => setSelectedStep(step)}
                          onDelete={onDeleteStep ? () => onDeleteStep(step.id) : undefined}
                          onUpdate={onUpdateStep ? (updates) => onUpdateStep(step.id, updates) : undefined}
                          onDragStart={(e) => handleDragStart(e, step.id)}
                          onDragEnd={handleDragEnd}
                        />

                        {showBottomLine && (
                          <div className={`h-0.5 rounded-full mt-1 ${stage.accent.replace('text-', 'bg-')}`} />
                        )}
                      </div>
                    );
                  })}

                  {isOver && dropTarget?.index === 0 && stage.steps.length === 0 && (
                    <div className={`h-0.5 rounded-full ${stage.accent.replace('text-', 'bg-')}`} />
                  )}

                  {stage.steps.length === 0 && !isOver && (
                    <div className="flex-1 flex items-center justify-center py-8">
                      <p className="text-[11px] text-white/20">스텝 없음</p>
                    </div>
                  )}
                </div>

                {/* Add step button */}
                {onAddStep && (
                  <div className="p-2 border-t border-white/[0.05] flex-shrink-0">
                    <button
                      onClick={() => onAddStep(stage.label)}
                      className="w-full py-1.5 rounded-lg text-[11px] text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-1"
                    >
                      <span className="text-sm leading-none">+</span>
                      <span>추가</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step detail drawer */}
      {syncedSelected && (
        <StepDetailDrawer
          step={syncedSelected}
          rooms={plan.rooms}
          totalSteps={plan.steps.length}
          onClose={() => setSelectedStep(null)}
          onUpdateStep={
            onUpdateStep
              ? (updates) => onUpdateStep(syncedSelected.id, updates)
              : undefined
          }
        />
      )}
    </>
  );
}

// ── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({
  step,
  isDragging,
  onSelect,
  onDelete,
  onUpdate,
  onDragStart,
  onDragEnd,
}: {
  step: GameFlowStep;
  isDragging: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<GameFlowStep>) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const hasDescription = !!(step.description || step.puzzleSetup);
  const hasAnswer = !!step.answer;
  const previewText = step.description || step.puzzleSetup || '';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`group relative rounded-lg border text-left transition-all select-none ${
        isDragging
          ? 'opacity-30 border-white/[0.05] bg-white/[0.01]'
          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.05] cursor-pointer active:cursor-grabbing'
      }`}
    >
      {/* Header: step number + room */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-semibold text-white/35 tabular-nums">
            {String(step.stepNumber).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-white/20">|</span>
          <span className="text-[10px] text-white/35 truncate max-w-[110px]">{step.room}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-white/15 group-hover:text-white/30 transition-colors text-[10px] leading-none">
            ⠿
          </span>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-[13px] font-semibold text-white/85 leading-snug line-clamp-2 px-3 pt-1 pb-1.5">
        {step.clueTitle}
      </p>

      {/* Description preview */}
      {hasDescription && (
        <p className="text-[11px] text-white/35 line-clamp-1 leading-relaxed px-3 pb-1.5">
          {previewText}
        </p>
      )}

      {/* Answer */}
      {hasAnswer && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-md bg-white/[0.05] border border-white/[0.10]">
          <span className="text-[11px] font-mono font-bold text-white/75 tracking-wide">
            {step.answer}
          </span>
        </div>
      )}

      {/* Tags row: [방식|입력] ▸ [출력] — editable inline */}
      <div className="px-3 pb-2.5">
        <TechSettingsBar
          problemMode={step.problemMode}
          answerType={step.answerType}
          output={step.output}
          onChangeMode={onUpdate ? (v) => onUpdate({ problemMode: v as GameFlowStep['problemMode'] }) : undefined}
          onChangeAnswer={onUpdate ? (v) => onUpdate({ answerType: v as GameFlowStep['answerType'] }) : undefined}
          onChangeOutput={onUpdate ? (v) => onUpdate({ output: v as GameFlowStep['output'] }) : undefined}
          compact
        />
      </div>
    </div>
  );
}
