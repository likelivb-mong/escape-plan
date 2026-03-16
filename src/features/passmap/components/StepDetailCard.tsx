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
    { label: 'Zone', value: step.zone },
    { label: 'Answer', value: detail?.answer },
    { label: 'Input', value: detail?.input },
    { label: 'Output', value: detail?.output },
    { label: 'Reset Method', value: detail?.resetMethod },
    { label: 'Memo', value: detail?.memo },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }} className="text-lg">{icon}</span>
          <span className="text-white font-medium">
            Step {step.stepNumber}
          </span>
          <span className="text-white/60">·</span>
          <span className="text-white/80">{step.label}</span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
        >
          {STATUS_LABELS[step.status]}
        </span>
      </div>

      {/* Detail Fields */}
      <div className="space-y-2">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex gap-3 text-sm">
            <span className="text-white/40 w-24 flex-shrink-0">{label}</span>
            <span className="text-white/80">{value || '-'}</span>
          </div>
        ))}
      </div>

      {/* Status Toggle */}
      {onStatusChange && (
        <div className="flex gap-2 pt-2 border-t border-white/5">
          {(Object.keys(STATUS_LABELS) as ThemeStep['status'][]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(step.id, s)}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                step.status === s
                  ? 'bg-white/15 text-white'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
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
