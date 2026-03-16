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
  { color: string; textColor: string }
> = {
  intro:       { color: 'bg-sky-500/[0.08]', textColor: 'text-sky-300' },
  development: { color: 'bg-emerald-500/[0.08]', textColor: 'text-emerald-300' },
  expansion:   { color: 'bg-amber-500/[0.08]', textColor: 'text-amber-300' },
  twist:       { color: 'bg-rose-500/[0.08]', textColor: 'text-rose-300' },
  ending:      { color: 'bg-purple-500/[0.08]', textColor: 'text-purple-300' },
};

// ── Inline editable text ──────────────────────────────────────────────────────

function EditableTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  if (editing) {
    return (
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
        className="flex-1 bg-white/[0.06] border border-white/20 rounded px-2 py-1 text-subhead text-white/80 outline-none"
      />
    );
  }

  return (
    <span
      className="flex-1 cursor-text hover:bg-white/[0.04] rounded px-1 transition-colors text-subhead font-medium text-white/70"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleFlowStageCard({ stage, index, onUpdate }: PuzzleFlowStageCardProps) {
  const { key, label, title, estimatedMinutes, suggestedPuzzleSlots } = stage;
  const tokens = STAGE_TOKENS[key];
  const [expanded, setExpanded] = useState(false);

  const upd = onUpdate
    ? (updates: Partial<PuzzleFlowStage>) => onUpdate(stage.id, updates)
    : undefined;

  return (
    <div className={`border-b border-white/[0.05] py-3 transition-colors ${expanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}>
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2 text-left"
      >
        {/* Expand toggle */}
        <span className={`text-caption text-white/30 transition-transform flex-shrink-0 ${expanded ? '' : ''}`}>
          {expanded ? '▼' : '▶'}
        </span>

        {/* Index */}
        <span className="text-caption text-white/30 font-medium w-6 flex-shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Stage label */}
        <span className={`px-2 py-0.5 rounded text-caption font-bold flex-shrink-0 ${tokens.textColor} ${tokens.color}`}>
          {label}
        </span>

        {/* Title */}
        <span className="flex-1 text-subhead font-medium text-white/70 truncate">
          {title}
        </span>

        {/* Right meta */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-caption text-white/35">⏱ {estimatedMinutes}분</span>
          <span className="text-caption text-white/35">퍼즐 {suggestedPuzzleSlots}</span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 py-3 border-t border-white/[0.05] space-y-3">
          {/* Description */}
          <div>
            <p className="text-micro font-bold uppercase tracking-wider text-white/40 mb-1.5">설명</p>
            {upd ? (
              <input
                type="text"
                defaultValue={stage.description}
                onBlur={e => upd({ description: e.currentTarget.value })}
                className="w-full bg-white/[0.06] border border-white/20 rounded px-2 py-1 text-footnote text-white/70 outline-none"
              />
            ) : (
              <p className="text-footnote text-white/50">{stage.description}</p>
            )}
          </div>

          {/* Objective */}
          <div>
            <p className="text-micro font-bold uppercase tracking-wider text-white/40 mb-1.5">🎯 목표</p>
            {upd ? (
              <input
                type="text"
                defaultValue={stage.objective}
                onBlur={e => upd({ objective: e.currentTarget.value })}
                className="w-full bg-white/[0.06] border border-white/20 rounded px-2 py-1 text-footnote text-white/70 outline-none"
              />
            ) : (
              <p className="text-footnote text-white/50">{stage.objective}</p>
            )}
          </div>

          {/* Effects notes */}
          {stage.effectsNotes.length > 0 && (
            <div>
              <p className="text-micro font-bold uppercase tracking-wider text-white/40 mb-1.5">연출 포인트</p>
              <ul className="space-y-1">
                {stage.effectsNotes.map((note, i) => (
                  <li key={i} className="text-footnote text-white/40">
                    • {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords */}
          {stage.relatedKeywords.length > 0 && (
            <div>
              <p className="text-micro font-bold uppercase tracking-wider text-white/40 mb-1.5">키워드</p>
              <div className="flex flex-wrap gap-1.5">
                {stage.relatedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-md border border-white/[0.08] text-caption text-white/40 bg-white/[0.02]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
