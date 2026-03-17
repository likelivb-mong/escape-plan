import { useState, useMemo, useRef, useEffect } from 'react';
import type { GameFlowPlan, GameFlowStep, StageLabel } from '../../types/gameFlow';
import GameFlowChart from './GameFlowChart';

const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

interface GameFlowTabProps {
  plan: GameFlowPlan;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onUpdatePlan: (plan: GameFlowPlan) => void;
}

export default function GameFlowTab({ plan, isRegenerating, onRegenerate, onUpdatePlan }: GameFlowTabProps) {
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editRoomValue, setEditRoomValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRoom !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingRoom]);

  // ── Step update ──
  const handleUpdateStep = (stepId: string, updates: Partial<GameFlowStep>) => {
    onUpdatePlan({
      ...plan,
      steps: plan.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    });
  };

  // ── Room rename ──
  const handleRenameRoom = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    setEditingRoom(null);
    if (!trimmed || trimmed === oldName) return;
    onUpdatePlan({
      ...plan,
      rooms: plan.rooms.map((r) => (r === oldName ? trimmed : r)),
      steps: plan.steps.map((s) => (s.room === oldName ? { ...s, room: trimmed } : s)),
    });
    if (filterRoom === oldName) setFilterRoom(trimmed);
  };

  // ── Room delete ──
  const handleDeleteRoom = (roomName: string) => {
    const roomSteps = plan.steps.filter((s) => s.room === roomName);
    if (roomSteps.length > 0) {
      alert(`"${roomName}" 공간에 ${roomSteps.length}개의 스텝이 있습니다.\n스텝을 먼저 이동하거나 삭제해주세요.`);
      setConfirmDelete(null);
      return;
    }
    onUpdatePlan({
      ...plan,
      rooms: plan.rooms.filter((r) => r !== roomName),
    });
    if (filterRoom === roomName) setFilterRoom('all');
    setConfirmDelete(null);
  };

  const startEditRoom = (room: string) => {
    setEditingRoom(room);
    setEditRoomValue(room);
  };

  const commitRoomEdit = () => {
    if (editingRoom !== null) handleRenameRoom(editingRoom, editRoomValue);
  };

  // ── Add room ──
  const handleAddRoom = () => {
    const newRoom = `공간 ${plan.rooms.length + 1}`;
    onUpdatePlan({ ...plan, rooms: [...plan.rooms, newRoom] });
    setTimeout(() => startEditRoom(newRoom), 50);
  };

  // ── Add step ──
  const handleAddStep = (stageLabel: StageLabel) => {
    const maxNum = plan.steps.reduce((m, s) => Math.max(m, s.stepNumber), 0);
    const defaultRoom = plan.rooms[0] ?? '';
    const newStep: GameFlowStep = {
      id: `step-${Date.now()}`,
      stepNumber: maxNum + 1,
      room: filterRoom !== 'all' ? filterRoom : defaultRoom,
      stageLabel,
      clueTitle: '새 스텝',
      problemMode: 'clue',
      answerType: 'number_4',
      inputLabel: '',
      answer: '',
      output: 'door_open',
      clueTags: [],
      deviceTags: [],
    };
    onUpdatePlan({ ...plan, steps: [...plan.steps, newStep] });
  };

  // ── Delete step ──
  const handleDeleteStep = (stepId: string) => {
    const remaining = plan.steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    onUpdatePlan({ ...plan, steps: remaining });
  };

  // ── Reorder ──
  const handleReorderSteps = (stepId: string, newStage: StageLabel, insertIndex: number) => {
    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) return;

    const without = plan.steps.filter((s) => s.id !== stepId);
    const byStage: Record<StageLabel, GameFlowStep[]> = {
      '기': [], '승': [], '전': [], '반전': [], '결': [],
    };
    for (const s of without) byStage[s.stageLabel].push(s);
    byStage[newStage].splice(insertIndex, 0, { ...step, stageLabel: newStage });

    const reordered = STAGE_ORDER.flatMap((label) => byStage[label]).map((s, i) => ({
      ...s,
      stepNumber: i + 1,
    }));

    onUpdatePlan({ ...plan, steps: reordered });
  };

  const filtered = useMemo(() =>
    filterRoom === 'all' ? plan.steps : plan.steps.filter((s) => s.room === filterRoom),
    [plan.steps, filterRoom],
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* ── Room toolbar ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em] flex-shrink-0">
            Rooms
          </span>

          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {/* All filter */}
            <button
              onClick={() => setFilterRoom('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterRoom === 'all'
                  ? 'bg-white/[0.10] text-white/80 border border-white/[0.15]'
                  : 'text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.04]'
              }`}
            >
              All
            </button>

            {plan.rooms.map((room) => (
              <div key={room} className="relative group">
                {editingRoom === room ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/[0.08] border border-white/[0.20] rounded-lg">
                    <input
                      ref={editInputRef}
                      value={editRoomValue}
                      onChange={(e) => setEditRoomValue(e.target.value)}
                      onBlur={commitRoomEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRoomEdit();
                        if (e.key === 'Escape') setEditingRoom(null);
                      }}
                      className="bg-transparent text-xs text-white outline-none min-w-[48px] max-w-[140px]"
                    />
                    <button onClick={commitRoomEdit} className="text-[10px] text-white/50 hover:text-white/80">✓</button>
                    <button onClick={() => setEditingRoom(null)} className="text-[10px] text-white/30 hover:text-white/60">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => setFilterRoom(filterRoom === room ? 'all' : room)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        filterRoom === room
                          ? 'bg-white/[0.10] text-white/80 border border-white/[0.15]'
                          : 'text-white/40 border border-transparent hover:text-white/60 hover:bg-white/[0.04]'
                      }`}
                    >
                      {room}
                      <span className="ml-1 text-[10px] opacity-50">
                        {plan.steps.filter((s) => s.room === room).length}
                      </span>
                    </button>

                    {/* Hover actions */}
                    <div className="hidden group-hover:flex items-center -ml-1 gap-0.5">
                      <button
                        onClick={() => startEditRoom(room)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                        title="이름 변경"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setConfirmDelete(confirmDelete === room ? null : room)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Delete confirmation popover */}
                    {confirmDelete === room && (
                      <div className="absolute top-full left-0 mt-1.5 z-50 bg-[#1c1c1e] border border-white/[0.12] rounded-xl p-3 shadow-xl min-w-[160px]">
                        <p className="text-[11px] text-white/50 mb-2">"{room}" 삭제할까요?</p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="flex-1 py-1.5 text-[11px] font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          >
                            삭제
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="flex-1 py-1.5 text-[11px] font-medium rounded-lg bg-white/[0.06] text-white/50 hover:bg-white/[0.10] transition-all"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add room */}
            <button
              onClick={handleAddRoom}
              className="px-2.5 py-1 rounded-lg border border-dashed border-white/[0.10] text-xs text-white/25 hover:border-white/[0.20] hover:text-white/50 hover:bg-white/[0.03] transition-all"
            >
              +
            </button>
          </div>

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-white/30 hover:text-white/55 hover:bg-white/[0.04] transition-all disabled:opacity-30 flex-shrink-0"
          >
            {isRegenerating ? (
              <span className="inline-block w-3 h-3 border border-white/20 border-t-white/50 rounded-full animate-spin" />
            ) : (
              <span className="text-sm">↺</span>
            )}
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>

        {/* Filter info */}
        {filterRoom !== 'all' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-white/25">
              {filterRoom} · {filtered.length}/{plan.steps.length} steps
            </span>
            <button
              onClick={() => setFilterRoom('all')}
              className="text-[10px] text-white/25 hover:text-white/50 transition-colors underline decoration-white/10"
            >
              Show all
            </button>
          </div>
        )}
      </div>

      {/* ── Chart ── */}
      <GameFlowChart
        plan={filterRoom === 'all' ? plan : { ...plan, steps: filtered }}
        onUpdateStep={handleUpdateStep}
        onAddStep={handleAddStep}
        onDeleteStep={handleDeleteStep}
        onReorderSteps={handleReorderSteps}
      />
    </div>
  );
}
