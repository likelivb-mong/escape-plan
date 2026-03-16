import { useMemo } from 'react';
import type { GameFlowPlan, AnswerType, StageLabel } from '../../types/gameFlow';
import { ANSWER_TYPE_LABELS } from '../../utils/gameFlow';
import { StageBadge, ProblemModeBadge, AnswerTypeBadge, OutputBadge } from './badges';

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

interface GameFlowSummaryViewProps {
  plan: GameFlowPlan;
}

export default function GameFlowSummaryView({ plan }: GameFlowSummaryViewProps) {
  const { steps, rooms } = plan;

  const xkitSteps = useMemo(() => steps.filter((s) => s.answerType === 'xkit'), [steps]);
  const deviceSteps = useMemo(() =>
    steps.filter((s) => s.problemMode === 'device' || s.problemMode === 'clue_device'),
    [steps],
  );

  const answerTypeCounts = useMemo(() =>
    steps.reduce<Record<string, number>>((acc, s) => {
      acc[s.answerType] = (acc[s.answerType] ?? 0) + 1;
      return acc;
    }, {}),
    [steps],
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-5 max-w-3xl">

        {/* ── Overview Stats ── */}
        <SectionTitle>Game Flow Overview</SectionTitle>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="총 스텝" value={String(steps.length)} />
          <StatCard label="공간 수" value={String(rooms.length)} />
          <StatCard label="X-KIT" value={String(xkitSteps.length)} />
          <StatCard label="장치 포함" value={String(deviceSteps.length)} />
        </div>

        {/* Stage breakdown */}
        <div className="flex items-center gap-2 mb-8">
          {STAGE_ORDER.map((stage) => {
            const count = steps.filter((s) => s.stageLabel === stage).length;
            if (count === 0) return null;
            return (
              <div key={stage} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02]">
                <StageBadge label={stage} />
                <span className="text-caption text-white/40">{count}스텝</span>
              </div>
            );
          })}
        </div>

        {/* ── Lock / Answer Type Summary ── */}
        <SectionTitle>Lock / Answer Type Summary</SectionTitle>
        <div className="flex flex-col gap-2 mb-8">
          {(Object.entries(answerTypeCounts) as [AnswerType, number][]).map(([type, count]) => (
            <div key={type} className="flex items-center gap-3">
              <AnswerTypeBadge type={type} />
              <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/20"
                  style={{ width: `${(count / steps.length) * 100}%` }}
                />
              </div>
              <span className="text-caption text-white/35 tabular-nums w-5 text-right">{count}</span>
              <span className="text-micro text-white/30 w-24">{ANSWER_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>

        {/* ── X-KIT Answer Summary ── */}
        {xkitSteps.length > 0 && (
          <>
            <SectionTitle>X-KIT Answer Summary</SectionTitle>
            <div className="flex flex-col gap-3 mb-8">
              {xkitSteps.map((step) => (
                <div
                  key={step.id}
                  className="px-3.5 py-3 rounded-xl border border-purple-400/15 bg-purple-500/[0.05]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-micro font-mono text-white/25">
                      STEP {String(step.stepNumber).padStart(2, '0')}
                    </span>
                    <StageBadge label={step.stageLabel} />
                    <span className="text-caption text-white/50 font-medium">{step.clueTitle}</span>
                  </div>
                  {step.xkitPrompt && (
                    <p className="text-caption text-white/35 mb-1">
                      <span className="text-white/20">프롬프트: </span>{step.xkitPrompt}
                    </p>
                  )}
                  {step.xkitAnswer && (
                    <p className="text-caption text-purple-300/75 font-mono font-semibold mb-1">
                      → {step.xkitAnswer}
                    </p>
                  )}
                  {step.xkitNextGuide && (
                    <p className="text-caption text-white/30 italic">
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
            <SectionTitle>Device Trigger Summary</SectionTitle>
            <div className="flex flex-col gap-2 mb-8">
              {deviceSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04]">
                  <span className="text-micro font-mono text-white/20 mt-0.5 w-6">
                    {String(step.stepNumber).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-footnote text-white/65 font-medium mb-1">{step.clueTitle}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ProblemModeBadge mode={step.problemMode} size="xs" />
                      {step.deviceSubtype && (
                        <span className="px-1.5 py-0.5 rounded border border-amber-400/15 text-micro text-amber-300/60">
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

        {/* Empty state for no special steps */}
        {xkitSteps.length === 0 && deviceSteps.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-subhead text-white/30">X-KIT 및 장치 포함 스텝이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section title ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-subhead font-bold uppercase tracking-widest text-white/30 mb-4 mt-2 pt-4 border-t border-white/[0.05] first:border-t-0 first:mt-0 first:pt-0">
      {children}
    </h3>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] text-center">
      <p className="text-title2 font-bold text-white/75 mb-0.5">{value}</p>
      <p className="text-micro text-white/35 font-medium">{label}</p>
    </div>
  );
}
