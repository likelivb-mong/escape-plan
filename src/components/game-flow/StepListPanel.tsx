import type { GameFlowStep, StageLabel } from '../../types/gameFlow';
import { ProblemModeBadge, AnswerTypeBadge, StageBadge, RoomBadge } from './badges';

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

interface StepListPanelProps {
  steps: GameFlowStep[];
  rooms: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddStep?: (stageLabel: StageLabel) => void;
}

export default function StepListPanel({
  steps,
  rooms,
  selectedId,
  onSelect,
  onAddStep,
}: StepListPanelProps) {
  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    steps: steps.filter((s) => s.stageLabel === stage),
  })).filter((g) => g.steps.length > 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto border-r border-white/[0.06]">
      {grouped.map(({ stage, steps: stageSteps }) => (
        <div key={stage}>
          {/* Stage divider */}
          <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border-b border-white/[0.05]">
            <StageBadge label={stage} />
            <span className="text-micro text-white/30 font-medium">
              {stageSteps.length}개 스텝
            </span>
          </div>

          {/* Steps in stage */}
          {stageSteps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              rooms={rooms}
              isSelected={selectedId === step.id}
              onClick={() => onSelect(step.id)}
            />
          ))}

          {/* Add step button */}
          {onAddStep && (
            <button
              onClick={() => onAddStep(stage)}
              className="w-full px-3 py-2 text-caption text-white/35 hover:text-white/50 hover:bg-white/[0.03] transition-all duration-150 border-b border-white/[0.04] flex items-center justify-center gap-1"
            >
              <span className="text-subhead">+</span> 스텝 추가
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step Card (list item) ─────────────────────────────────────────────────────

function StepCard({
  step,
  rooms,
  isSelected,
  onClick,
}: {
  step: GameFlowStep;
  rooms: string[];
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2.5 border-b border-white/[0.04] transition-colors',
        isSelected
          ? 'bg-white/[0.07] border-l-2 border-l-white/30'
          : 'hover:bg-white/[0.03] border-l-2 border-l-transparent',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        {/* Step number */}
        <span className="text-micro text-white/30 font-mono mt-0.5 w-4 text-right flex-shrink-0">
          {String(step.stepNumber).padStart(2, '0')}
        </span>

        <div className="flex-1 min-w-0">
          {/* Room */}
          <div className="mb-1">
            <RoomBadge room={step.room} rooms={rooms} />
          </div>

          {/* Clue title */}
          <p className={[
            'text-footnote font-medium leading-snug truncate',
            isSelected ? 'text-white/90' : 'text-white/65',
          ].join(' ')}>
            {step.clueTitle}
          </p>

          {/* Mode + type badges */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <ProblemModeBadge mode={step.problemMode} size="xs" />
            <AnswerTypeBadge type={step.answerType} size="xs" />
          </div>
        </div>
      </div>
    </button>
  );
}
