import type { ThemeStep, StepDetail } from '../types/passmap';
import { STATUS_COLORS, STEP_TYPE_ICONS } from '../types/passmap';

interface StepDetailCardProps {
  step: ThemeStep;
  detail: StepDetail | undefined;
  onStatusChange?: (stepId: string, status: ThemeStep['status']) => void;
}

const STATUS_LABELS: Record<ThemeStep['status'], string> = {
  unchecked: '미확인',
  complete: '완료',
  warning: '주의',
  issue: '이슈',
};

export default function StepDetailCard({ step, detail, onStatusChange }: StepDetailCardProps) {
  const color = STATUS_COLORS[step.status];
  const icon = STEP_TYPE_ICONS[step.type];

  const fields = [
    { label: '공간', value: step.zone },
    { label: '정답', value: detail?.answer },
    { label: '입력', value: detail?.input },
    { label: '출력', value: detail?.output },
    { label: '리셋', value: detail?.resetMethod },
    { label: '메모', value: detail?.memo },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${color}18`, color, border: `1.5px solid ${color}44` }}
          >
            {step.stepNumber}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span style={{ color }} className="text-sm">{icon}</span>
              <span className="text-white/85 text-subhead font-medium">{step.label}</span>
            </div>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {STATUS_LABELS[step.status]}
        </span>
      </div>

      {/* Fields */}
      <div className="px-4 py-3 space-y-2.5">
        {fields.map(({ label, value }) =>
          value ? (
            <div key={label} className="flex gap-3 text-caption">
              <span className="text-white/25 w-10 flex-shrink-0 text-right">{label}</span>
              <span className="text-white/70 font-mono">{value}</span>
            </div>
          ) : null,
        )}
      </div>

      {/* Status Toggle */}
      {onStatusChange && (
        <div className="flex gap-1 px-4 pb-3 pt-1">
          {(Object.keys(STATUS_LABELS) as ThemeStep['status'][]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(step.id, s)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                step.status === s
                  ? 'bg-white/[0.10] text-white'
                  : 'text-white/25 hover:text-white/50 hover:bg-white/[0.04]'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
