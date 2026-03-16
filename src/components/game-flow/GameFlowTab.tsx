import { useState, useMemo } from 'react';
import type { GameFlowPlan, GameFlowStep } from '../../types/gameFlow';
import GameFlowChart from './GameFlowChart';

interface GameFlowTabProps {
  plan: GameFlowPlan;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onUpdatePlan: (plan: GameFlowPlan) => void;
  onAddStep?: (stageLabel: string) => void;
}

export default function GameFlowTab({
  plan,
  isRegenerating,
  onRegenerate,
  onUpdatePlan,
}: GameFlowTabProps) {
  const [filterRoom, setFilterRoom] = useState<string>('all');

  // ── Filtered steps ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return plan.steps.filter((s) => {
      if (filterRoom !== 'all' && s.room !== filterRoom) return false;
      return true;
    });
  }, [plan.steps, filterRoom]);

  // ── Step edit ────────────────────────────────────────────────────────────────
  const handleUpdateStep = (stepId: string, updates: Partial<GameFlowStep>) => {
    onUpdatePlan({
      ...plan,
      steps: plan.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    });
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* ── Filter bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
        {/* Stats */}
        <span className="text-caption text-white/35 font-medium">
          총 {plan.steps.length}개 스텝
        </span>

        <span className="text-white/10">·</span>

        {/* Room filter */}
        <div className="flex items-center gap-2">
          {plan.rooms.map((room, i) => (
            <button
              key={room}
              onClick={() => setFilterRoom(filterRoom === room ? 'all' : room)}
              onDoubleClick={() => {
                const newName = prompt(`${room} 이름 변경:`, room);
                if (newName) handleRenameRoom(room, newName);
              }}
              className={[
                'px-2.5 py-1 rounded-full border text-caption font-medium transition-all',
                filterRoom === room
                  ? 'bg-white/15 text-white/80 border-white/20'
                  : 'text-white/40 border-white/[0.08] hover:text-white/60 hover:border-white/15',
              ].join(' ')}
              title={filterRoom === room ? '클릭하여 전체 보기' : '클릭하여 필터'}
            >
              {room}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Info */}
        <span className="text-caption text-white/25">
          {filtered.length === plan.steps.length
            ? '전체'
            : `${filtered.length}개 필터됨`}
        </span>
      </div>

      {/* ── Flow chart ── */}
      <GameFlowChart
        plan={filterRoom === 'all' ? plan : {
          ...plan,
          steps: filtered,
        }}
        onUpdateStep={handleUpdateStep}
      />
    </div>
  );
}
