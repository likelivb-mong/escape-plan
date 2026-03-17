import { useState, useMemo } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel } from '../../types/gameFlow';
import { StageBadge, ProblemModeBadge, AnswerTypeBadge, OutputBadge, RoomBadge } from './badges';

// ── Compact icon labels for StepRow ──────────────────────────────────────────
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

          <span className="text-[11px] text-white/25 ml-auto tabular-nums">
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
                  <span className="text-[11px] text-white/30">{roomSteps.length} steps</span>
                </div>
                <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l border-white/[0.06]">
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
                  <span className="text-[11px] text-white/30">{stageSteps.length} steps</span>
                </div>
                <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l border-white/[0.06]">
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
            <p className="text-sm text-white/25">해당 조건에 맞는 스텝이 없습니다</p>
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
      <div className="rounded-xl border border-white/[0.10] bg-white/[0.03] p-4 my-1 transition-all">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-mono text-white/25 w-5 text-right tabular-nums">
            {String(step.stepNumber).padStart(2, '0')}
          </span>
          <StageBadge label={step.stageLabel} />
          <RoomBadge room={step.room} rooms={rooms} />
          <div className="flex-1" />
          <button
            onClick={onToggleEdit}
            className="text-[11px] text-white/35 hover:text-white/60 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/[0.04]"
          >
            Done
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="단서 제목" value={step.clueTitle} onChange={(v) => onUpdate({ clueTitle: v })} />
          <Field label="정답" value={step.answer} onChange={(v) => onUpdate({ answer: v })} />
          <Field label="설명" value={step.description ?? ''} onChange={(v) => onUpdate({ description: v })} multiline className="sm:col-span-2" />
          <Field label="힌트" value={step.hint ?? ''} onChange={(v) => onUpdate({ hint: v })} />
          <Field label="메모" value={step.notes ?? ''} onChange={(v) => onUpdate({ notes: v })} multiline />
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-white/[0.06]">
          <ProblemModeBadge mode={step.problemMode} size="xs" />
          <AnswerTypeBadge type={step.answerType} size="xs" />
          <OutputBadge output={step.output} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 py-2 px-2 -mx-2 group cursor-pointer rounded-lg hover:bg-white/[0.03] transition-all"
      onClick={onToggleEdit}
    >
      <span className="text-[10px] font-mono text-white/20 w-5 text-right tabular-nums flex-shrink-0">
        {String(step.stepNumber).padStart(2, '0')}
      </span>
      <StageBadge label={step.stageLabel} />
      <span className="text-[13px] text-white/70 flex-1 truncate">{step.clueTitle}</span>
      {step.answer && (
        <span className="text-[11px] font-mono font-semibold text-amber-300/70 bg-amber-500/[0.08] px-2 py-0.5 rounded border border-amber-500/15 truncate max-w-[120px] flex-shrink-0">
          {step.answer}
        </span>
      )}
      <div className="hidden sm:flex items-center gap-0.5 text-[11px] text-white/30 flex-shrink-0">
        <span className="text-[10px]">{MODE_ICON[step.problemMode] ?? '🧩'}</span>
        <span>{MODE_SHORT[step.problemMode] ?? step.problemMode}</span>
        <span className="text-white/10 mx-0.5">·</span>
        <span className="text-[10px]">{ANSWER_ICON[step.answerType] ?? '🔢'}</span>
        <span>{ANSWER_SHORT[step.answerType] ?? step.answerType}</span>
        <span className="text-white/10 mx-0.5">·</span>
        <span className="text-[10px]">{OUTPUT_ICON[step.output] ?? '🚪'}</span>
        <span>{OUTPUT_SHORT[step.output] ?? step.output}</span>
      </div>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, multiline, className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const inputClass = 'w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white/75 outline-none focus:border-white/[0.18] focus:bg-white/[0.06] transition-all placeholder:text-white/15';
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{label}</label>
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
          ? 'bg-white/[0.10] text-white/75 border border-white/[0.12]'
          : 'text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.04]'
      }`}
    >
      {children}
    </button>
  );
}
