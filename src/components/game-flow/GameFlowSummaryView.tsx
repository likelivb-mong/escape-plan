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

  const maxCount = Math.max(...Object.values(answerTypeCounts), 1);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">

        {/* ── Overview ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Steps" value={steps.length} />
          <StatCard label="Rooms" value={rooms.length} />
          <StatCard label="X-KIT" value={xkitSteps.length} accent={xkitSteps.length > 0 ? 'purple' : undefined} />
          <StatCard label="Devices" value={deviceSteps.length} accent={deviceSteps.length > 0 ? 'amber' : undefined} />
        </div>

        {/* ── Stage Distribution ── */}
        <Section title="Stage Distribution">
          <div className="flex items-center gap-2 flex-wrap">
            {STAGE_ORDER.map((stage) => {
              const count = steps.filter((s) => s.stageLabel === stage).length;
              return (
                <div
                  key={stage}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] min-w-[80px]"
                >
                  <StageBadge label={stage} />
                  <span className="text-sm font-semibold text-white/60 tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Answer Type Distribution ── */}
        <Section title="Lock / Answer Types">
          <div className="flex flex-col gap-2.5">
            {(Object.entries(answerTypeCounts) as [AnswerType, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <div className="w-20 flex-shrink-0">
                  <AnswerTypeBadge type={type} />
                </div>
                <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-white/15 to-white/25 transition-all duration-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white/40 tabular-nums w-6 text-right font-medium">{count}</span>
                <span className="text-[10px] text-white/25 w-16 hidden sm:block truncate">
                  {ANSWER_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── X-KIT Summary ── */}
        {xkitSteps.length > 0 && (
          <Section title="X-KIT Answers">
            <div className="flex flex-col gap-3">
              {xkitSteps.map((step) => (
                <div
                  key={step.id}
                  className="p-4 rounded-xl border border-purple-500/15 bg-purple-500/[0.04]"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-mono text-white/25 tabular-nums">
                      #{String(step.stepNumber).padStart(2, '0')}
                    </span>
                    <StageBadge label={step.stageLabel} />
                    <span className="text-[13px] text-white/60 font-medium">{step.clueTitle}</span>
                  </div>
                  {step.xkitPrompt && (
                    <p className="text-xs text-white/35 mb-1.5 leading-relaxed">
                      <span className="text-white/20 mr-1">Prompt:</span>{step.xkitPrompt}
                    </p>
                  )}
                  {step.xkitAnswer && (
                    <p className="text-sm text-purple-300/80 font-mono font-semibold">
                      → {step.xkitAnswer}
                    </p>
                  )}
                  {step.xkitNextGuide && (
                    <p className="text-xs text-white/25 mt-1.5 italic">
                      Next: {step.xkitNextGuide}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Device Summary ── */}
        {deviceSteps.length > 0 && (
          <Section title="Device Triggers">
            <div className="flex flex-col gap-1">
              {deviceSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-[10px] font-mono text-white/20 w-6 text-right tabular-nums flex-shrink-0">
                    #{String(step.stepNumber).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-white/60 font-medium flex-1 min-w-0 truncate">
                    {step.clueTitle}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ProblemModeBadge mode={step.problemMode} size="xs" />
                    {step.deviceSubtype && (
                      <span className="px-2 py-0.5 rounded-md border border-amber-400/15 text-[10px] text-amber-300/60 hidden sm:inline-block">
                        {step.deviceSubtype.replace(/_/g, ' ')}
                      </span>
                    )}
                    <OutputBadge output={step.output} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Empty */}
        {xkitSteps.length === 0 && deviceSteps.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-white/25">X-KIT 및 장치 포함 스텝이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-4 pb-2 border-b border-white/[0.05]">
        {title}
      </h3>
      {children}
    </section>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'purple' | 'amber' }) {
  const accentClass = accent === 'purple'
    ? 'border-purple-500/15 bg-purple-500/[0.04]'
    : accent === 'amber'
    ? 'border-amber-500/15 bg-amber-500/[0.04]'
    : 'border-white/[0.06] bg-white/[0.02]';

  const valueClass = accent === 'purple'
    ? 'text-purple-300/80'
    : accent === 'amber'
    ? 'text-amber-300/80'
    : 'text-white/75';

  return (
    <div className={`px-4 py-3.5 rounded-xl border text-center ${accentClass}`}>
      <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-[10px] text-white/30 font-medium mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}
