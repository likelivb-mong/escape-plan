import type { GameFlowPlan, GameFlowStep, OutputType, AnswerType } from '../../types/gameFlow';
import {
  ANSWER_TYPE_LABELS,
  OUTPUT_LABELS,
  PROBLEM_MODE_LABELS,
} from '../../utils/gameFlow';
import { StageBadge, ProblemModeBadge, AnswerTypeBadge, OutputBadge, RoomBadge } from '../game-flow/badges';

const STAGE_ORDER = ['기', '승', '전', '반전', '결'] as const;

// ── Section header helper ──────────────────────────────────────────────────────

function DocSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20 mb-3">
      {children}
    </p>
  );
}

function DocSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 mt-7 pt-4 border-t border-white/[0.05]">
      {children}
    </h3>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DraftGameFlowSection({ plan }: { plan: GameFlowPlan }) {
  const { steps, rooms } = plan;

  // Room-by-room grouping
  const byRoom = rooms.map((room) => ({
    room,
    steps: steps.filter((s) => s.room === room),
  })).filter((g) => g.steps.length > 0);

  // Answer type summary
  const answerTypeCounts = steps.reduce<Record<string, number>>((acc, s) => {
    acc[s.answerType] = (acc[s.answerType] ?? 0) + 1;
    return acc;
  }, {});

  // xkit steps
  const xkitSteps = steps.filter((s) => s.answerType === 'xkit');

  // Device steps
  const deviceSteps = steps.filter(
    (s) => s.problemMode === 'device' || s.problemMode === 'clue_device',
  );

  return (
    <div>

      {/* ── Game Flow Summary ── */}
      <DocSectionTitle>Game Flow Summary</DocSectionTitle>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <SummaryStat label="총 스텝" value={String(steps.length)} />
        <SummaryStat label="공간 수" value={String(rooms.length)} />
        <SummaryStat label="X-KIT" value={String(xkitSteps.length)} />
        <SummaryStat label="장치 포함" value={String(deviceSteps.length)} />
      </div>

      {/* Stage breakdown */}
      <div className="flex items-center gap-2 mb-6">
        {STAGE_ORDER.map((stage) => {
          const count = steps.filter((s) => s.stageLabel === stage).length;
          if (count === 0) return null;
          return (
            <div key={stage} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02]">
              <StageBadge label={stage} />
              <span className="text-[10px] text-white/40">{count}스텝</span>
            </div>
          );
        })}
      </div>

      {/* ── Room-by-Room Step Plan ── */}
      <DocSectionTitle>Room-by-Room Step Plan</DocSectionTitle>
      <div className="flex flex-col gap-5 mb-2">
        {byRoom.map(({ room, steps: roomSteps }) => (
          <div key={room}>
            <div className="flex items-center gap-2 mb-2">
              <RoomBadge room={room} rooms={rooms} />
              <span className="text-[10px] text-white/25">{roomSteps.length}개 스텝</span>
            </div>
            <div className="flex flex-col gap-1.5 pl-2 border-l border-white/[0.06]">
              {roomSteps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Lock / Answer Type Summary ── */}
      <DocSectionTitle>Lock / Answer Type Summary</DocSectionTitle>
      <div className="flex flex-col gap-2 mb-2">
        {(Object.entries(answerTypeCounts) as [AnswerType, number][]).map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <AnswerTypeBadge type={type} />
            <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-white/20"
                style={{ width: `${(count / steps.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/35 tabular-nums w-5 text-right">{count}</span>
            <span className="text-[9px] text-white/20 w-24">{ANSWER_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* ── X-KIT Answer Summary ── */}
      {xkitSteps.length > 0 && (
        <>
          <DocSectionTitle>X-KIT Answer Summary</DocSectionTitle>
          <div className="flex flex-col gap-3 mb-2">
            {xkitSteps.map((step) => (
              <div
                key={step.id}
                className="px-3.5 py-3 rounded-xl border border-purple-400/15 bg-purple-500/[0.05]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-mono text-white/25">
                    STEP {String(step.stepNumber).padStart(2, '0')}
                  </span>
                  <StageBadge label={step.stageLabel} />
                  <span className="text-[10px] text-white/50 font-medium">{step.clueTitle}</span>
                </div>
                {step.xkitPrompt && (
                  <p className="text-[10px] text-white/35 mb-1">
                    <span className="text-white/20">프롬프트: </span>{step.xkitPrompt}
                  </p>
                )}
                {step.xkitAnswer && (
                  <p className="text-[10px] text-purple-300/75 font-mono font-semibold mb-1">
                    → {step.xkitAnswer}
                  </p>
                )}
                {step.xkitNextGuide && (
                  <p className="text-[10px] text-white/30 italic">
                    다음 가이드: {step.xkitNextGuide}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Device Trigger Summary ── */}
      {deviceSteps.length > 0 && (
        <>
          <DocSectionTitle>Device Trigger Summary</DocSectionTitle>
          <div className="flex flex-col gap-2 mb-2">
            {deviceSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04]">
                <span className="text-[9px] font-mono text-white/20 mt-0.5 w-6">
                  {String(step.stepNumber).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/65 font-medium mb-1">{step.clueTitle}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ProblemModeBadge mode={step.problemMode} size="xs" />
                    {step.deviceSubtype && (
                      <span className="px-1.5 py-0.5 rounded border border-amber-400/15 text-[8px] text-amber-300/60">
                        {step.deviceSubtype.replace(/_/g, ' ')}
                      </span>
                    )}
                    <OutputBadge output={step.output} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Step row (compact) ────────────────────────────────────────────────────────

function StepRow({ step }: { step: GameFlowStep }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-[9px] font-mono text-white/20 w-4 text-right">
        {String(step.stepNumber).padStart(2, '0')}
      </span>
      <StageBadge label={step.stageLabel} />
      <span className="text-[11px] text-white/60 flex-1 truncate">{step.clueTitle}</span>
      <ProblemModeBadge mode={step.problemMode} size="xs" />
      <AnswerTypeBadge type={step.answerType} size="xs" />
      <OutputBadge output={step.output} />
    </div>
  );
}

// ── Summary stat card ─────────────────────────────────────────────────────────

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] text-center">
      <p className="text-xl font-bold text-white/75 mb-0.5">{value}</p>
      <p className="text-[9px] text-white/25 font-medium">{label}</p>
    </div>
  );
}
