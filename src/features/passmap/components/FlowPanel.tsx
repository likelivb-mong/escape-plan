import { useMemo } from 'react';
import type { ThemeStep } from '../types/passmap';
import { STATUS_COLORS, STEP_TYPE_ICONS } from '../types/passmap';

interface FlowPanelProps {
  steps: ThemeStep[];
  selectedStepId: string | null;
  onSelectStep: (step: ThemeStep) => void;
}

export default function FlowPanel({ steps, selectedStepId, onSelectStep }: FlowPanelProps) {
  const sorted = useMemo(
    () => [...steps].sort((a, b) => a.stepNumber - b.stepNumber),
    [steps],
  );

  // Group steps by zone, preserving step order
  const zoneGroups = useMemo(() => {
    const groups: { zone: string; steps: ThemeStep[] }[] = [];
    let currentZone = '';

    for (const step of sorted) {
      const zone = step.zone || '(미지정)';
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
    <div className="flex flex-col gap-0 px-2">
      <div className="text-caption text-white/40 font-medium mb-4 px-2">FLOW ORDER</div>

      {hasZones
        ? zoneGroups.map((group, gi) => (
            <div key={`${group.zone}-${gi}`} className="mb-1">
              {/* Zone header */}
              <div className="flex items-center gap-2 mb-2 mt-1">
                <div className="h-px flex-1 bg-gradient-to-r from-violet-500/20 to-transparent" />
                <span className="text-[10px] font-bold text-violet-400/50 tracking-widest uppercase whitespace-nowrap px-1">
                  {group.zone}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-violet-500/20 to-transparent" />
              </div>

              {/* Steps in zone */}
              {group.steps.map((step, idx) => {
                const isLastInGroup = idx === group.steps.length - 1;
                const isLastOverall =
                  gi === zoneGroups.length - 1 && isLastInGroup;

                return (
                  <StepFlowItem
                    key={step.id}
                    step={step}
                    isSelected={step.id === selectedStepId}
                    isLast={isLastOverall}
                    showConnector={!isLastInGroup || !isLastOverall}
                    onSelect={onSelectStep}
                  />
                );
              })}
            </div>
          ))
        : sorted.map((step, idx) => (
            <StepFlowItem
              key={step.id}
              step={step}
              isSelected={step.id === selectedStepId}
              isLast={idx === sorted.length - 1}
              showConnector={idx < sorted.length - 1}
              onSelect={onSelectStep}
            />
          ))}
    </div>
  );
}

// ── Step item ──────────────────────────────────────────────────────────────

function StepFlowItem({
  step,
  isSelected,
  isLast,
  showConnector,
  onSelect,
}: {
  step: ThemeStep;
  isSelected: boolean;
  isLast: boolean;
  showConnector: boolean;
  onSelect: (step: ThemeStep) => void;
}) {
  const color = STATUS_COLORS[step.status];
  const icon = STEP_TYPE_ICONS[step.type];

  return (
    <div className="flex gap-3 px-2">
      {/* Timeline node + connector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0 transition-all ${
            isSelected ? 'scale-110 shadow-lg' : ''
          }`}
          style={{
            borderColor: color,
            backgroundColor: `${color}22`,
            color,
            boxShadow: isSelected ? `0 0 12px ${color}33` : undefined,
          }}
        >
          {step.stepNumber}
        </div>
        {showConnector && <div className="w-0.5 h-8 bg-white/10" />}
      </div>

      {/* Step info */}
      <button
        onClick={() => onSelect(step)}
        className={`flex-1 pb-4 text-left transition-all rounded-lg px-3 py-1.5 -mt-1 ${
          isSelected ? 'bg-white/10 ring-1 ring-white/10' : 'hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-2">
          <span style={{ color }} className="text-sm">
            {icon}
          </span>
          <span className="text-white/90 text-sm font-medium">{step.label}</span>
        </div>
        {step.zone && (
          <div className="text-white/25 text-xs mt-0.5">{step.zone}</div>
        )}
      </button>
    </div>
  );
}
