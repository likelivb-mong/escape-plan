import { useState } from 'react';
import type { PuzzleFlowStage, PuzzleFlowStageKey } from '../../types/puzzleFlow';

interface PuzzleFlowStageCardProps {
  stage: PuzzleFlowStage;
  index: number;
  isLast: boolean;
  onUpdate?: (stageId: string, updates: Partial<PuzzleFlowStage>) => void;
}

// ── Stage visual tokens ───────────────────────────────────────────────────────

const STAGE_TOKENS: Record<
  PuzzleFlowStageKey,
  { badge: string; dot: string; accent: string; puzzleBadge: string }
> = {
  intro:       {
    badge:       'bg-sky-500/[0.10] text-sky-300/80 border-sky-400/20',
    dot:         'bg-sky-400/70',
    accent:      'text-sky-300/65',
    puzzleBadge: 'bg-sky-500/[0.10] text-sky-300/70 border-sky-400/15',
  },
  development: {
    badge:       'bg-emerald-500/[0.10] text-emerald-300/80 border-emerald-400/20',
    dot:         'bg-emerald-400/70',
    accent:      'text-emerald-300/65',
    puzzleBadge: 'bg-emerald-500/[0.10] text-emerald-300/70 border-emerald-400/15',
  },
  expansion:   {
    badge:       'bg-amber-500/[0.10] text-amber-300/80 border-amber-400/20',
    dot:         'bg-amber-400/70',
    accent:      'text-amber-300/65',
    puzzleBadge: 'bg-amber-500/[0.10] text-amber-300/70 border-amber-400/15',
  },
  twist:       {
    badge:       'bg-rose-500/[0.10] text-rose-300/80 border-rose-400/20',
    dot:         'bg-rose-400/70',
    accent:      'text-rose-300/65',
    puzzleBadge: 'bg-rose-500/[0.10] text-rose-300/70 border-rose-400/15',
  },
  ending:      {
    badge:       'bg-purple-500/[0.10] text-purple-300/80 border-purple-400/20',
    dot:         'bg-purple-400/70',
    accent:      'text-purple-300/65',
    puzzleBadge: 'bg-purple-500/[0.10] text-purple-300/70 border-purple-400/15',
  },
};

// ── Inline-editable text ──────────────────────────────────────────────────────

