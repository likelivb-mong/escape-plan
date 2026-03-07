import { useState } from 'react';
import type { GameFlowPlan, GameFlowStep, OutputType, AnswerType, StageLabel } from '../../types/gameFlow';
import {
  ANSWER_TYPE_LABELS,
  OUTPUT_LABELS,
  PROBLEM_MODE_LABELS,
} from '../../utils/gameFlow';
import { StageBadge, ProblemModeBadge, AnswerTypeBadge, OutputBadge, RoomBadge } from '../game-flow/badges';

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

type ViewMode = 'room' | 'stage';

// ── Section header helpers ──────────────────────────────────────────────────

function DocSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 mt-7 pt-4 border-t border-white/[0.05]">
      {children}
    </h3>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface DraftGameFlowSectionProps {
  plan: GameFlowPlan;
  onUpdatePlan?: (plan: GameFlowPlan) => void;
}

export default function DraftGameFlowSection({ plan, onUpdatePlan }: DraftGameFlowSectionProps) {
  const { steps, rooms } = plan;
  const [viewMode, setViewMode] = useState<ViewMode>('room');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<StageLabel | 'all'>('all');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  // ── Filtered steps ──────────────────────────────────────────────────────────
  const filtered = steps.filter((s) => {
    if (filterRoom !== 'all' && s.room !== filterRoom) return false;
    if (filterStage !== 'all' && s.stageLabel !== filterStage) return false;
    return true;
  });

  // Room-by-room grouping
  const byRoom = rooms.map((room) => ({
    room,
    steps: filtered.filter((s) => s.room === room),
  })).filter((g) => g.steps.length > 0);

  // Stage-by-stage grouping
  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    steps: filtered.filter((s) => s.stageLabel === stage),
  })).filter((g) => g.steps.length > 0);

  // Answer type summary
  const answerTypeCounts = filtered.reduce<Record<string, number>>((acc, s) => {
    acc[s.answerType] = (acc[s.answerType] ?? 0) + 1;
    return acc;
  }, {});

  // xkit steps
  const xkitSteps = filtered.filter((s) => s.answerType === 'xkit');

  // Device steps
  const deviceSteps = filtered.filter(
    (s) => s.problemMode === 'device' || s.problemMode === 'clue_device',
  );

  // ── Edit handler ──────────────────────────────────────────────────────────
  const handleUpdateStep = (stepId: string, updates: Partial<GameFlowStep>) => {
    if (!onUpdatePlan) return;
    onUpdatePlan({
      ...plan,
      steps: plan.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    });
  };

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

      {/* ── View Mode Tabs + Filters ── */}
      <DocSectionTitle>Step Plan</DocSectionTitle>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* View toggle: Room / Stage */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
          <ViewModeButton active={viewMode === 'room'} onClick={() => setViewMode('room')}>
            지점 (공간)별
          </ViewModeButton>
          <ViewModeButton active={viewMode === 'stage'} onClick={() => setViewMode('stage')}>
            테마 (단계)별
          </ViewModeButton>
        </div>

        {/* Room chips (when in room view) */}
        {viewMode === 'room' && (
          <div className="flex items-center gap-1 flex-wrap">
            <FilterChip
              active={filterRoom === 'all'}
              onClick={() => setFilterRoom('all')}
            >
              전체
            </FilterChip>
            {rooms.map((room) => (
              <FilterChip
                key={room}
                active={filterRoom === room}
                onClick={() => setFilterRoom(filterRoom === room ? 'all' : room)}
              >
                {room}
              </FilterChip>
            ))}
          </div>
        )}

        {/* Stage chips (when in stage view) */}
        {viewMode === 'stage' && (
          <div className="flex items-center gap-1 flex-wrap">
            <FilterChip
              active={filterStage === 'all'}
              onClick={() => setFilterStage('all')}
            >
              전체
            </FilterChip>
            {STAGE_ORDER.map((stage) => (
              <FilterChip
                key={stage}
                active={filterStage === stage}
                onClick={() => setFilterStage(filterStage === stage ? 'all' : stage)}
              >
                {stage}
              </FilterChip>
            ))}
          </div>
        )}

        {/* Filtered count */}
        <span className="text-[10px] text-white/25 ml-auto">
          {filtered.length} / {steps.length} 스텝
        </span>
      </div>

      {/* ── Grouped step list ── */}
      {viewMode === 'room' ? (
        <div className="flex flex-col gap-5 mb-2">
          {byRoom.map(({ room, steps: roomSteps }) => (
            <div key={room}>
              <div className="flex items-center gap-2 mb-2">
                <RoomBadge room={room} rooms={rooms} />
                <span className="text-[10px] text-white/25">{roomSteps.length}개 스텝</span>
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
                    canEdit={!!onUpdatePlan}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5 mb-2">
          {byStage.map(({ stage, steps: stageSteps }) => (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2">
                <StageBadge label={stage} />
                <span className="text-[10px] text-white/25">{stageSteps.length}개 스텝</span>
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
                    canEdit={!!onUpdatePlan}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lock / Answer Type Summary ── */}
      <DocSectionTitle>Lock / Answer Type Summary</DocSectionTitle>
      <div className="flex flex-col gap-2 mb-2">
        {(Object.entries(answerTypeCounts) as [AnswerType, number][]).map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <AnswerTypeBadge type={type} />
            <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-white/20"
                style={{ width: `${(count / filtered.length) * 100}%` }}
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

// ── Editable Step Row ────────────────────────────────────────────────────────

function EditableStepRow({
  step,
  rooms,
  isEditing,
  onToggleEdit,
  onUpdate,
  canEdit,
}: {
  step: GameFlowStep;
  rooms: string[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (updates: Partial<GameFlowStep>) => void;
  canEdit: boolean;
}) {
  if (isEditing && canEdit) {
    return (
      <div className="px-3 py-3 rounded-xl border border-white/[0.12] bg-white/[0.04] mb-1">
        {/* Edit header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] font-mono text-white/25 w-4 text-right">
            {String(step.stepNumber).padStart(2, '0')}
          </span>
          <StageBadge label={step.stageLabel} />
          <RoomBadge room={step.room} rooms={rooms} />
          <div className="flex-1" />
          <button
            onClick={onToggleEdit}
            className="text-[9px] text-white/30 hover:text-white/60 transition-colors px-2 py-0.5 rounded border border-white/[0.08]"
          >
            접기
          </button>
        </div>

        {/* Editable fields */}
        <div className="flex flex-col gap-2">
          <EditField
            label="단서 제목"
            value={step.clueTitle}
            onChange={(v) => onUpdate({ clueTitle: v })}
          />
          <EditField
            label="정답"
            value={step.answer}
            onChange={(v) => onUpdate({ answer: v })}
          />
          <EditField
            label="메모"
            value={step.notes ?? ''}
            onChange={(v) => onUpdate({ notes: v })}
            multiline
          />

          {/* Badges (readonly in edit mode) */}
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
      className={`flex items-center gap-2.5 py-1.5 group ${canEdit ? 'cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 -mx-1' : ''}`}
      onClick={canEdit ? onToggleEdit : undefined}
    >
      <span className="text-[9px] font-mono text-white/20 w-4 text-right">
        {String(step.stepNumber).padStart(2, '0')}
      </span>
      <StageBadge label={step.stageLabel} />
      <span className="text-[11px] text-white/60 flex-1 truncate">{step.clueTitle}</span>
      <ProblemModeBadge mode={step.problemMode} size="xs" />
      <AnswerTypeBadge type={step.answerType} size="xs" />
      <OutputBadge output={step.output} />
      {canEdit && (
        <span className="text-[9px] text-white/15 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          ✎
        </span>
      )}
    </div>
  );
}

// ── Edit field ─────────────────────────────────────────────────────────────────

function EditField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] text-white/25 font-medium uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.03] text-[11px] text-white/70 outline-none focus:border-white/25 transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.03] text-[11px] text-white/70 outline-none focus:border-white/25 transition-colors"
        />
      )}
    </div>
  );
}

// ── View mode toggle button ──────────────────────────────────────────────────

function ViewModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-full text-[10px] font-medium transition-all duration-150',
        active ? 'bg-white text-black' : 'text-white/40 hover:text-white/65',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-0.5 rounded-full border text-[10px] font-medium transition-all duration-150',
        active
          ? 'bg-white/10 text-white/75 border-white/15'
          : 'text-white/30 border-white/[0.07] hover:text-white/55 hover:border-white/12',
      ].join(' ')}
    >
      {children}
    </button>
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
