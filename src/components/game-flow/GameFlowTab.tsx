import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameFlowPlan, GameFlowStep, ProblemMode, AnswerType, StageLabel } from '../../types/gameFlow';
import { useProject } from '../../context/ProjectContext';
import StepListPanel from './StepListPanel';
import StepDetailPanel from './StepDetailPanel';

interface GameFlowTabProps {
  plan: GameFlowPlan;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onUpdatePlan: (plan: GameFlowPlan) => void;
  onAddStep?: (stageLabel: StageLabel) => void;
}

export default function GameFlowTab({
  plan,
  isRegenerating,
  onRegenerate,
  onUpdatePlan,
  onAddStep,
}: GameFlowTabProps) {
  const navigate = useNavigate();
  const { setGameFlowDesign } = useProject();

  const [selectedId, setSelectedId] = useState<string | null>(
    plan.steps[0]?.id ?? null,
  );
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<ProblemMode | 'all'>('all');
  const [filterType, setFilterType] = useState<AnswerType | 'all'>('all');

  // ── Filtered steps ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return plan.steps.filter((s) => {
      if (filterRoom !== 'all' && s.room !== filterRoom) return false;
      if (filterMode !== 'all' && s.problemMode !== filterMode) return false;
      if (filterType !== 'all' && s.answerType !== filterType) return false;
      return true;
    });
  }, [plan.steps, filterRoom, filterMode, filterType]);

  const selectedStep = plan.steps.find((s) => s.id === selectedId) ?? null;
  const selectedIndex = filtered.findIndex((s) => s.id === selectedId);

  const handlePrev = () => {
    if (selectedIndex <= 0) return;
    setSelectedId(filtered[selectedIndex - 1].id);
  };
  const handleNext = () => {
    if (selectedIndex >= filtered.length - 1) return;
    setSelectedId(filtered[selectedIndex + 1].id);
  };

  // ── Room rename ──────────────────────────────────────────────────────────────
  const handleRenameRoom = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    onUpdatePlan({
      ...plan,
      rooms: plan.rooms.map(r => r === oldName ? trimmed : r),
      steps: plan.steps.map(s => s.room === oldName ? { ...s, room: trimmed } : s),
    });
    if (filterRoom === oldName) setFilterRoom(trimmed);
  };

  // ── Step edit ────────────────────────────────────────────────────────────────
  const handleUpdateStep = (stepId: string, updates: Partial<GameFlowStep>) => {
    onUpdatePlan({
      ...plan,
      steps: plan.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    });
  };

  // ── Save to context and go to draft ────────────────────────────────────────
  const handleSaveToDraft = () => {
    setGameFlowDesign(plan);
    navigate('/draft');
  };

  // ── Go to floor plan ──────────────────────────────────────────────────────
  const handleGoToFloorPlan = () => {
    setGameFlowDesign(plan);
    navigate('/floor-plan');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.06] flex-shrink-0 flex-wrap">
        {/* Stats */}
        <span className="text-caption text-white/35 mr-1">
          {filtered.length} / {plan.steps.length} 스텝
        </span>

        {/* Room filter + rename */}
        <RoomFilterChips
          rooms={plan.rooms}
          filterRoom={filterRoom}
          onFilterChange={setFilterRoom}
          onRenameRoom={handleRenameRoom}
        />

        {/* Mode filter */}
        <FilterSelect
          label="방식"
          value={filterMode}
          onChange={(v) => setFilterMode(v as ProblemMode | 'all')}
          options={[
            { value: 'all', label: '전체 방식' },
            { value: 'clue', label: '단서 해석' },
            { value: 'device', label: '장치 조작' },
            { value: 'clue_device', label: '단서+장치' },
          ]}
        />

        {/* Answer type filter */}
        <FilterSelect
          label="정답"
          value={filterType}
          onChange={(v) => setFilterType(v as AnswerType | 'all')}
          options={[
            { value: 'all', label: '전체 유형' },
            { value: 'key', label: '열쇠' },
            { value: 'number_4', label: '숫자 4자리' },
            { value: 'number_3', label: '숫자 3자리' },
            { value: 'alphabet_5', label: '알파벳 5자리' },
            { value: 'keypad', label: '키패드' },
            { value: 'xkit', label: 'X-KIT' },
            { value: 'auto', label: '자동' },
          ]}
        />

        <div className="flex-1" />

        {/* Regenerate */}
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/[0.09] text-caption text-white/35 hover:text-white/60 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isRegenerating ? (
            <><span className="w-2.5 h-2.5 border border-white/25 border-t-white/60 rounded-full animate-spin" /> 재생성 중…</>
          ) : (
            <>↺ 플로우 재생성</>
          )}
        </button>
      </div>

      {/* ── Main split layout ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left: Step list — 240px */}
        <div className="w-60 flex-shrink-0 overflow-hidden">
          <StepListPanel
            steps={filtered}
            rooms={plan.rooms}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddStep={onAddStep}
          />
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <StepDetailPanel
            step={selectedStep}
            rooms={plan.rooms}
            totalSteps={plan.steps.length}
            onPrev={handlePrev}
            onNext={handleNext}
            onUpdateStep={selectedStep
              ? (updates) => handleUpdateStep(selectedStep.id, updates)
              : undefined
            }
          />
        </div>
      </div>

      {/* ── Summary footer ── */}
      <GameFlowSummaryBar steps={plan.steps} onSaveToDraft={handleSaveToDraft} onGoToFloorPlan={handleGoToFloorPlan} />
    </div>
  );
}

