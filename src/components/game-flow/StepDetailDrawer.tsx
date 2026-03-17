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
  mono = false,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave?: (v: string) => void;
  multiline?: boolean;
  mono?: boolean;
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
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
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
            className="w-full bg-white/[0.06] border border-white/20 rounded-lg px-3 py-2.5 text-[13px] text-white/85 outline-none placeholder:text-white/25 resize-none leading-relaxed focus:border-white/30"
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
            className={`w-full bg-white/[0.06] border border-white/20 rounded-lg px-3 py-2.5 text-[13px] outline-none placeholder:text-white/25 focus:border-white/30 ${
              mono ? 'font-mono font-bold text-white/90' : 'text-white/85'
            }`}
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
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
          {label}
        </p>
      )}
      {multiline ? (
        <p className={`text-[13px] leading-relaxed rounded-lg px-3 py-2 -mx-1 transition-colors ${
          onSave ? 'group-hover/field:bg-white/[0.05]' : ''
        } ${value ? 'text-white/80' : 'text-white/25 italic'}`}>
          {value || placeholder || '클릭하여 입력'}
        </p>
      ) : (
        <p className={`text-[14px] font-medium rounded-lg px-3 py-1.5 -mx-1 transition-colors ${
          onSave ? 'group-hover/field:bg-white/[0.05]' : ''
        } ${mono ? 'font-mono font-bold' : ''} ${value ? 'text-white/90' : 'text-white/25 italic'}`}>
          {value || placeholder || '클릭하여 입력'}
        </p>
      )}
    </div>
  );
}

// ── Section Card ────────────────────────────────────────────────────────────

