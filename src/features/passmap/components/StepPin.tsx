import type { ThemeStep, StepDetail } from '../types/passmap';
import { OUTPUT_LABELS } from '../../../utils/gameFlow';

function localizeOutput(val: string): string {
  return OUTPUT_LABELS[val] ?? val;
}

interface StepPinProps {
  step: ThemeStep;
  isSelected: boolean;
  onClick: (step: ThemeStep) => void;
  draggable?: boolean;
  onDragStart?: (e: React.MouseEvent, step: ThemeStep) => void;
  detail?: StepDetail;
}

export default function StepPin({ step, isSelected, onClick, draggable, onDragStart, detail }: StepPinProps) {
  return (
    <div
      className={`absolute z-10 rounded-lg border transition-all select-none ${
        isSelected ? 'ring-2 ring-white/60 z-20' : 'hover:brightness-125'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={{
        left: `${step.x}%`,
        top: `${step.y}%`,
        transform: 'translate(-50%, -50%)',
        minWidth: '80px',
        maxWidth: '130px',
        backgroundColor: 'rgba(10,11,14,0.85)',
        borderColor: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => onClick(step)}
      onMouseDown={draggable && onDragStart ? (e) => onDragStart(e, step) : undefined}
    >
      {/* Number + type */}
      <div className="flex items-center gap-1 px-1.5 pt-1 pb-0">
        <span className="text-[9px] font-mono font-bold text-white/35 tabular-nums leading-none">
          {String(step.stepNumber).padStart(2, '0')}
        </span>
        <span className="text-[8px] leading-none text-white/30">
          {step.type === 'puzzle' ? '🧩' : step.type === 'lock' ? '🔒' : '⚙️'}
        </span>
      </div>

      {/* Label (step title) */}
      <div className="px-1.5 pt-0.5 pb-0">
        <span className="text-[10px] font-semibold text-white/82 leading-tight line-clamp-1 block">
          {step.label}
        </span>
      </div>

      {/* Answer */}
      {detail?.answer && (
        <div className="px-1.5 pt-0.5 pb-0">
          <span className="text-[10px] font-mono font-bold text-white/55 tracking-wider leading-none block">
            {detail.answer}
          </span>
        </div>
      )}

      {/* Input → Output */}
      {(detail?.input || detail?.output) && (
        <div className="flex items-center gap-0.5 px-1.5 pt-0.5 pb-1 text-[8px] text-white/30 leading-none">
          {detail.input && <span className="truncate">{detail.input}</span>}
          {detail.input && detail.output && <span className="text-white/20">▸</span>}
          {detail.output && <span className="truncate">{localizeOutput(detail.output)}</span>}
        </div>
      )}

      {!detail?.input && !detail?.output && (
        <div className="pb-1" />
      )}
    </div>
  );
}