function Editable({
  value,
  onSave,
  className,
  multiline = false,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  const inputBase = 'bg-white/[0.06] border border-white/20 rounded-lg outline-none w-full text-white/80 placeholder:text-white/20 px-2 py-1';

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => e.key === 'Escape' && (setDraft(value), setEditing(false))}
        className={`${inputBase} resize-none text-[12px] ${className ?? ''}`}
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
        className={`${inputBase} ${className ?? ''}`}
      />
    );
  }

  return (
    <span
      className={`cursor-text rounded px-0.5 -mx-0.5 transition-colors hover:bg-white/[0.05] group/edit relative inline-block ${className ?? ''}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="클릭하여 편집"
    >
      {value}
      <span className="opacity-0 group-hover/edit:opacity-60 text-[9px] text-white/30 ml-1 transition-opacity">✎</span>
    </span>
  );
}

// ── Inline-editable number ────────────────────────────────────────────────────

function EditableNum({
  value,
  onSave,
  min,
  max,
}: {
  value: number;
  onSave: (v: number) => void;
  min: number;
  max: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    setEditing(false);
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= min && n <= max && n !== value) onSave(n);
    else setDraft(String(value));
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        min={min}
        max={max}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        className="w-8 bg-white/[0.06] border border-white/20 rounded px-1 text-[10px] text-white/70 outline-none text-center"
      />
    );
  }
  return (
    <span
      className="cursor-text hover:bg-white/[0.06] rounded px-0.5 transition-colors"
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      title="클릭하여 편집"
    >
      {value}
    </span>
  );
}

// ── Editable notes list ───────────────────────────────────────────────────────

function EditableNotes({
  notes,
  onSave,
}: {
  notes: string[];
  onSave: (notes: string[]) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const commit = (idx: number) => {
    const trimmed = draft.trim();
    if (trimmed) onSave(notes.map((n, i) => i === idx ? trimmed : n));
    setEditingIdx(null);
  };

  const deleteNote = (idx: number) => onSave(notes.filter((_, i) => i !== idx));

  const addNote = () => {
    const newNotes = [...notes, '새 연출 포인트'];
    onSave(newNotes);
    setEditingIdx(newNotes.length - 1);
    setDraft('새 연출 포인트');
  };

  return (
    <ul className="flex flex-col gap-1.5">
      {notes.map((note, i) => (
        <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed group/note">
          <span className="flex-shrink-0 mt-[3px] text-white/20">•</span>
          {editingIdx === i ? (
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={() => commit(i)}
              onKeyDown={e => {
                if (e.key === 'Enter') commit(i);
                if (e.key === 'Escape') setEditingIdx(null);
              }}
              className="flex-1 bg-white/[0.06] border border-white/20 rounded px-2 py-0.5 text-[11px] text-white/70 outline-none"
            />
          ) : (
            <>
              <span
                className="text-white/40 cursor-text hover:text-white/60 flex-1 transition-colors"
                onClick={() => { setDraft(note); setEditingIdx(i); }}
              >
                {note}
              </span>
              <button
                onClick={() => deleteNote(i)}
                className="opacity-0 group-hover/note:opacity-100 text-white/20 hover:text-rose-400/60 text-[11px] transition-all flex-shrink-0 leading-none"
              >
                ×
              </button>
            </>
          )}
        </li>
      ))}
      <li>
        <button
          onClick={addNote}
          className="ml-4 text-[10px] text-white/20 hover:text-white/45 transition-colors"
        >
          + 연출 포인트 추가
        </button>
      </li>
    </ul>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleFlowStageCard({ stage, index, isLast, onUpdate }: PuzzleFlowStageCardProps) {
  const {
    key, label, title, description, estimatedMinutes,
    objective, suggestedPuzzleSlots, effectsNotes, relatedKeywords,
  } = stage;
  const tokens = STAGE_TOKENS[key];

  const upd = onUpdate
    ? (updates: Partial<PuzzleFlowStage>) => onUpdate(stage.id, updates)
    : undefined;

  return (
    <div className="flex gap-4">
      {/* ── Timeline column ── */}
      <div className="flex flex-col items-center flex-shrink-0 w-6 pt-[18px]">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tokens.dot}`} />
        {!isLast && (
          <div className="w-px flex-1 min-h-[24px] mt-2 bg-white/[0.07]" />
        )}
      </div>

      {/* ── Card ── */}
      <div className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden mb-4">

        {/* Card header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] text-white/20 font-medium tabular-nums w-4 flex-shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold leading-none ${tokens.badge}`}>
              {label}
            </span>
            {upd ? (
              <Editable
                value={title}
                onSave={v => upd({ title: v })}
                className="text-sm font-semibold text-white/85 leading-snug"
              />
            ) : (
              <h3 className="text-sm font-semibold text-white/85 leading-snug">{title}</h3>
            )}
          </div>

          {/* Right meta badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 text-[10px] text-white/35">
              <span>⏱</span>
              {upd ? (
                <EditableNum value={estimatedMinutes} onSave={v => upd({ estimatedMinutes: v })} min={1} max={120} />
              ) : (
                estimatedMinutes
              )}
              분
            </span>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium flex items-center gap-1 ${tokens.puzzleBadge}`}>
              퍼즐{' '}
              {upd ? (
                <EditableNum value={suggestedPuzzleSlots} onSave={v => upd({ suggestedPuzzleSlots: v })} min={0} max={10} />
              ) : (
                suggestedPuzzleSlots
              )}
              슬롯
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="px-5 py-4 flex flex-col gap-4">

          {/* Description */}
          {upd ? (
            <Editable
              value={description}
              onSave={v => upd({ description: v })}
              multiline
              className="text-[12px] text-white/55 leading-relaxed"
            />
          ) : (
            <p className="text-[12px] text-white/55 leading-relaxed">{description}</p>
          )}

          {/* Objective */}
          <div className="flex items-start gap-2.5">
            <span className="text-[11px] flex-shrink-0 mt-[1px]">🎯</span>
            <div className="flex-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${tokens.accent}`}>
                플레이 목표
              </span>
              {upd ? (
                <Editable
                  value={objective}
                  onSave={v => upd({ objective: v })}
                  multiline
                  className="text-[11px] text-white/50 leading-relaxed"
                />
              ) : (
                <p className="text-[11px] text-white/50 leading-relaxed">{objective}</p>
              )}
            </div>
          </div>

          {/* Effects notes */}
          <div>
            <p className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${tokens.accent}`}>
              연출 포인트
            </p>
            {upd ? (
              <EditableNotes notes={effectsNotes} onSave={notes => upd({ effectsNotes: notes })} />
            ) : effectsNotes.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {effectsNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-white/40 leading-relaxed">
                    <span className="flex-shrink-0 mt-[3px] text-white/20">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Related keywords (derived from mandalart — read-only) */}
          {relatedKeywords.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/[0.04]">
              <span className={`text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${tokens.accent}`}>
                키워드
              </span>
              {relatedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-md border border-white/[0.08] text-[10px] text-white/40 bg-white/[0.02]"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