function SectionCard({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'puzzle' | 'solution' | 'answer';
}) {
  const cls = {
    default: 'bg-white/[0.02] border-white/[0.08]',
    puzzle: 'bg-indigo-500/[0.06] border-indigo-400/15',
    solution: 'bg-emerald-500/[0.06] border-emerald-400/15',
    answer: 'bg-amber-500/[0.07] border-amber-400/20',
  }[variant];

  return (
    <div className={`p-4 rounded-xl border ${cls}`}>
      {children}
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[440px] bg-[#0c0c0c] border-l border-white/[0.08] z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] flex-shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-mono font-bold text-white/60 bg-white/[0.06] px-2.5 py-1 rounded-lg tabular-nums">
              {String(step.stepNumber).padStart(2, '0')}/{totalSteps}
            </span>
            <StageBadge label={step.stageLabel} />
            <span className="text-[12px] text-white/55 font-medium">{step.room}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all text-sm"
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
            <SectionCard variant="puzzle">
              <EditableField
                label="문제 설정"
                value={step.puzzleSetup || ''}
                placeholder="어떤 퍼즐이 어떻게 배치되어 있는지, 플레이어가 무엇을 발견해야 하는지"
                onSave={onUpdateStep ? v => onUpdateStep({ puzzleSetup: v }) : undefined}
                multiline
              />
            </SectionCard>

            {/* ── Solution ── */}
            <SectionCard variant="solution">
              <EditableField
                label="풀이 방법"
                value={step.puzzleSolution || ''}
                placeholder="정답에 도달하기 위한 단계별 과정"
                onSave={onUpdateStep ? v => onUpdateStep({ puzzleSolution: v }) : undefined}
                multiline
              />
            </SectionCard>

            {/* ── Answer ── */}
            <SectionCard variant="answer">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  정답
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-white/55 font-semibold">
                  {ANSWER_LABEL[step.answerType] ?? step.answerType}
                </span>
              </div>
              <EditableField
                label=""
                value={step.answer || ''}
                placeholder="정답을 입력하세요"
                onSave={onUpdateStep ? v => onUpdateStep({ answer: v }) : undefined}
                mono
              />
            </SectionCard>

            {/* ── Hint ── */}
            <EditableField
              label="힌트"
              value={step.hint || ''}
              placeholder="막혔을 때 제공할 힌트"
              onSave={onUpdateStep ? v => onUpdateStep({ hint: v }) : undefined}
              multiline
            />

            {/* ── Output / Effect ── */}
            <EditableField
              label="연출 효과"
              value={step.content || ''}
              placeholder="정답 입력 후 일어나는 연출"
              onSave={onUpdateStep ? v => onUpdateStep({ content: v }) : undefined}
              multiline
            />

            {/* ── Room ── */}
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                위치
              </p>
              {onUpdateStep ? (
                <select
                  value={step.room}
                  onChange={e => onUpdateStep({ room: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-white/[0.15] bg-white/[0.05] text-[13px] text-white/80 cursor-pointer appearance-none outline-none hover:border-white/25 transition-colors font-medium"
                >
                  {rooms.map(r => (
                    <option key={r} value={r} className="bg-black text-white/80">{r}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[13px] text-white/70 font-medium">{step.room}</p>
              )}
            </div>

            {/* ── Technical details toggle ── */}
            <div className="pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors flex items-center gap-2"
              >
                <svg className={`w-3 h-3 text-white/40 transition-transform ${showTechnical ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
                <span className="text-[12px] font-semibold text-white/55">
                  기술 설정
                </span>
              </button>

              {showTechnical && (
                <div className="mt-2 pt-3 border-t border-white/[0.05] space-y-3">
                  {/* ── Flow summary: 방식 · 입력 ▸ 출력 ── */}
                  <div className="flex items-center gap-0 mb-1">
                    <div className="flex items-center rounded-l border border-r-0 border-white/[0.08] overflow-hidden">
                      <span className="text-[10px] font-semibold text-sky-300/80 bg-sky-500/[0.10] px-2 py-1 border-r border-white/[0.08]">
                        {MODE_LABEL[step.problemMode] ?? step.problemMode}
                      </span>
                      <span className="text-[10px] font-semibold text-white/55 bg-white/[0.05] px-2 py-1">
                        {ANSWER_LABEL[step.answerType] ?? step.answerType}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/25 px-1.5">▸</span>
                    <span className="text-[10px] font-semibold text-emerald-300/80 bg-emerald-500/[0.10] px-2 py-1 rounded border border-emerald-500/15">
                      {OUTPUT_LABEL[step.output] ?? step.output}
                    </span>
                  </div>

                  {/* ── Structured settings grid ── */}
                  <div className="rounded-lg border border-white/[0.06] overflow-hidden divide-y divide-white/[0.05]">
                    <TechRow
                      indicator="sky"
                      label="방식"
                      value={step.problemMode}
                      options={PROBLEM_MODES}
                      labels={MODE_LABEL}
                      onChange={onUpdateStep ? v => onUpdateStep({ problemMode: v as ProblemMode }) : undefined}
                    />
                    <TechRow
                      indicator="white"
                      label="입력"
                      value={step.answerType}
                      options={ANSWER_TYPES}
                      labels={ANSWER_LABEL}
                      onChange={onUpdateStep ? v => onUpdateStep({ answerType: v as AnswerType }) : undefined}
                    />
                    <TechRow
                      indicator="emerald"
                      label="출력"
                      value={step.output}
                      options={OUTPUT_TYPES}
                      labels={OUTPUT_LABEL}
                      onChange={onUpdateStep ? v => onUpdateStep({ output: v as OutputType }) : undefined}
                    />
                  </div>

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
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex-shrink-0 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-[13px] font-semibold text-white/60 hover:text-white/80 transition-colors"
          >
            완료
          </button>
        </div>
      </div>
    </>
  );
}

// ── Tech Row (compact inline label + select) ────────────────────────────────

const INDICATOR_COLOR: Record<string, string> = {
  sky:     'bg-sky-400/70',
  white:   'bg-white/40',
  emerald: 'bg-emerald-400/70',
};

function TechRow({
  indicator,
  label,
  value,
  options,
  labels,
  onChange,
}: {
  indicator: string;
  label: string;
  value: string;
  options: string[];
  labels: Record<string, string>;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${INDICATOR_COLOR[indicator] ?? 'bg-white/40'}`} />
      <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider w-10 flex-shrink-0">
        {label}
      </span>
      {onChange ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 rounded-md border border-white/[0.10] bg-white/[0.04] text-[12px] text-white/75 cursor-pointer appearance-none outline-none hover:border-white/20 transition-colors font-medium"
        >
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-black text-white/70">
              {labels[opt] ?? opt}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-[12px] text-white/65 font-medium">{labels[value] ?? value}</span>
      )}
    </div>
  );
}
