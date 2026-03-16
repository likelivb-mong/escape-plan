import type { ThemeStep } from '../types/passmap';
import { STATUS_COLORS, STEP_TYPE_ICONS } from '../types/passmap';

interface FlowPanelProps {
  steps: ThemeStep[];
  selectedStepId: string | null;
  onSelectStep: (step: ThemeStep) => void;
}

export default function FlowPanel({ steps, selectedStepId, onSelectStep }: FlowPanelProps) {
  const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="flex flex-col gap-0 px-4">
      <div className="text-caption text-white/40 font-medium mb-4">FLOW ORDER</div>
      {sorted.map((step, idx) => {
        const color = STATUS_COLORS[step.status];
        const icon = STEP_TYPE_ICONS[step.type];
        const isSelected = step.id === selectedStepId;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={step.id} className="flex gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 transition-all ${
                  isSelected ? 'scale-110' : ''
                }`}
                style={{
                  borderColor: color,
                  backgroundColor: `${color}22`,
                  color,
                }}
              >
                {step.stepNumber}
              </div>
              {!isLast && (
                <div className="w-0.5 h-8 bg-white/10" />
              )}
            </div>

            {/* Step info */}
            <button
              onClick={() => onSelectStep(step)}
              className={`flex-1 pb-4 text-left transition-all rounded-lg px-3 py-1.5 -mt-1 ${
                isSelected ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span style={{ color }}>{icon}</span>
                <span className="text-white/90 text-sm font-medium">{step.label}</span>
                <span className="text-white/30 text-xs">{step.zone}</span>
              </div>
              <div className="text-white/30 text-xs mt-0.5">
                위치: ({step.x}, {step.y})
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
