import { useState, useMemo } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel } from '../../types/gameFlow';
import { StageBadge, ProblemModeBadge, AnswerTypeBadge, OutputBadge, RoomBadge } from './badges';

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
      <div className="px-4 sm:px-6 lg:px-10 py-5 max-w-3xl">
        {/* View Mode & Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-0.5 p-0.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
            <TabButton active={viewMode === 'stage'} onClick={() => setViewMode('stage')}>
              단계별
            </TabButton>
            <TabButton active={viewMode === 'room'} onClick={() => setViewMode('room')}>
              공간별
            </TabButton>
          </div>

          {viewMode === 'room' && (
            <div className="flex items-center gap-1 flex-wrap">
              <FilterChip active={filterRoom === 'all'} onClick={() => setFilterRoom('all')}>전체</FilterChip>
              {rooms.map((room) => (
                <FilterChip key={room} active={filterRoom === room} onClick={() => setFilterRoom(filterRoom === room ? 'all' : room)}>
                  {room}
                </FilterChip>
              ))}
            </div>
          )}

          {viewMode === 'stage' && (
            <div className="flex items-center gap-1 flex-wrap">
              <FilterChip active={filterStage === 'all'} onClick={() => setFilterStage('all')}>전체</FilterChip>
              {STAGE_ORDER.map((stage) => (
                <FilterChip key={stage} active={filterStage === stage} onClick={() => setFilterStage(filterStage === stage ? 'all' : stage)}>
                  {stage}
                </FilterChip>
              ))}
            </div>
          )}

          <span className="text-caption text-white/35 ml-auto">
            {filtered.length} / {steps.length} 스텝
          </span>
        </div>

        {/* Grouped step list */}
        {viewMode === 'room' ? (
          <div className="flex flex-col gap-5">
            {byRoom.map(({ room, steps: roomSteps }) => (
              <div key={room}>
                <div className="flex items-center gap-2 mb-2">
                  <RoomBadge room={room} rooms={rooms} />
                  <span className="text-caption text-white/35">{roomSteps.length}개 스텝</span>
                </div>
                <div className="flex flex-col gap-1 pl-2 border-l border-white/[0.06]">
                  {roomSteps.map((step) => (
                    <EditableStepRow
                      key={step.id}
                      step={step}
                      rooms={rooms}
                      isEditing={editingStepId === step.id}
                      onToggleEdit={() => setEditingStepId(editingStepId === step.id ? null : step.id)}
                      onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {byStage.map(({ stage, steps: stageSteps }) => (
              <div key={stage}>
                <div className="flex items-center gap-2 mb-2">
                  <StageBadge label={stage} />
                  <span className="text-caption text-white/35">{stageSteps.length}개 스텝</span>
                </div>
                <div className="flex flex-col gap-1 pl-2 border-l border-white/[0.06]">
                  {stageSteps.map((step) => (
                    <EditableStepRow
                      key={step.id}
                      step={step}
                      rooms={rooms}
                      isEditing={editingStepId === step.id}
                      onToggleEdit={() => setEditingStepId(editingStepId === step.id ? null : step.id)}
                      onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Editable Step Row ────────────────────────────────────────────────────────

function EditableStepRow({
  step,
  rooms,
  isEditing,
  onToggleEdit,
  onUpdate,
}: {
  step: GameFlowStep;
  rooms: string[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (updates: Partial<GameFlowStep>) => void;
}) {
  if (isEditing) {
    return (
      <div className="px-3 py-3 rounded-xl border border-white/[0.12] bg-white/[0.04] mb-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-micro font-mono text-white/25 w-4 text-right">
            {String(step.stepNumber).padStart(2, '0')}
          </span>
          <StageBadge label={step.stageLabel} />
          <RoomBadge room={step.room} rooms={rooms} />
          <div className="flex-1" />
          <button
            onClick={onToggleEdit}
            className="text-micro text-white/30 hover:text-white/60 transition-colors px-2 py-0.5 rounded border border-white/[0.08]"
          >
            접기
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <EditField label="단서 제목" value={step.clueTitle} onChange={(v) => onUpdate({ clueTitle: v })} />
          <EditField label="정답" value={step.answer} onChange={(v) => onUpdate({ answer: v })} />
          <EditField label="설명" value={step.description ?? ''} onChange={(v) => onUpdate({ description: v })} multiline />
          <EditField label="힌트" value={step.hint ?? ''} onChange={(v) => onUpdate({ hint: v })} />
          <EditField label="메모" value={step.notes ?? ''} onChange={(v) => onUpdate({ notes: v })} multiline />
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <ProblemModeBadge mode={step.problemMode} size="xs" />
            <AnswerTypeBadge type={step.answerType} size="xs" />
            <OutputBadge output={step.output} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 py-1.5 group cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 -mx-1"
      onClick={onToggleEdit}
    >
      <span className="text-micro font-mono text-white/20 w-4 text-right">
        {String(step.stepNumber).padStart(2, '0')}
      </span>
      <StageBadge label={step.stageLabel} />
      <span className="text-footnote text-white/60 flex-1 truncate">{step.clueTitle}</span>
      <ProblemModeBadge mode={step.problemMode} size="xs" />
      <AnswerTypeBadge type={step.answerType} size="xs" />
      <OutputBadge output={step.output} />
      <span className="text-micro text-white/15 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
        ✎
      </span>
    </div>
  );
}

// ── Edit field ──────────────────────────────────────────────────────────────

function EditField({
  label, value, onChange, multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-micro text-white/35 font-medium uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.03] text-footnote text-white/70 outline-none focus:border-white/25 transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.03] text-footnote text-white/70 outline-none focus:border-white/25 transition-colors"
        />
      )}
    </div>
  );
}

// ── Tab button ──────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-full text-caption font-medium transition-all duration-150',
        active ? 'bg-white text-black' : 'text-white/40 hover:text-white/65',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-0.5 rounded-full border text-caption font-medium transition-all duration-150',
        active
          ? 'bg-white/10 text-white/75 border-white/15'
          : 'text-white/30 border-white/[0.07] hover:text-white/55 hover:border-white/12',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
