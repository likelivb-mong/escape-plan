import { useMemo, useState } from 'react';
import type { GameFlowPlan, AnswerType, StageLabel, GameFlowStep } from '../../types/gameFlow';
import { ANSWER_TYPE_LABELS } from '../../utils/gameFlow';
import { StageBadge, ProblemModeBadge, AnswerTypeBadge, OutputBadge } from './badges';

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

type SummaryTab = 'all' | 'lock' | 'keypad' | 'xkit' | 'device';

interface GameFlowSummaryViewProps {
  plan: GameFlowPlan;
}

export default function GameFlowSummaryView({ plan }: GameFlowSummaryViewProps) {
  const { steps, rooms } = plan;
  const [activeTab, setActiveTab] = useState<SummaryTab>('all');
  const [lockOpen, setLockOpen] = useState(false);

  const lockAnswerTypes: AnswerType[] = ['key', 'number_4', 'number_3', 'alphabet_5'];
  const keypadAnswerTypes: AnswerType[] = ['keypad', 'auto'];

  const lockAnswerSteps = useMemo(() =>
    steps.filter((s) => lockAnswerTypes.includes(s.answerType)).sort((a, b) => a.stepNumber - b.stepNumber),
    [steps],
  );
  const keypadAnswerSteps = useMemo(() =>
    steps.filter((s) => keypadAnswerTypes.includes(s.answerType)).sort((a, b) => a.stepNumber - b.stepNumber),
    [steps],
  );
  const xkitSteps = useMemo(() =>
    steps.filter((s) => s.answerType === 'xkit').sort((a, b) => a.stepNumber - b.stepNumber),
    [steps],
  );
  const deviceSteps = useMemo(() =>
    steps.filter((s) => s.problemMode === 'device' || s.problemMode === 'clue_device').sort((a, b) => a.stepNumber - b.stepNumber),
    [steps],
  );

  const answerTypeCounts = useMemo(() =>
    steps.reduce<Record<string, number>>((acc, s) => {
      acc[s.answerType] = (acc[s.answerType] ?? 0) + 1;
      return acc;
    }, {}),
    [steps],
  );

  const totalLockCount = lockAnswerSteps.length + keypadAnswerSteps.length;

  const TABS: Array<{ key: SummaryTab; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'lock', label: 'Lock Answers' },
    { key: 'keypad', label: 'Keypad Answers' },
    { key: 'xkit', label: 'X-KIT Answers' },
    { key: 'device', label: 'Device Triggers' },
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">

        {/* ── Overview ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] min-w-fit"
                >
                  <StageBadge label={stage} />
                  <span className="font-semibold text-white/60 tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06] my-6 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content by Tab ── */}
        <div className="flex-1">
          {activeTab === 'all' && (
            <>
              {/* 🔒 Lock/Keypad toggle button */}
              <div className="mb-6">
                <button
                  onClick={() => setLockOpen(!lockOpen)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all w-full ${
                    lockOpen
                      ? 'border-white/[0.12] bg-white/[0.05] text-white/70'
                      : 'border-white/[0.07] bg-white/[0.02] text-white/40 hover:border-white/[0.10] hover:text-white/55'
                  }`}
                >
                  <span>🔒</span>
                  <span className="text-lg font-bold tabular-nums">{totalLockCount}</span>
                  <span className="text-xs text-white/30">잠금장치</span>
                  <div className="flex-1" />
                  <svg
                    className={`w-4 h-4 text-white/25 transition-transform ${lockOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {lockOpen && (
                  <div className="mt-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col gap-6">
                    {/* Lock answer types */}
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-3">Lock / Answer Types</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(Object.entries(answerTypeCounts) as [AnswerType, number][])
                          .filter(([type]) => lockAnswerTypes.includes(type))
                          .sort(([, a], [, b]) => b - a)
                          .map(([type, count]) => (
                          <div key={type} className="flex items-center gap-2 text-xs">
                            <AnswerTypeBadge type={type} />
                            <span className="text-white/50 flex-1">{ANSWER_TYPE_LABELS[type]}</span>
                            <span className="text-white/30 tabular-nums">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Keypad answer types */}
                    {keypadAnswerSteps.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-3">Keypad Answers</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(Object.entries(answerTypeCounts) as [AnswerType, number][])
                            .filter(([type]) => keypadAnswerTypes.includes(type))
                            .map(([type, count]) => (
                            <div key={type} className="flex items-center gap-2 text-xs">
                              <AnswerTypeBadge type={type} />
                              <span className="text-white/50 flex-1">{ANSWER_TYPE_LABELS[type]}</span>
                              <span className="text-white/30 tabular-nums">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {xkitSteps.length > 0 && <XKitSection steps={xkitSteps} />}
              {deviceSteps.length > 0 && <DeviceSection steps={deviceSteps} />}
            </>
          )}

          {activeTab === 'lock' && (
            lockAnswerSteps.length > 0 ? (
              <Section title="Lock Answers">
                <div className="flex flex-col gap-4">
                  {lockAnswerSteps.map((step) => (
                    <AnswerStepCard key={step.id} step={step} />
                  ))}
                </div>
              </Section>
            ) : (
              <EmptyState message="No lock answers found" />
            )
          )}

          {activeTab === 'keypad' && (
            keypadAnswerSteps.length > 0 ? (
              <Section title="Keypad Answers">
                <div className="flex flex-col gap-4">
                  {keypadAnswerSteps.map((step) => (
                    <AnswerStepCard key={step.id} step={step} />
                  ))}
                </div>
              </Section>
            ) : (
              <EmptyState message="No keypad answers found" />
            )
          )}

          {activeTab === 'xkit' && (
            xkitSteps.length > 0 ? <XKitSection steps={xkitSteps} /> : <EmptyState message="X-KIT answers not found" />
          )}

          {activeTab === 'device' && (
            deviceSteps.length > 0 ? <DeviceSection steps={deviceSteps} /> : <EmptyState message="Device triggers not found" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Answer Step Card ─────────────────────────────────────────────────────────

function AnswerStepCard({ step }: { step: GameFlowStep }) {
  return (
    <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[10px] font-mono text-white/25 tabular-nums w-6">
          #{String(step.stepNumber).padStart(2, '0')}
        </span>
        <StageBadge label={step.stageLabel} />
        <span className="text-xs text-white/40">{step.room}</span>
        <span className="text-[13px] text-white/65 font-medium flex-1 truncate">{step.clueTitle}</span>
      </div>

      <div className="flex flex-col gap-2.5 ml-8">
        {/* Answer (strong emphasis) */}
        {step.answer && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AnswerTypeBadge type={step.answerType} />
              <span className="text-[10px] text-white/30 uppercase">Answer</span>
            </div>
            <p className="text-sm font-mono font-bold text-white/80 bg-white/[0.06] px-3 py-2 rounded-lg border border-white/[0.10]">
              {step.answer}
            </p>
          </div>
        )}

        {/* Description / Hint / Notes */}
        <div className="flex flex-col gap-2">
          {step.description && (
            <div>
              <span className="text-[10px] text-white/25 uppercase">Description</span>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">{step.description}</p>
            </div>
          )}
          {step.hint && (
            <div>
              <span className="text-[10px] text-white/25 uppercase">Hint</span>
              <p className="text-xs text-white/45 mt-1 leading-relaxed">{step.hint}</p>
            </div>
          )}
          {step.notes && (
            <div>
              <span className="text-[10px] text-white/25 uppercase">Notes</span>
              <p className="text-xs text-white/40 mt-1 leading-relaxed">{step.notes}</p>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          <ProblemModeBadge mode={step.problemMode} size="xs" />
          <OutputBadge output={step.output} />
        </div>
      </div>
    </div>
  );
}

// ── X-KIT Section ────────────────────────────────────────────────────────────

function XKitSection({ steps }: { steps: GameFlowStep[] }) {
  return (
    <Section title="X-KIT Answers">
      <div className="flex flex-col gap-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="p-4 rounded-xl border border-purple-500/15 bg-purple-500/[0.04]"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[10px] font-mono text-white/25 tabular-nums w-6">
                #{String(step.stepNumber).padStart(2, '0')}
              </span>
              <StageBadge label={step.stageLabel} />
              <span className="text-xs text-white/40">{step.room}</span>
              <span className="text-[13px] text-white/65 font-medium flex-1 truncate">{step.clueTitle}</span>
            </div>

            <div className="ml-8 flex flex-col gap-2.5">
              {step.xkitPrompt && (
                <div>
                  <span className="text-[10px] text-white/25 uppercase">Prompt</span>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{step.xkitPrompt}</p>
                </div>
              )}
              {step.xkitAnswer && (
                <div>
                  <span className="text-[10px] text-white/25 uppercase">Answer</span>
                  <p className="text-sm font-mono font-bold text-purple-300 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20 mt-1">
                    {step.xkitAnswer}
                  </p>
                </div>
              )}
              {step.xkitNextGuide && (
                <div>
                  <span className="text-[10px] text-white/25 uppercase">Next Guide</span>
                  <p className="text-xs text-white/40 mt-1 italic">{step.xkitNextGuide}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Device Section ───────────────────────────────────────────────────────────

function DeviceSection({ steps }: { steps: GameFlowStep[] }) {
  return (
    <Section title="Device Triggers">
      <div className="flex flex-col gap-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.04]"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[10px] font-mono text-white/25 tabular-nums w-6">
                #{String(step.stepNumber).padStart(2, '0')}
              </span>
              <StageBadge label={step.stageLabel} />
              <span className="text-xs text-white/40">{step.room}</span>
              <span className="text-[13px] text-white/65 font-medium flex-1 truncate">{step.clueTitle}</span>
            </div>

            <div className="ml-8 flex flex-col gap-2.5">
              {/* Answer (for device) */}
              {step.answer && (
                <div>
                  <span className="text-[10px] text-white/25 uppercase">Answer</span>
                  <p className="text-sm font-mono font-bold text-white/80 bg-white/[0.06] px-3 py-2 rounded-lg border border-white/[0.10] mt-1">
                    {step.answer}
                  </p>
                </div>
              )}

              {/* Problem mode and device subtype */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/25 uppercase">Device Type</span>
                <ProblemModeBadge mode={step.problemMode} size="xs" />
                {step.deviceSubtype && (
                  <span className="px-2.5 py-1 rounded-lg border border-amber-400/20 text-[10px] text-amber-300/70 bg-amber-500/[0.05]">
                    {step.deviceSubtype.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Description / Notes */}
              <div className="flex flex-col gap-2">
                {step.description && (
                  <div>
                    <span className="text-[10px] text-white/25 uppercase">Description</span>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                )}
                {step.notes && (
                  <div>
                    <span className="text-[10px] text-white/25 uppercase">Notes</span>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">{step.notes}</p>
                  </div>
                )}
              </div>

              {/* Output */}
              <div className="flex items-center gap-2">
                <OutputBadge output={step.output} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-white/25">{message}</p>
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
