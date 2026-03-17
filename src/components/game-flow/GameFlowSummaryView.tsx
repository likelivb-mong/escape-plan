import { useMemo, useState } from 'react';
import type { GameFlowPlan, AnswerType, StageLabel, GameFlowStep } from '../../types/gameFlow';
import { ANSWER_TYPE_LABELS } from '../../utils/gameFlow';
import { StageBadge, ProblemModeBadge, AnswerTypeBadge, OutputBadge } from './badges';

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

// ── Compact icon labels ──────────────────────────────────────────────────────
const MODE_ICON: Record<string, string> = { clue: '🧩', device: '⚙️', clue_device: '🧩⚙️' };
const MODE_SHORT: Record<string, string> = { clue: '단서', device: '장치', clue_device: '복합' };
const ANSWER_ICON: Record<string, string> = {
  key: '🔐', number_4: '🔢', number_3: '🔢',
  alphabet_5: '🔤', keypad: '⌨️', xkit: '📟', auto: '⏩',
};
const ANSWER_SHORT: Record<string, string> = {
  key: '열쇠', number_4: '4자리', number_3: '3자리',
  alphabet_5: '영문', keypad: '키패드', xkit: 'X-KIT', auto: '자동',
};
const OUTPUT_ICON: Record<string, string> = {
  door_open: '🚪', hidden_compartment_open: '🔓', led_on: '💡',
  tv_on: '📺', xkit_guide_revealed: '📟', item_acquired: '📦',
  next_room_open: '➡️', ending_video: '🎬', escape_clear: '🏁',
};
const OUTPUT_SHORT: Record<string, string> = {
  door_open: '문열림', hidden_compartment_open: '비밀공간', led_on: 'LED',
  tv_on: 'TV', xkit_guide_revealed: 'X-KIT', item_acquired: '아이템',
  next_room_open: '다음방', ending_video: '엔딩', escape_clear: '탈출',
};

interface GameFlowSummaryViewProps {
  plan: GameFlowPlan;
}

