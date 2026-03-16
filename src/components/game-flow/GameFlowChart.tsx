import { useState, useRef } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel, ProblemMode, AnswerType } from '../../types/gameFlow';
import StepDetailDrawer from './StepDetailDrawer';
import { StageBadge } from './badges';

const STAGES: { label: StageLabel; title: string; accent: string; border: string }[] = [
  { label: '기', title: '오프닝',  accent: 'text-red-400/70',    border: 'border-red-500/20' },
  { label: '승', title: '전개',    accent: 'text-orange-400/70', border: 'border-orange-500/20' },
  { label: '전', title: '확장',    accent: 'text-yellow-400/70', border: 'border-yellow-500/20' },
  { label: '반전', title: '반전',  accent: 'text-purple-400/70', border: 'border-purple-500/20' },
  { label: '결', title: '엔딩',    accent: 'text-sky-400/70',    border: 'border-sky-500/20' },
];

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

const MODE_LABEL: Record<string, string> = {
  clue: '단서', device: '장치', clue_device: '단서+장치',
};
const ANSWER_LABEL: Record<string, string> = {
  key: '열쇠', number_4: '4자리', number_3: '3자리',
  alphabet_5: '알파벳', keypad: '키패드', xkit: 'X-KIT', auto: '자동',
};

interface GameFlowChartProps {
  plan: GameFlowPlan;
  onUpdateStep?: (stepId: string, updates: Partial<GameFlowStep>) => void;
  onAddStep?: (stageLabel: StageLabel) => void;
  onDeleteStep?: (stepId: string) => void;
  onReorderSteps?: (stepId: string, newStage: StageLabel, insertIndex: number) => void;
}

export default function GameFlowChart({
  plan,
  onUpdateStep,
  onAddStep,
  onDeleteStep,
  onReorderSteps,
}: GameFlowChartProps) {
  const [selectedStep, setSelectedStep] = useState<GameFlowStep | null>(null);

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
    // Determine insert index from mouse Y vs each card
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

  // sync selectedStep when plan updates
  const syncedSelected = selectedStep
    ? plan.steps.find((s) => s.id === selectedStep.id) ?? null
    : null;

  return (
    <>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-5 h-full" style={{ minWidth: 'max-content' }}>
          {stepsByStage.map((stage) => {
            const isOver = dropTarget?.stage === stage.label;

            return (
              <div
                key={stage.label}
                className={`flex-shrink-0 w-64 flex flex-col rounded-xl border transition-all duration-150 ${
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
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.05] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <StageBadge label={stage.label} />
                    <span className="text-subhead font-semibold text-white/70">{stage.title}</span>
                  </div>
                  <span className={`text-caption font-mono font-bold ${stage.accent}`}>
                    {stage.steps.length}
                  </span>
                </div>

                {/* Steps list */}
                <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 min-h-[120px]">
                  {stage.steps.map((step, idx) => {
                    const isDragging = draggingId === step.id;
                    const showTopLine = isOver && dropTarget?.index === idx;
                    const showBottomLine = isOver && dropTarget?.index === stage.steps.length && idx === stage.steps.length - 1;

                    return (
                      <div key={step.id} data-step-card>
                        {/* Drop indicator (top) */}
                        {showTopLine && draggingId !== step.id && (
                          <div className={`h-0.5 rounded-full mb-1.5 ${stage.accent.replace('text-', 'bg-').replace('/70', '/60')}`} />
                        )}

                        <StepCard
                          step={step}
                          isDragging={isDragging}
                          onSelect={() => setSelectedStep(step)}
                          onDelete={onDeleteStep ? () => onDeleteStep(step.id) : undefined}
                          onDragStart={(e) => handleDragStart(e, step.id)}
                          onDragEnd={handleDragEnd}
                        />

                        {/* Drop indicator (bottom of last) */}
                        {showBottomLine && (
                          <div className={`h-0.5 rounded-full mt-1.5 ${stage.accent.replace('text-', 'bg-').replace('/70', '/60')}`} />
                        )}
                      </div>
                    );
                  })}

                  {/* Drop indicator when column is empty or at end */}
                  {isOver && dropTarget?.index === 0 && stage.steps.length === 0 && (
                    <div className={`h-0.5 rounded-full ${stage.accent.replace('text-', 'bg-').replace('/70', '/60')}`} />
                  )}

                  {/* Empty state */}
                  {stage.steps.length === 0 && !isOver && (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-caption text-white/15">스텝 없음</p>
                    </div>
                  )}
                </div>

                {/* Add step button */}
                {onAddStep && (
                  <div className="p-2 border-t border-white/[0.04] flex-shrink-0">
                    <button
                      onClick={() => onAddStep(stage.label)}
                      className="w-full py-1.5 rounded-lg text-caption text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-1"
                    >
                      <span className="text-base leading-none">+</span>
                      <span>스텝 추가</span>
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
  onDragStart,
  onDragEnd,
}: {
  step: GameFlowStep;
  isDragging: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative rounded-lg border bg-white/[0.02] text-left transition-all select-none ${
        isDragging
          ? 'opacity-30 border-white/[0.05]'
          : 'border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.045] cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Drag handle + step meta */}
      <div className="flex items-start gap-2 px-3 pt-2.5 pb-1">
        {/* Drag grip */}
        <span className="text-white/15 group-hover:text-white/30 transition-colors mt-0.5 flex-shrink-0 text-xs leading-none">
          ⠿
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-mono text-white/20">
              {String(step.stepNumber).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-white/20">·</span>
            <span className="text-[10px] text-white/30 truncate">{step.room}</span>
          </div>
          <p
            className="text-footnote font-medium text-white/75 line-clamp-2 leading-snug cursor-pointer hover:text-white transition-colors"
            onClick={onSelect}
          >
            {step.clueTitle}
          </p>
        </div>

        {/* Delete button (hover only) */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-white/25 hover:text-red-400/70 hover:bg-red-500/10 transition-all text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="flex gap-1 px-3 pb-2.5 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/30">
          {MODE_LABEL[step.problemMode] ?? step.problemMode}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/30">
          {ANSWER_LABEL[step.answerType] ?? step.answerType}
        </span>
      </div>
    </div>
  );
}