// ── Room filter chips (click to filter, double-click to rename) ───────────────

const ROOM_CHIP_COLORS = [
  { active: 'bg-white/15 text-white/80 border-white/20', idle: 'text-white/40 border-white/[0.08] hover:text-white/65 hover:border-white/15' },
  { active: 'bg-sky-500/15 text-sky-300/90 border-sky-400/25', idle: 'text-sky-300/50 border-sky-400/15 hover:text-sky-300/75 hover:border-sky-400/25' },
  { active: 'bg-rose-500/15 text-rose-300/90 border-rose-400/25', idle: 'text-rose-300/50 border-rose-400/15 hover:text-rose-300/75 hover:border-rose-400/25' },
  { active: 'bg-amber-500/15 text-amber-300/90 border-amber-400/25', idle: 'text-amber-300/50 border-amber-400/15 hover:text-amber-300/75 hover:border-amber-400/25' },
  { active: 'bg-emerald-500/15 text-emerald-300/90 border-emerald-400/25', idle: 'text-emerald-300/50 border-emerald-400/15 hover:text-emerald-300/75 hover:border-emerald-400/25' },
];

function RoomFilterChips({
  rooms,
  filterRoom,
  onFilterChange,
  onRenameRoom,
}: {
  rooms: string[];
  filterRoom: string;
  onFilterChange: (room: string) => void;
  onRenameRoom: (oldName: string, newName: string) => void;
}) {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (room: string) => {
    setEditingRoom(room);
    setEditValue(room);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    if (editingRoom) {
      onRenameRoom(editingRoom, editValue);
      setEditingRoom(null);
    }
  };

  const cancelEdit = () => setEditingRoom(null);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* "All" chip */}
      <button
        onClick={() => onFilterChange('all')}
        className={`px-2.5 py-0.5 rounded-full border text-caption font-medium transition-all duration-150 ${
          filterRoom === 'all'
            ? 'bg-white/10 text-white/75 border-white/15'
            : 'text-white/30 border-white/[0.07] hover:text-white/55 hover:border-white/12'
        }`}
      >
        전체
      </button>

      {/* Room chips */}
      {rooms.map((room, i) => {
        const color = ROOM_CHIP_COLORS[i % ROOM_CHIP_COLORS.length];
        const isActive = filterRoom === room;

        if (editingRoom === room) {
          return (
            <input
              key={room}
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
              }}
              className="px-2 py-0.5 rounded-full border border-white/30 bg-white/10 text-caption text-white/80 outline-none min-w-0"
              style={{ width: `${Math.max(editValue.length * 9 + 16, 48)}px` }}
            />
          );
        }

        return (
          <button
            key={room}
            onClick={() => onFilterChange(isActive ? 'all' : room)}
            onDoubleClick={() => startEdit(room)}
            title="더블클릭으로 공간 이름 수정"
            className={`px-2.5 py-0.5 rounded-full border text-caption font-medium transition-all duration-150 ${
              isActive ? color.active : color.idle
            }`}
          >
            {room}
          </button>
        );
      })}
    </div>
  );
}

// ── Filter select ─────────────────────────────────────────────────────────────

function FilterSelect({
  label: _label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 rounded-lg border border-white/[0.09] bg-transparent text-caption text-white/50 hover:border-white/20 transition-colors cursor-pointer appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#111] text-white/70">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Summary footer bar ────────────────────────────────────────────────────────

function GameFlowSummaryBar({
  steps,
  onSaveToDraft,
  onGoToFloorPlan,
}: {
  steps: GameFlowStep[];
  onSaveToDraft: () => void;
  onGoToFloorPlan: () => void;
}) {
  const xkitCount    = steps.filter((s) => s.answerType === 'xkit').length;
  const deviceCount  = steps.filter((s) => s.problemMode === 'device' || s.problemMode === 'clue_device').length;
  const autoCount    = steps.filter((s) => s.answerType === 'auto').length;

  return (
    <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.06] flex items-center gap-5">
      <div className="flex items-center gap-4">
        <Stat label="총 스텝" value={String(steps.length)} />
        <Stat label="X-KIT" value={String(xkitCount)} />
        <Stat label="장치 포함" value={String(deviceCount)} />
        <Stat label="자동 출력" value={String(autoCount)} />
      </div>

      <div className="flex-1" />

      <button
        onClick={onGoToFloorPlan}
        className="px-4 py-2 rounded-full border border-white/[0.10] text-subhead text-white/45 hover:border-white/20 hover:text-white/70 transition-all"
      >
        도면 / PassMap →
      </button>
      <button
        onClick={onSaveToDraft}
        className="px-4 py-2 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] transition-colors"
      >
        Draft로 보내기 →
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-caption text-white/35">{label}</span>
      <span className="text-footnote font-semibold text-white/60">{value}</span>
    </div>
  );
}
