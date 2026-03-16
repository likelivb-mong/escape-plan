import type { ThemeStep } from '../types/passmap';
import { STATUS_COLORS, STEP_TYPE_ICONS } from '../types/passmap';

interface StepListPanelProps {
  steps: ThemeStep[];
  selectedStepId: string | null;
  onSelectStep: (step: ThemeStep) => void;
}

export default function StepListPanel({ steps, selectedStepId, onSelectStep }: StepListPanelProps) {
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-full pr-1">
      <div className="text-caption text-white/40 font-medium mb-2 px-2">STEPS ({steps.length})</div>
      {sorted.map((step) => {
        const isSelected = step.id === selectedStepId;
        const color = STATUS_COLORS[step.status];
        const icon = STEP_TYPE_ICONS[step.type];

        return (
          <button
            key={step.id}
            onClick={() => onSelectStep(step)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm
              ${isSelected ? 'bg-white/15 border border-white/20' : 'hover:bg-white/5 border border-transparent'}
            `}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span style={{ color }}>{icon}</span>
            <span className="text-white/60 font-mono text-xs w-5">{step.stepNumber}</span>
            <span className="text-white/90 truncate">{step.label}</span>
            <span className="text-white/30 text-xs ml-auto flex-shrink-0">{step.zone}</span>
          </button>
        );
      })}
    </div>
  );
}
