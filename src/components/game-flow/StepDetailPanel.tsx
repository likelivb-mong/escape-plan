import { useState } from 'react';
import type { GameFlowStep } from '../../types/gameFlow';
import { StageBadge, RoomBadge } from './badges';

interface StepDetailPanelProps {
  step: GameFlowStep | null;
  rooms: string[];
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
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

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (onSave && trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  if (editing && onSave) {
    return (
      <div className="mb-3">
        {label && (
          <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1">
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
            rows={3}
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
      className={onSave ? 'cursor-text hover:bg-white/[0.03] rounded px-2 -mx-2 transition-colors mb-3' : 'mb-3'}
      onClick={onSave ? () => { setDraft(value); setEditing(true); } : undefined}
    >
      {label && (
        <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1">
          {label}
        </p>
      )}
      {multiline ? (
        <p className="text-footnote text-white/55 whitespace-pre-wrap leading-relaxed">
          {value || <span className="text-white/20 italic">—</span>}
        </p>
      ) : (
        <p className="text-subhead text-white/70 font-semibold">
          {value || <span className="text-white/20 italic">—</span>}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StepDetailPanel({
  step,
  rooms,
  totalSteps,
  onPrev,
  onNext,
  onUpdateStep,
}: StepDetailPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!step) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 text-center px-8">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
          🎲
        </div>
        <p className="text-subhead text-white/35 leading-relaxed">
          좌측에서 스텝을 선택하면<br />상세 정보가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-caption font-mono text-white/25">
              {step.stepNumber} / {totalSteps}
            </span>
            <StageBadge label={step.stageLabel} />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={step.stepNumber <= 1}
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] text-white/30 hover:text-white/60 disabled:opacity-20 text-subhead"
            >
              ‹
            </button>
            <button
              onClick={onNext}
              disabled={step.stepNumber >= totalSteps}
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] text-white/30 hover:text-white/60 disabled:opacity-20 text-subhead"
            >
              ›
            </button>
          </div>
        </div>

        {/* Title */}
        <EditableField
          label=""
          value={step.clueTitle}
          onSave={onUpdateStep ? v => onUpdateStep({ clueTitle: v }) : undefined}
        />
      </div>

      {/* ── Body: Core info only ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 space-y-4">
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
                className="px-2 py-1 rounded border border-white/[0.12] bg-black/40 text-footnote text-white/60 cursor-pointer appearance-none outline-none hover:border-white/20 transition-colors"
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
        </div>

        {/* Details toggle */}
        <div className="px-6 py-3 border-t border-white/[0.05]">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors flex items-center justify-between"
          >
            <span className="text-footnote font-medium text-white/40">
              {showDetails ? '▼' : '▶'} 상세 설정
            </span>
          </button>

          {/* Details (collapsible) */}
          {showDetails && (
            <div className="mt-2 pt-3 border-t border-white/[0.05] space-y-3 text-footnote">
              <div>
                <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1">
                  문제 방식
                </p>
                <p className="text-white/50">{step.problemMode}</p>
              </div>
              <div>
                <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1">
                  정답 유형
                </p>
                <p className="text-white/50">{step.answerType}</p>
              </div>
              {step.answer && (
                <div>
                  <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1">
                    정답
                  </p>
                  <p className="text-white/50 font-mono">{step.answer}</p>
                </div>
              )}
              {step.content && (
                <div>
                  <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-1">
                    내용
                  </p>
                  <p className="text-white/50 text-xs leading-relaxed">{step.content}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
