import { useMemo } from 'react';
import type { ThemeStep } from '../types/passmap';
import { STATUS_COLORS, STEP_TYPE_ICONS } from '../types/passmap';

interface StepListPanelProps {
  steps: ThemeStep[];
  selectedStepId: string | null;
  onSelectStep: (step: ThemeStep) => void;
}

export default function StepListPanel({ steps, selectedStepId, onSelectStep }: StepListPanelProps) {
  const sorted = useMemo(
    () => [...steps].sort((a, b) => a.stepNumber - b.stepNumber),
    [steps],
  );

  // Group by zone preserving step order
  const zoneGroups = useMemo(() => {
    const groups: { zone: string; steps: ThemeStep[] }[] = [];
    let currentZone = '';
    for (const step of sorted) {
      const zone = step.zone || '';
      if (zone !== currentZone) {
        groups.push({ zone, steps: [step] });
        currentZone = zone;
      } else {
        groups[groups.length - 1].steps.push(step);
      }
    }
    return groups;
  }, [sorted]);

  const hasZones = sorted.some((s) => s.zone);

  return (
    <div className="flex flex-col gap-0 overflow-y-auto max-h-full pr-1">
      <div className="text-caption text-white/40 font-medium mb-2 px-2">STEPS ({steps.length})</div>

      {hasZones
        ? zoneGroups.map((group, gi) => (
            <div key={`${group.zone}-${gi}`}>
              {group.zone && (
                <div className="text-[9px] font-bold text-violet-400/40 tracking-wider uppercase px-3 pt-2 pb-1">
                  {group.zone}
                </div>
              )}
              {group.steps.map((step) => (
                <StepItem
                  key={step.id}
                  step={step}
                  isSelected={step.id === selectedStepId}
                  onSelect={onSelectStep}
                  showZone={false}
                />
              ))}
            </div>
          ))
        : sorted.map((step) => (
            <StepItem
              key={step.id}
              step={step}
              isSelected={step.id === selectedStepId}
              onSelect={onSelectStep}
              showZone
            />
          ))}
    </div>
  );
}

function StepItem({
  step,
  isSelected,
  onSelect,
  showZone,
}: {
  step: ThemeStep;
  isSelected: boolean;
  onSelect: (step: ThemeStep) => void;
  showZone: boolean;
}) {
  const color = STATUS_COLORS[step.status];
  const icon = STEP_TYPE_ICONS[step.type];

  return (
    <button
      onClick={() => onSelect(step)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm w-full
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
      {showZone && step.zone && (
        <span className="text-white/30 text-xs ml-auto flex-shrink-0">{step.zone}</span>
      )}
    </button>
  );
}
