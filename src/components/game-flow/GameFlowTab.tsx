import { useState, useMemo, useRef } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel } from '../../types/gameFlow';
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
  const { setGameFlowDesign } = useProject();

  const [selectedId, setSelectedId] = useState<string | null>(
    plan.steps[0]?.id ?? null,
  );
  const [filterRoom, setFilterRoom] = useState<string>('all');

  // ── Filtered steps ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return plan.steps.filter((s) => {
      if (filterRoom !== 'all' && s.room !== filterRoom) return false;
      return true;
    });
  }, [plan.steps, filterRoom]);

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

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.06] flex-shrink-0">
        {/* Stats */}
        <span className="text-caption text-white/35">
          {filtered.length} / {plan.steps.length}
        </span>

        {/* Room filter only */}
        <RoomFilterChips
          rooms={plan.rooms}
          filterRoom={filterRoom}
          onFilterChange={setFilterRoom}
          onRenameRoom={handleRenameRoom}
        />
      </div>

      {/* ── Main split layout ── */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-y-auto sm:overflow-hidden min-h-0">

        {/* Left: Step list — 240px */}
        <div className="w-full sm:w-60 flex-shrink-0 overflow-hidden">
          <StepListPanel
            steps={filtered}
            rooms={plan.rooms}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddStep={onAddStep}
          />
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 sm:overflow-hidden flex flex-col min-w-0">
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

