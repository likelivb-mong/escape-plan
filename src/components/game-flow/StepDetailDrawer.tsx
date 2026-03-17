import { useState, useEffect, useRef } from 'react';
import type { GameFlowStep } from '../../types/gameFlow';
import { StageBadge } from './badges';
import {
  InlineSelect,
  MODE_OPTIONS,
  ANSWER_OPTIONS,
  OUTPUT_OPTIONS,
} from './TechSettings';

const ANSWER_LABEL: Record<string, string> = {
  key: '열쇠', number_4: '4자리 숫자', number_3: '3자리 숫자',
  alphabet_5: '알파벳 5자리', keypad: '키패드', xkit: 'X-KIT', auto: '자동',
};

interface StepDetailDrawerProps {
  step: GameFlowStep;
  rooms: string[];
  totalSteps: number;
  onClose: () => void;
  onUpdateStep?: (updates: Partial<GameFlowStep>) => void;
}

// ── Inline editable field ─────────────────────────────────────────────────────

function Field({
  label,
  value,
  placeholder,
  onSave,
  multiline = false,
  mono = false,
  rows = 3,
  accent,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  onSave?: (v: string) => void;
  multiline?: boolean;
  mono?: boolean;
  rows?: number;
  accent?: string; // tailwind text color class for label
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (onSave && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  const labelEl = label ? (
    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${accent ?? 'text-white/35'}`}>
      {label}
    </p>
  ) : null;

  if (editing && onSave) {
    const inputCls = `w-full bg-white/[0.06] border border-white/[0.18] rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-white/20 focus:border-white/30 transition-colors resize-none leading-relaxed ${
      mono ? 'font-mono font-bold text-white/95' : 'text-white/90'
    }`;
    return (
      <div>
        {labelEl}
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            autoFocus
            value={draft}
            rows={rows}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            placeholder={placeholder}
            className={inputCls}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            placeholder={placeholder}
            className={inputCls}
          />
        )}
      </div>
    );
  }

  const displayCls = `rounded-lg px-2.5 py-1.5 -mx-1 transition-colors ${
    onSave ? 'cursor-text hover:bg-white/[0.04] group-hover/f:bg-white/[0.04]' : ''
  }`;

  return (
    <div className="group/f" onClick={onSave ? () => { setDraft(value); setEditing(true); } : undefined}>
      {labelEl}
      {multiline ? (
        <p className={`${displayCls} text-[13px] leading-relaxed ${value ? 'text-white/75' : 'text-white/22 italic'}`}>
          {value || placeholder || '클릭하여 입력'}
        </p>
      ) : (
        <p className={`${displayCls} text-[14px] leading-snug ${
          mono ? 'font-mono font-bold' : 'font-medium'
        } ${value ? 'text-white/90' : 'text-white/22 italic'}`}>
          {value || placeholder || '클릭하여 입력'}
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

  const u = onUpdateStep;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40" onClick={onClose} />

      {/* Drawer — wider for 2-col layout */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[#0d0d0d] border-l border-white/[0.07] z-50 flex flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 px-4 h-11 border-b border-white/[0.06] flex-shrink-0 bg-white/[0.015]">
          <span className="font-mono text-[11px] font-bold text-white/40 tabular-nums bg-white/[0.05] px-1.5 py-0.5 rounded">
            {String(step.stepNumber).padStart(2, '0')}/{totalSteps}
          </span>
          <StageBadge label={step.stageLabel} />
          {u ? (
            <select
              value={step.room}
              onChange={e => u({ room: e.target.value })}
              className="text-[11px] text-white/50 font-medium bg-transparent appearance-none outline-none cursor-pointer hover:text-white/75 transition-colors"
            >
              {rooms.map(r => <option key={r} value={r} className="bg-[#111] text-white/80">{r}</option>)}
            </select>
          ) : (
            <span className="text-[11px] text-white/50 font-medium">{step.room}</span>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-all text-[11px]"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-4">

            {/* ── Title ── */}
            <div className="pb-3 border-b border-white/[0.05]">
              {u ? (
                <TitleField
                  value={step.clueTitle}
                  onSave={v => u({ clueTitle: v })}
                />
              ) : (
                <h2 className="text-[18px] font-bold text-white/90 leading-snug">{step.clueTitle}</h2>
              )}
            </div>

            {/* ── Answer + Tech settings ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Answer */}
              <div className="col-span-1 rounded-xl bg-amber-500/[0.07] border border-amber-400/15 px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-amber-300/60 uppercase tracking-widest">정답</span>
                  {u ? (
                    <InlineSelect
                      value={step.answerType}
                      options={ANSWER_OPTIONS}
                      onChange={v => u({ answerType: v as GameFlowStep['answerType'] })}
                      className="text-[9px] text-white/40 font-semibold"
                      compact
                    />
                  ) : (
                    <span className="text-[9px] text-white/35 font-medium">{ANSWER_LABEL[step.answerType] ?? step.answerType}</span>
                  )}
                </div>
                <Field
                  value={step.answer || ''}
                  placeholder="정답 입력"
                  onSave={u ? v => u({ answer: v }) : undefined}
                  mono
                />
              </div>

              {/* Tech: 방식 + 출력 */}
              <div className="col-span-1 rounded-xl bg-white/[0.02] border border-white/[0.07] px-3 py-3 space-y-2.5">
                <TechRow
                  dot="bg-sky-400/60"
                  label="방식"
                  value={step.problemMode}
                  options={MODE_OPTIONS}
                  onChange={u ? v => u({ problemMode: v as GameFlowStep['problemMode'] }) : undefined}
                />
                <TechRow
                  dot="bg-emerald-400/60"
                  label="출력"
                  value={step.output}
                  options={OUTPUT_OPTIONS}
                  onChange={u ? v => u({ output: v as GameFlowStep['output'] }) : undefined}
                />
              </div>
            </div>

            {/* ── Description ── */}
            <FieldBlock label="상황 설명" accent="text-white/35">
              <Field
                value={step.description || ''}
                placeholder="플레이어가 마주하는 상황"
                onSave={u ? v => u({ description: v }) : undefined}
                multiline
                rows={2}
              />
            </FieldBlock>

            {/* ── Puzzle Setup + Solution (2-col) ── */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-indigo-500/[0.05] border border-indigo-400/12 px-3 py-3">
                <p className="text-[10px] font-semibold text-indigo-300/60 uppercase tracking-widest mb-2">문제 설정</p>
                <Field
                  value={step.puzzleSetup || ''}
                  placeholder="퍼즐 배치, 발견해야 할 것"
                  onSave={u ? v => u({ puzzleSetup: v }) : undefined}
                  multiline
                  rows={4}
                />
              </div>
              <div className="rounded-xl bg-emerald-500/[0.05] border border-emerald-400/12 px-3 py-3">
                <p className="text-[10px] font-semibold text-emerald-300/60 uppercase tracking-widest mb-2">풀이 방법</p>
                <Field
                  value={step.puzzleSolution || ''}
                  placeholder="정답까지의 단계별 과정"
                  onSave={u ? v => u({ puzzleSolution: v }) : undefined}
                  multiline
                  rows={4}
                />
              </div>
            </div>

            {/* ── Hint + Effect (2-col) ── */}
            <div className="grid grid-cols-2 gap-2.5">
              <FieldBlock label="힌트" accent="text-white/35">
                <Field
                  value={step.hint || ''}
                  placeholder="막혔을 때 힌트"
                  onSave={u ? v => u({ hint: v }) : undefined}
                  multiline
                  rows={2}
                />
              </FieldBlock>
              <FieldBlock label="연출 효과" accent="text-white/35">
                <Field
                  value={step.content || ''}
                  placeholder="정답 후 연출"
                  onSave={u ? v => u({ content: v }) : undefined}
                  multiline
                  rows={2}
                />
              </FieldBlock>
            </div>

            {/* ── Notes ── */}
            <FieldBlock label="메모" accent="text-white/25">
              <Field
                value={step.notes || ''}
                placeholder="내부 메모 (플레이어에게 노출되지 않음)"
                onSave={u ? v => u({ notes: v }) : undefined}
                multiline
                rows={2}
              />
            </FieldBlock>

          </div>
        </div>

        {/* ── Footer: auto-save note only ──────────────────────────────── */}
        <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-white/20">클릭 후 입력 · 자동 저장</span>
          <button
            onClick={onClose}
            className="text-[11px] text-white/35 hover:text-white/65 transition-colors px-3 py-1 rounded-lg hover:bg-white/[0.05] font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}

// ── Title field (large inline edit) ─────────────────────────────────────────

function TitleField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

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
        className="w-full bg-transparent text-[18px] font-bold text-white/95 outline-none border-b-2 border-white/25 pb-0.5 focus:border-white/50 transition-colors"
      />
    );
  }
  return (
    <h2
      onClick={() => { setDraft(value); setEditing(true); }}
      className="text-[18px] font-bold text-white/90 leading-snug cursor-text hover:text-white transition-colors"
    >
      {value}
    </h2>
  );
}

// ── FieldBlock wrapper ────────────────────────────────────────────────────────

function FieldBlock({ label, accent, children }: { label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${accent ?? 'text-white/35'}`}>
        {label}
      </p>
      {children}
    </div>
  );
}

// ── Tech Row ─────────────────────────────────────────────────────────────────

function TechRow({
  dot,
  label,
  value,
  options,
  onChange,
}: {
  dot: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange?: (v: string) => void;
}) {
  const displayLabel = options.find(o => o.value === value)?.label ?? value;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider w-9 flex-shrink-0">{label}</span>
      {onChange ? (
        <div className="flex-1 min-w-0">
          <InlineSelect
            value={value}
            options={options}
            onChange={onChange}
            className="text-[11px] text-white/70 font-medium"
          />
        </div>
      ) : (
        <span className="text-[11px] text-white/60 font-medium truncate">{displayLabel}</span>
      )}
    </div>
  );
}
