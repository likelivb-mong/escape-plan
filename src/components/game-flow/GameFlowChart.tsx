import { useState } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel } from '../../types/gameFlow';
import StepDetailDrawer from './StepDetailDrawer';
import { StageBadge } from './badges';

const STAGES: { label: StageLabel; title: string; color: string }[] = [
  { label: '기', title: '오프닝', color: 'from-red-500/20 to-red-500/5' },
  { label: '승', title: '전개', color: 'from-orange-500/20 to-orange-500/5' },
  { label: '전', title: '확장', color: 'from-yellow-500/20 to-yellow-500/5' },
  { label: '반전', title: '반전', color: 'from-purple-500/20 to-purple-500/5' },
  { label: '결', title: '엔딩', color: 'from-blue-500/20 to-blue-500/5' },
];

interface GameFlowChartProps {
  plan: GameFlowPlan;
  onUpdateStep?: (stepId: string, updates: Partial<GameFlowStep>) => void;
}

export default function GameFlowChart({ plan, onUpdateStep }: GameFlowChartProps) {
  const [selectedStep, setSelectedStep] = useState<GameFlowStep | null>(null);

  const stepsByStage = STAGES.map((stage) => ({
    ...stage,
    steps: plan.steps.filter((s) => s.stageLabel === stage.label),
  }));

  return (
    <>
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex gap-4 p-6 min-h-full" style={{ minWidth: 'fit-content' }}>
          {stepsByStage.map((stage) => (
            <div
              key={stage.label}
              className="flex-shrink-0 w-72 flex flex-col gap-3"
            >
              {/* Stage header */}
              <div className={`rounded-lg bg-gradient-to-br ${stage.color} border border-white/[0.06] p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <StageBadge label={stage.label} />
                  <span className="text-subhead font-semibold text-white/80">
                    {stage.title}
                  </span>
                </div>
                <p className="text-footnote text-white/35">
                  {stage.steps.length}개 스텝
                </p>
              </div>

              {/* Steps */}
              <div className="flex flex-col gap-3">
                {stage.steps.length > 0 ? (
                  stage.steps.map((step, idx) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      index={idx + 1}
                      onSelect={() => setSelectedStep(step)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-footnote text-white/20">
                    스텝 없음
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step detail drawer */}
      {selectedStep && (
        <StepDetailDrawer
          step={selectedStep}
          rooms={plan.rooms}
          totalSteps={plan.steps.length}
          onClose={() => setSelectedStep(null)}
          onUpdateStep={
            onUpdateStep ? (updates) => onUpdateStep(selectedStep.id, updates) : undefined
          }
        />
      )}
    </>
  );
}

// ── Step Card ────────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  onSelect,
}: {
  step: GameFlowStep;
  index: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group relative rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all p-3 text-left"
    >
      {/* Step number */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-micro font-mono text-white/25">STEP {String(step.stepNumber).padStart(2, '0')}</span>
        <span className="text-caption text-white/35">·</span>
        <span className="text-caption text-white/35">{step.room}</span>
      </div>

      {/* Title */}
      <p className="text-footnote font-semibold text-white/80 line-clamp-2 mb-2 group-hover:text-white transition-colors">
        {step.clueTitle}
      </p>

      {/* Tags */}
      <div className="flex gap-1 flex-wrap">
        <span className="text-micro px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
          {step.problemMode === 'clue' && '단서'}
          {step.problemMode === 'device' && '장치'}
          {step.problemMode === 'clue_device' && '단서+장치'}
        </span>
        <span className="text-micro px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
          {step.answerType === 'key' && '열쇠'}
          {step.answerType === 'number_4' && '숫자'}
          {step.answerType === 'xkit' && 'X-KIT'}
          {step.answerType === 'auto' && '자동'}
          {step.answerType?.startsWith('number') && '숫자'}
          {step.answerType?.startsWith('alphabet') && '알파벳'}
        </span>
      </div>

      {/* Hint indicator */}
      {step.hint && (
        <div className="mt-2 pt-2 border-t border-white/[0.05]">
          <p className="text-caption text-white/30 italic line-clamp-1">
            💡 {step.hint}
          </p>
        </div>
      )}
    </button>
  );
}
