import { useState, useEffect } from 'react';
import type { GameFlowStep } from '../../types/gameFlow';
import { StageBadge } from './badges';

interface StepDetailDrawerProps {
  step: GameFlowStep;
  rooms: string[];
  totalSteps: number;
  onClose: () => void;
  onUpdateStep?: (updates: Partial<GameFlowStep>) => void;
}

// ── Editable text field ───────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
  multiline = false,
}: {
  label: string;
  value: string;
  onSave?: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (onSave && trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  if (editing && onSave) {
    return (
      <div className="mb-4">
        {label && (
          <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1.5">
            {label}
          </p>
        )}
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            className="w-full bg-white/[0.06] border border-white/20 rounded-lg px-3 py-2 text-footnote text-white/60 outline-none placeholder:text-white/20 resize-none"
            rows={4}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            className="w-full bg-white/[0.06] border border-white/20 rounded-lg px-3 py-2 text-footnote text-white/60 outline-none placeholder:text-white/20"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={onSave ? 'cursor-text hover:bg-white/[0.03] rounded px-2 -mx-2 transition-colors mb-4' : 'mb-4'}
      onClick={onSave ? () => { setDraft(value); setEditing(true); } : undefined}
    >
      {label && (
        <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1.5">
          {label}
        </p>
      )}
      {multiline ? (
        <p className="text-footnote text-white/60 whitespace-pre-wrap leading-relaxed">
          {value || <span className="text-white/20 italic">—</span>}
        </p>
      ) : (
        <p className="text-subhead text-white/75 font-semibold">
          {value || <span className="text-white/20 italic">—</span>}
        </p>
      )}
    </div>
  );
}

// ── Main Drawer ──────────────────────────────────────────────────────────────

export default function StepDetailDrawer({
  step,
  rooms,
  totalSteps,
  onClose,
  onUpdateStep,
}: StepDetailDrawerProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#0a0a0a] border-l border-white/[0.06] z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-caption font-mono text-white/25">
              {step.stepNumber} / {totalSteps}
            </span>
            <StageBadge label={step.stageLabel} />
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 text-title2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Title */}
            <EditableField
              label="제목"
              value={step.clueTitle}
              onSave={onUpdateStep ? v => onUpdateStep({ clueTitle: v }) : undefined}
            />

            {/* Description */}
            {step.description && (
              <EditableField
                label="설명"
                value={step.description}
                onSave={onUpdateStep ? v => onUpdateStep({ description: v }) : undefined}
                multiline
              />
            )}

            {/* Hint */}
            {step.hint && (
              <EditableField
                label="힌트"
                value={step.hint}
                onSave={onUpdateStep ? v => onUpdateStep({ hint: v }) : undefined}
                multiline
              />
            )}

            {/* Room */}
            <div>
              <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1.5">
                위치
              </p>
              {onUpdateStep ? (
                <select
                  value={step.room}
                  onChange={e => onUpdateStep({ room: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-footnote text-white/60 cursor-pointer appearance-none outline-none hover:border-white/20 transition-colors"
                >
                  {rooms.map(r => (
                    <option key={r} value={r} className="bg-black text-white/70">
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-footnote text-white/60">{step.room}</p>
              )}
            </div>

            {/* Details toggle */}
            <div className="pt-2 border-t border-white/[0.05]">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors flex items-center justify-between"
              >
                <span className="text-footnote font-semibold text-white/50">
                  {showDetails ? '▼' : '▶'} 상세 설정
                </span>
                <span className="text-footnote text-white/25">{step.stepNumber}</span>
              </button>

              {/* Details */}
              {showDetails && (
                <div className="mt-2 pt-3 border-t border-white/[0.05] space-y-3">
                  <DetailRow label="문제 방식" value={step.problemMode} />
                  <DetailRow label="정답 유형" value={step.answerType} />
                  {step.answer && <DetailRow label="정답" value={step.answer} mono />}
                  {step.content && <DetailRow label="내용" value={step.content} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-footnote font-medium text-white/50 hover:text-white/70 transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className={`text-footnote text-white/50 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}
