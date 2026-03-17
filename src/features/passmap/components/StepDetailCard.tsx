import { useState, useCallback } from 'react';
import type { ThemeStep, StepDetail } from '../types/passmap';
import { STATUS_COLORS, STEP_TYPE_ICONS } from '../types/passmap';
import { OUTPUT_LABELS } from '../../../utils/gameFlow';

interface StepDetailCardProps {
  step: ThemeStep;
  detail: StepDetail | undefined;
  onStatusChange?: (stepId: string, status: ThemeStep['status']) => void;
  onUpdateDetail?: (stepId: string, updates: Partial<StepDetail>) => void;
  editable?: boolean;
}

const STATUS_LABELS: Record<ThemeStep['status'], string> = {
  unchecked: '미확인',
  complete: '완료',
  warning: '주의',
  issue: '이슈',
};

export default function StepDetailCard({
  step,
  detail,
  onStatusChange,
  onUpdateDetail,
  editable = false,
}: StepDetailCardProps) {
  const color = STATUS_COLORS[step.status];
  const icon = STEP_TYPE_ICONS[step.type];

  const fields: { key: keyof StepDetail; label: string; value: string }[] = [
    { key: 'answer', label: '정답', value: detail?.answer || '' },
    { key: 'input', label: '입력', value: detail?.input || '' },
    { key: 'output', label: '출력', value: detail?.output ? (OUTPUT_LABELS[detail.output] ?? detail.output) : '' },
    { key: 'resetMethod', label: '리셋', value: detail?.resetMethod || '' },
    { key: 'memo', label: '메모', value: detail?.memo || '' },
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
            {step.zone && (
              <div className="text-[10px] text-white/25 mt-0.5">{step.zone}</div>
            )}
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
      <div className="px-4 py-3 space-y-2">
        {fields.map(({ key, label, value }) => (
          <DetailField
            key={key}
            fieldKey={key}
            label={label}
            value={value}
            stepId={step.id}
            editable={editable}
            onUpdate={onUpdateDetail}
          />
        ))}
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

// ── Inline-editable detail field ────────────────────────────────────────────

function DetailField({
  fieldKey,
  label,
  value,
  stepId,
  editable,
  onUpdate,
}: {
  fieldKey: keyof StepDetail;
  label: string;
  value: string;
  stepId: string;
  editable: boolean;
  onUpdate?: (stepId: string, updates: Partial<StepDetail>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleStartEdit = useCallback(() => {
    if (!editable || !onUpdate) return;
    setEditValue(value);
    setIsEditing(true);
  }, [editable, onUpdate, value]);

  const handleCommit = useCallback(() => {
    setIsEditing(false);
    if (editValue !== value && onUpdate) {
      onUpdate(stepId, { [fieldKey]: editValue });
    }
  }, [editValue, value, onUpdate, stepId, fieldKey]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
    }
  }, [handleCommit, value]);

  // Don't render empty non-editable fields
  if (!value && !editable) return null;

  if (isEditing) {
    return (
      <div className="flex gap-3 text-caption">
        <span className="text-white/25 w-10 flex-shrink-0 text-right pt-1">{label}</span>
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-md px-2 py-1 text-white/80 font-mono text-caption outline-none focus:border-white/25 transition-colors"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 text-caption group ${editable ? 'cursor-text' : ''}`}
      onClick={handleStartEdit}
    >
      <span className="text-white/25 w-10 flex-shrink-0 text-right">{label}</span>
      {value ? (
        <span className={`text-white/70 font-mono ${editable ? 'group-hover:text-white/90 transition-colors' : ''}`}>
          {value}
        </span>
      ) : (
        editable && (
          <span className="text-white/15 italic">클릭하여 입력</span>
        )
      )}
    </div>
  );
}
