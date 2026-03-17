import { useState, useEffect } from 'react';
import type { GameFlowStep, ProblemMode, AnswerType, OutputType } from '../../types/gameFlow';
import { StageBadge } from './badges';

const PROBLEM_MODES: ProblemMode[] = ['clue', 'device', 'clue_device'];
const ANSWER_TYPES: AnswerType[] = ['key', 'number_4', 'number_3', 'alphabet_5', 'keypad', 'xkit', 'auto'];
const OUTPUT_TYPES: OutputType[] = [
  'door_open', 'hidden_compartment_open', 'led_on', 'tv_on',
  'xkit_guide_revealed', 'item_acquired', 'next_room_open', 'ending_video', 'escape_clear',
];

const MODE_LABEL: Record<string, string> = {
  clue: '단서 탐색', device: '장치 조작', clue_device: '단서+장치',
};
const ANSWER_LABEL: Record<string, string> = {
  key: '열쇠', number_4: '4자리 숫자', number_3: '3자리 숫자',
  alphabet_5: '알파벳 5자리', keypad: '키패드', xkit: 'X-KIT', auto: '자동',
};
const OUTPUT_LABEL: Record<string, string> = {
  door_open: '문 열림', hidden_compartment_open: '비밀 공간 열림', led_on: 'LED 점등',
  tv_on: 'TV/모니터 재생', xkit_guide_revealed: 'X-KIT 안내', item_acquired: '아이템 획득',
  next_room_open: '다음 공간 열림', ending_video: '엔딩 영상', escape_clear: '탈출 성공',
};

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
  placeholder,
  onSave,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave?: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (onSave && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  if (editing && onSave) {
    return (
      <div>
        {label && (
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
            {label}
          </p>
        )}
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            placeholder={placeholder}
            className="w-full bg-white/[0.06] border border-white/20 rounded-lg px-3 py-2 text-[13px] text-white/60 outline-none placeholder:text-white/15 resize-none leading-relaxed"
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
            placeholder={placeholder}
            className="w-full bg-white/[0.06] border border-white/20 rounded-lg px-3 py-2 text-[13px] text-white/60 outline-none placeholder:text-white/15"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={onSave ? 'cursor-text group/field' : ''}
      onClick={onSave ? () => { setDraft(value); setEditing(true); } : undefined}
    >
      {label && (
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
          {label}
        </p>
      )}
      {multiline ? (
        <p className={`text-[13px] leading-relaxed rounded-lg px-2.5 py-2 -mx-2.5 transition-colors ${
          onSave ? 'group-hover/field:bg-white/[0.03]' : ''
        } ${value ? 'text-white/55' : 'text-white/15 italic'}`}>
          {value || placeholder || '클릭하여 입력'}
        </p>
      ) : (
        <p className={`text-[14px] font-medium rounded-lg px-2.5 py-1.5 -mx-2.5 transition-colors ${
          onSave ? 'group-hover/field:bg-white/[0.03]' : ''
        } ${value ? 'text-white/70' : 'text-white/15 italic'}`}>
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
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#0a0a0a] border-l border-white/[0.06] z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-mono text-white/25 bg-white/[0.04] px-2 py-0.5 rounded">
              {String(step.stepNumber).padStart(2, '0')} / {totalSteps}
            </span>
            <StageBadge label={step.stageLabel} />
            <span className="text-[11px] text-white/30">{step.room}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* ── Title ── */}
            <EditableField
              label="퍼즐 제목"
              value={step.clueTitle}
              onSave={onUpdateStep ? v => onUpdateStep({ clueTitle: v }) : undefined}
            />

            {/* ── Description ── */}
            <EditableField
              label="상황 설명"
              value={step.description || ''}
              placeholder="플레이어가 마주하는 상황을 설명하세요"
              onSave={onUpdateStep ? v => onUpdateStep({ description: v }) : undefined}
              multiline
            />

            {/* ── Puzzle Setup ── */}
            <div className="p-4 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/[0.12]">
              <EditableField
                label="🧩 문제 설정"
                value={step.puzzleSetup || ''}
                placeholder="어떤 퍼즐이 어떻게 배치되어 있는지, 플레이어가 무엇을 발견해야 하는지"
                onSave={onUpdateStep ? v => onUpdateStep({ puzzleSetup: v }) : undefined}
                multiline
              />
            </div>

            {/* ── Solution ── */}
            <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.12]">
              <EditableField
                label="✅ 풀이 방법"
                value={step.puzzleSolution || ''}
                placeholder="정답에 도달하기 위한 단계별 과정"
                onSave={onUpdateStep ? v => onUpdateStep({ puzzleSolution: v }) : undefined}
                multiline
              />
            </div>

            {/* ── Answer ── */}
            <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/[0.12]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                  🔑 정답
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30">
                  {ANSWER_LABEL[step.answerType] ?? step.answerType}
                </span>
              </div>
              <EditableField
                label=""
                value={step.answer || ''}
                placeholder="정답을 입력하세요"
                onSave={onUpdateStep ? v => onUpdateStep({ answer: v }) : undefined}
              />
            </div>

            {/* ── Hint ── */}
            <EditableField
              label="💡 힌트"
              value={step.hint || ''}
              placeholder="막혔을 때 제공할 힌트"
              onSave={onUpdateStep ? v => onUpdateStep({ hint: v }) : undefined}
              multiline
            />

            {/* ── Output / Effect ── */}
            <EditableField
              label="🎬 연출 효과"
              value={step.content || ''}
              placeholder="정답 입력 후 일어나는 연출"
              onSave={onUpdateStep ? v => onUpdateStep({ content: v }) : undefined}
              multiline
            />

            {/* ── Room ── */}
            <div>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
                위치
              </p>
              {onUpdateStep ? (
                <select
                  value={step.room}
                  onChange={e => onUpdateStep({ room: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-[13px] text-white/60 cursor-pointer appearance-none outline-none hover:border-white/20 transition-colors"
                >
                  {rooms.map(r => (
                    <option key={r} value={r} className="bg-black text-white/70">{r}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[13px] text-white/60">{step.room}</p>
              )}
            </div>

            {/* ── Technical details toggle ── */}
            <div className="pt-2 border-t border-white/[0.05]">
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors flex items-center justify-between"
              >
                <span className="text-[12px] font-medium text-white/35">
                  {showTechnical ? '▼' : '▶'} 기술 설정
                </span>
              </button>

              {showTechnical && (
                <div className="mt-2 pt-3 border-t border-white/[0.05] space-y-4">
                  {/* Problem Mode */}
                  <SelectField
                    label="문제 방식"
                    value={step.problemMode}
                    options={PROBLEM_MODES}
                    labels={MODE_LABEL}
                    onChange={onUpdateStep ? v => onUpdateStep({ problemMode: v as ProblemMode }) : undefined}
                  />
                  {/* Answer Type */}
                  <SelectField
                    label="정답 유형"
                    value={step.answerType}
                    options={ANSWER_TYPES}
                    labels={ANSWER_LABEL}
                    onChange={onUpdateStep ? v => onUpdateStep({ answerType: v as AnswerType }) : undefined}
                  />
                  {/* Output Type */}
                  <SelectField
                    label="출력 타입"
                    value={step.output}
                    options={OUTPUT_TYPES}
                    labels={OUTPUT_LABEL}
                    onChange={onUpdateStep ? v => onUpdateStep({ output: v as OutputType }) : undefined}
                  />
                  {/* Notes */}
                  <EditableField
                    label="메모"
                    value={step.notes || ''}
                    placeholder="내부 메모"
                    onSave={onUpdateStep ? v => onUpdateStep({ notes: v }) : undefined}
                    multiline
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[13px] font-medium text-white/50 hover:text-white/70 transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </>
  );
}

// ── Select Field ─────────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels: Record<string, string>;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      {onChange ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-[13px] text-white/60 cursor-pointer appearance-none outline-none hover:border-white/20 transition-colors"
        >
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-black text-white/70">
              {labels[opt] ?? opt}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-[13px] text-white/60">{labels[value] ?? value}</p>
      )}
    </div>
  );
}
