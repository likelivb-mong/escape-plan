import { useState, useMemo } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel } from '../../types/gameFlow';
import { StageBadge, RoomBadge } from './badges';
import { TechSettingsBar } from './TechSettings';

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

type ViewMode = 'room' | 'stage';

interface GameFlowStepsViewProps {
  plan: GameFlowPlan;
  onUpdatePlan: (plan: GameFlowPlan) => void;
}

export default function GameFlowStepsView({ plan, onUpdatePlan }: GameFlowStepsViewProps) {
  const { steps, rooms } = plan;
  const [viewMode, setViewMode] = useState<ViewMode>('stage');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<StageLabel | 'all'>('all');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const filtered = useMemo(() => steps.filter((s) => {
    if (filterRoom !== 'all' && s.room !== filterRoom) return false;
    if (filterStage !== 'all' && s.stageLabel !== filterStage) return false;
    return true;
  }), [steps, filterRoom, filterStage]);

  const byRoom = useMemo(() =>
    rooms.map((room) => ({
      room,
      steps: filtered.filter((s) => s.room === room),
    })).filter((g) => g.steps.length > 0),
    [rooms, filtered],
  );

  const byStage = useMemo(() =>
    STAGE_ORDER.map((stage) => ({
      stage,
      steps: filtered.filter((s) => s.stageLabel === stage),
    })).filter((g) => g.steps.length > 0),
    [filtered],
  );

  const handleUpdateStep = (stepId: string, updates: Partial<GameFlowStep>) => {
    onUpdatePlan({
      ...plan,
      steps: plan.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <SegmentButton active={viewMode === 'stage'} onClick={() => setViewMode('stage')}>
              단계별
            </SegmentButton>
            <SegmentButton active={viewMode === 'room'} onClick={() => setViewMode('room')}>
              공간별
            </SegmentButton>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 flex-wrap">
            {viewMode === 'room' && (
              <>
                <Chip active={filterRoom === 'all'} onClick={() => setFilterRoom('all')}>All</Chip>
                {rooms.map((room) => (
                  <Chip key={room} active={filterRoom === room} onClick={() => setFilterRoom(filterRoom === room ? 'all' : room)}>
                    {room}
                  </Chip>
                ))}
              </>
            )}
            {viewMode === 'stage' && (
              <>
                <Chip active={filterStage === 'all'} onClick={() => setFilterStage('all')}>All</Chip>
                {STAGE_ORDER.map((stage) => (
                  <Chip key={stage} active={filterStage === stage} onClick={() => setFilterStage(filterStage === stage ? 'all' : stage)}>
                    {stage}
                  </Chip>
                ))}
              </>
            )}
          </div>

          <span className="text-[11px] text-white/30 ml-auto tabular-nums font-mono">
            {filtered.length}/{steps.length}
          </span>
        </div>

        {/* ── Grouped list ── */}
        <div className="flex flex-col gap-8">
          {viewMode === 'room' ? (
            byRoom.map(({ room, steps: roomSteps }) => (
              <section key={room}>
                <div className="flex items-center gap-2.5 mb-3">
                  <RoomBadge room={room} rooms={rooms} />
                  <span className="text-[11px] text-white/35 font-mono">{roomSteps.length} steps</span>
                </div>
                <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l-2 border-white/[0.06]">
                  {roomSteps.map((step) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      rooms={rooms}
                      isEditing={editingStepId === step.id}
                      onToggleEdit={() => setEditingStepId(editingStepId === step.id ? null : step.id)}
                      onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            byStage.map(({ stage, steps: stageSteps }) => (
              <section key={stage}>
                <div className="flex items-center gap-2.5 mb-3">
                  <StageBadge label={stage} />
                  <span className="text-[11px] text-white/35 font-mono">{stageSteps.length} steps</span>
                </div>
                <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l-2 border-white/[0.06]">
                  {stageSteps.map((step) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      rooms={rooms}
                      isEditing={editingStepId === step.id}
                      onToggleEdit={() => setEditingStepId(editingStepId === step.id ? null : step.id)}
                      onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-white/30">해당 조건에 맞는 스텝이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step Row (collapsed / expanded) ──────────────────────────────────────────

function StepRow({
  step, rooms, isEditing, onToggleEdit, onUpdate,
}: {
  step: GameFlowStep;
  rooms: string[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (updates: Partial<GameFlowStep>) => void;
}) {
  if (isEditing) {
    return (
      <div className="rounded-xl border border-white/[0.12] bg-white/[0.03] p-4 my-1 transition-all">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-mono font-semibold text-white/35 tabular-nums">
            #{String(step.stepNumber).padStart(2, '0')}
          </span>
          <StageBadge label={step.stageLabel} />
          <RoomBadge room={step.room} rooms={rooms} />
          <div className="flex-1" />
          <button
            onClick={onToggleEdit}
            className="text-[11px] text-white/40 hover:text-white/70 transition-colors px-3 py-1 rounded-lg hover:bg-white/[0.05] font-medium"
          >
            Done
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="단서 제목" value={step.clueTitle} onChange={(v) => onUpdate({ clueTitle: v })} />
          <Field label="정답" value={step.answer} onChange={(v) => onUpdate({ answer: v })} mono />
          <Field label="설명" value={step.description ?? ''} onChange={(v) => onUpdate({ description: v })} multiline className="sm:col-span-2" />
          <Field label="힌트" value={step.hint ?? ''} onChange={(v) => onUpdate({ hint: v })} />
          <Field label="메모" value={step.notes ?? ''} onChange={(v) => onUpdate({ notes: v })} multiline />
        </div>

        {/* Tech settings: [방식|입력] ▸ [출력] — editable */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <TechSettingsBar
            problemMode={step.problemMode}
            answerType={step.answerType}
            output={step.output}
            onChangeMode={(v) => onUpdate({ problemMode: v as GameFlowStep['problemMode'] })}
            onChangeAnswer={(v) => onUpdate({ answerType: v as GameFlowStep['answerType'] })}
            onChangeOutput={(v) => onUpdate({ output: v as GameFlowStep['output'] })}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 py-2.5 px-3 -mx-2 group cursor-pointer rounded-lg hover:bg-white/[0.04] transition-all"
      onClick={onToggleEdit}
    >
      <span className="text-[11px] font-mono font-semibold text-white/30 w-6 text-right tabular-nums flex-shrink-0">
        {String(step.stepNumber).padStart(2, '0')}
      </span>
      <StageBadge label={step.stageLabel} />
      <span className="text-[13px] font-medium text-white/80 flex-1 truncate">{step.clueTitle}</span>

      {/* Answer */}
      {step.answer && (
        <span className="text-[11px] font-mono font-bold text-amber-200/80 bg-amber-500/[0.10] px-2 py-0.5 rounded border border-amber-500/15 truncate max-w-[120px] flex-shrink-0">
          {step.answer}
        </span>
      )}

      {/* Compact meta: [방식|입력] ▸ [출력] */}
      <div className="hidden sm:flex flex-shrink-0">
        <TechSettingsBar
          problemMode={step.problemMode}
          answerType={step.answerType}
          output={step.output}
          compact
        />
      </div>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, multiline, mono, className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  mono?: boolean;
  className?: string;
}) {
  const inputClass = `w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] outline-none focus:border-white/[0.20] focus:bg-white/[0.06] transition-all placeholder:text-white/15 ${
    mono ? 'font-mono font-semibold text-white/85' : 'text-white/80'
  }`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  );
}

// ── Segment Button ───────────────────────────────────────────────────────────

function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 ${
        active ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white/60'
      }`}
    >
      {children}
    </button>
  );
}

// ── Filter Chip ──────────────────────────────────────────────────────────────

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
        active
          ? 'bg-white/[0.10] text-white/80 border border-white/[0.15]'
          : 'text-white/30 border border-transparent hover:text-white/55 hover:bg-white/[0.04]'
      }`}
    >
      {children}
    </button>
  );
}