export default function GameFlowSummaryView({ plan }: GameFlowSummaryViewProps) {
  const { steps, rooms } = plan;
  const [lockDetailOpen, setLockDetailOpen] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const lockAnswerTypes: AnswerType[] = ['key', 'number_4', 'number_3', 'alphabet_5'];
  const keypadAnswerTypes: AnswerType[] = ['keypad', 'auto'];

  const lockCount = useMemo(() =>
    steps.filter((s) => lockAnswerTypes.includes(s.answerType)).length,
    [steps],
  );
  const keypadCount = useMemo(() =>
    steps.filter((s) => keypadAnswerTypes.includes(s.answerType)).length,
    [steps],
  );
  const xkitCount = useMemo(() =>
    steps.filter((s) => s.answerType === 'xkit').length,
    [steps],
  );
  const deviceCount = useMemo(() =>
    steps.filter((s) => s.problemMode === 'device' || s.problemMode === 'clue_device').length,
    [steps],
  );

  const answerTypeCounts = useMemo(() =>
    steps.reduce<Record<string, number>>((acc, s) => {
      acc[s.answerType] = (acc[s.answerType] ?? 0) + 1;
      return acc;
    }, {}),
    [steps],
  );

  const totalLocks = lockCount + keypadCount;
  const sortedSteps = useMemo(() =>
    [...steps].sort((a, b) => a.stepNumber - b.stepNumber),
    [steps],
  );

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">

        {/* ── Header: Overview + Lock button ── */}
        <div className="flex items-center gap-3 mb-6">
          {/* Stats */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white/75 tabular-nums">{steps.length}</span>
              <span className="text-[11px] text-white/30">steps</span>
            </div>

            <div className="w-px h-5 bg-white/[0.08]" />

            <div className="flex items-center gap-1.5">
              {STAGE_ORDER.map((stage) => {
                const count = steps.filter((s) => s.stageLabel === stage).length;
                if (count === 0) return null;
                return (
                  <div key={stage} className="flex items-center gap-1 text-[11px]">
                    <StageBadge label={stage} />
                    <span className="text-white/30 tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="w-px h-5 bg-white/[0.08]" />

            <span className="text-[11px] text-white/30">{rooms.length} rooms</span>
          </div>

          {/* Lock detail toggle button */}
          <button
            onClick={() => setLockDetailOpen(!lockDetailOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              lockDetailOpen
                ? 'border-white/[0.15] bg-white/[0.06] text-white/70'
                : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.12] hover:text-white/60'
            }`}
          >
            <span className="text-sm">🔒</span>
            <span className="tabular-nums font-bold">{totalLocks}</span>
            <svg
              className={`w-3 h-3 transition-transform ${lockDetailOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* ── Lock Detail Panel (collapsible) ── */}
        {lockDetailOpen && (
          <div className="mb-6 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Lock answers */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-xs">🔐</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">자물쇠</span>
                  <span className="text-[10px] text-white/20 tabular-nums">{lockCount}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(Object.entries(answerTypeCounts) as [AnswerType, number][])
                    .filter(([type]) => lockAnswerTypes.includes(type))
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-[11px]">
                        <span className="text-white/40">{ANSWER_TYPE_LABELS[type]}</span>
                        <span className="text-white/25 tabular-nums">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Keypad answers */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-xs">⌨️</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">키패드</span>
                  <span className="text-[10px] text-white/20 tabular-nums">{keypadCount}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(Object.entries(answerTypeCounts) as [AnswerType, number][])
                    .filter(([type]) => keypadAnswerTypes.includes(type))
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-[11px]">
                        <span className="text-white/40">{ANSWER_TYPE_LABELS[type]}</span>
                        <span className="text-white/25 tabular-nums">{count}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* X-KIT */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-xs">📟</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">X-KIT</span>
                  <span className="text-[10px] text-white/20 tabular-nums">{xkitCount}</span>
                </div>
                {xkitCount === 0 && <span className="text-[10px] text-white/15">없음</span>}
              </div>

              {/* Devices */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-xs">⚙️</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">장치</span>
                  <span className="text-[10px] text-white/20 tabular-nums">{deviceCount}</span>
                </div>
                {deviceCount === 0 && <span className="text-[10px] text-white/15">없음</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── Step List (1 → N) ── */}
        <div className="flex flex-col gap-0.5">
          {sortedSteps.map((step) => {
            const isExpanded = expandedStepId === step.id;
            return (
              <div key={step.id}>
                {/* Compact row */}
                <div
                  className={`flex items-center gap-2.5 py-2.5 px-3 -mx-3 rounded-lg cursor-pointer transition-all ${
                    isExpanded
                      ? 'bg-white/[0.05]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                  onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                >
                  <span className="text-[10px] font-mono text-white/20 w-5 text-right tabular-nums flex-shrink-0">
                    {String(step.stepNumber).padStart(2, '0')}
                  </span>
                  <StageBadge label={step.stageLabel} />
                  <span className="text-[13px] text-white/70 flex-1 truncate">{step.clueTitle}</span>

                  {/* Answer preview */}
                  {step.answer && (
                    <span className="text-[10px] font-mono text-amber-300/40 truncate max-w-[80px] flex-shrink-0 hidden sm:block">
                      🔑 {step.answer}
                    </span>
                  )}

                  {/* Compact icon tags */}
                  <div className="hidden sm:flex items-center gap-0.5 text-[10px] text-white/25 flex-shrink-0">
                    <span className="text-[9px]">{MODE_ICON[step.problemMode] ?? '🧩'}</span>
                    <span>{MODE_SHORT[step.problemMode] ?? step.problemMode}</span>
                    <span className="text-white/10 mx-0.5">·</span>
                    <span className="text-[9px]">{ANSWER_ICON[step.answerType] ?? '🔢'}</span>
                    <span>{ANSWER_SHORT[step.answerType] ?? step.answerType}</span>
                    <span className="text-white/10 mx-0.5">·</span>
                    <span className="text-[9px]">{OUTPUT_ICON[step.output] ?? '🚪'}</span>
                    <span>{OUTPUT_SHORT[step.output] ?? step.output}</span>
                  </div>

                  {/* Expand indicator */}
                  <svg
                    className={`w-3.5 h-3.5 text-white/20 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <StepDetail step={step} />
                )}
              </div>
            );
          })}
        </div>

        {steps.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-white/25">스텝이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step Detail (expanded) ──────────────────────────────────────────────────

function StepDetail({ step }: { step: GameFlowStep }) {
  return (
    <div className="ml-10 mr-3 mb-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      {/* Room + tags (mobile) */}
      <div className="flex items-center gap-2 mb-3 text-[11px] text-white/35">
        <span>{step.room}</span>
        <span className="text-white/10">·</span>
        <span>{MODE_ICON[step.problemMode]} {MODE_SHORT[step.problemMode]}</span>
        <span className="text-white/10">·</span>
        <span>{ANSWER_ICON[step.answerType]} {ANSWER_SHORT[step.answerType]}</span>
        <span className="text-white/10">·</span>
        <span>{OUTPUT_ICON[step.output]} {OUTPUT_SHORT[step.output]}</span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Puzzle setup */}
        {step.puzzleSetup && (
          <div>
            <span className="text-[10px] text-indigo-300/50 font-medium">🧩 문제 설정</span>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">{step.puzzleSetup}</p>
          </div>
        )}

        {/* Puzzle solution */}
        {step.puzzleSolution && (
          <div>
            <span className="text-[10px] text-emerald-300/50 font-medium">✅ 풀이 방법</span>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">{step.puzzleSolution}</p>
          </div>
        )}

        {/* Answer */}
        {step.answer && (
          <div>
            <span className="text-[10px] text-amber-300/50 font-medium">🔑 정답</span>
            <p className="text-sm font-mono font-bold text-amber-200/70 bg-amber-500/[0.06] px-3 py-2 rounded-lg border border-amber-500/15 mt-1">
              {step.answer}
            </p>
          </div>
        )}

        {/* Description */}
        {step.description && (
          <div>
            <span className="text-[10px] text-white/25 font-medium">📝 설명</span>
            <p className="text-xs text-white/45 mt-1 leading-relaxed">{step.description}</p>
          </div>
        )}

        {/* Hint */}
        {step.hint && (
          <div>
            <span className="text-[10px] text-white/25 font-medium">💡 힌트</span>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">{step.hint}</p>
          </div>
        )}

        {/* X-KIT fields */}
        {step.answerType === 'xkit' && (
          <div className="p-3 rounded-lg border border-purple-500/15 bg-purple-500/[0.04]">
            <span className="text-[10px] text-purple-300/50 font-medium">📟 X-KIT</span>
            <div className="flex flex-col gap-2 mt-2">
              {step.xkitPrompt && (
                <div>
                  <span className="text-[9px] text-white/20 uppercase">Prompt</span>
                  <p className="text-xs text-white/50 mt-0.5">{step.xkitPrompt}</p>
                </div>
              )}
              {step.xkitAnswer && (
                <div>
                  <span className="text-[9px] text-white/20 uppercase">Answer</span>
                  <p className="text-xs font-mono text-purple-300/70 mt-0.5">{step.xkitAnswer}</p>
                </div>
              )}
              {step.xkitNextGuide && (
                <div>
                  <span className="text-[9px] text-white/20 uppercase">Next Guide</span>
                  <p className="text-xs text-white/40 mt-0.5 italic">{step.xkitNextGuide}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {step.notes && (
          <div>
            <span className="text-[10px] text-white/20 font-medium">메모</span>
            <p className="text-xs text-white/35 mt-1 leading-relaxed">{step.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
