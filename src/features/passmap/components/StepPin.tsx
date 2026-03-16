import type { ThemeStep } from '../types/passmap';
import { STATUS_COLORS, STEP_TYPE_ICONS } from '../types/passmap';

interface StepPinProps {
  step: ThemeStep;
  isSelected: boolean;
  onClick: (step: ThemeStep) => void;
  draggable?: boolean;
  onDragStart?: (e: React.MouseEvent, step: ThemeStep) => void;
  usePercentage?: boolean;
}

export default function StepPin({ step, isSelected, onClick, draggable, onDragStart, usePercentage }: StepPinProps) {
  const color = STATUS_COLORS[step.status];
  const icon = STEP_TYPE_ICONS[step.type];

  return (
    <button
      className={`absolute flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap
        ${isSelected ? 'ring-2 ring-white scale-110 z-20' : 'z-10 hover:scale-105'}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
      `}
      style={{
        left: usePercentage ? `${step.x}%` : step.x,
        top: usePercentage ? `${step.y}%` : step.y,
        backgroundColor: `${color}22`,
        borderColor: color,
        borderWidth: 1,
        color: color,
        transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
      }}
      onClick={() => onClick(step)}
      onMouseDown={draggable && onDragStart ? (e) => onDragStart(e, step) : undefined}
    >
      <span>{icon}</span>
      <span>{step.stepNumber}</span>
      <span className="text-white/70 ml-0.5">{step.label}</span>
    </button>
  );
}
