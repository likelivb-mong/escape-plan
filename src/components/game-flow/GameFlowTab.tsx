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
  const [editingRoom, setEditingRoom] = useState<string | null>(null); // room being renamed
  const [editRoomValue, setEditRoomValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRoom !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingRoom]);

  // ── Step update ──────────────────────────────────────────────────────────────
  const handleUpdateStep = (stepId: string, updates: Partial<GameFlowStep>) => {
    onUpdatePlan({
      ...plan,
      steps: plan.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    });
  };

  // ── Room rename ──────────────────────────────────────────────────────────────
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

  const startEditRoom = (room: string) => {
    setEditingRoom(room);
    setEditRoomValue(room);
  };

  const commitRoomEdit = () => {
    if (editingRoom !== null) handleRenameRoom(editingRoom, editRoomValue);
  };

  // ── Add room ─────────────────────────────────────────────────────────────────
  const handleAddRoom = () => {
    const newRoom = `공간 ${plan.rooms.length + 1}`;
    onUpdatePlan({ ...plan, rooms: [...plan.rooms, newRoom] });
    setTimeout(() => startEditRoom(newRoom), 50);
  };

  // ── Add step ─────────────────────────────────────────────────────────────────
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

  // ── Delete step ──────────────────────────────────────────────────────────────
  const handleDeleteStep = (stepId: string) => {
    const remaining = plan.steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    onUpdatePlan({ ...plan, steps: remaining });
  };

  // ── Reorder (drag & drop) ────────────────────────────────────────────────────
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
      {/* ── Room Name section ── */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-caption font-semibold text-white/30 uppercase tracking-widest flex-shrink-0">
            Room Name
          </span>
          <span className="w-px h-3 bg-white/[0.08] flex-shrink-0" />

          {plan.rooms.map((room) => (
            <div key={room} className="flex items-center gap-0.5">
              {editingRoom === room ? (
                /* Inline edit input */
                <input
                  ref={editInputRef}
                  value={editRoomValue}
                  onChange={(e) => setEditRoomValue(e.target.value)}
                  onBlur={commitRoomEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRoomEdit();
                    if (e.key === 'Escape') setEditingRoom(null);
                  }}
                  className="px-2.5 py-1 rounded-full border border-white/30 bg-white/[0.08] text-caption text-white outline-none min-w-[60px] max-w-[120px]"
                  style={{ width: `${Math.max(60, editRoomValue.length * 9 + 24)}px` }}
                />
              ) : (
                <div className="flex items-center gap-0.5 group">
                  <button
                    onClick={() => setFilterRoom(filterRoom === room ? 'all' : room)}
                    className={`px-2.5 py-1 rounded-l-full border-l border-y text-caption font-medium transition-all ${
                      filterRoom === room
                        ? 'bg-white/10 text-white/75 border-white/20'
                        : 'text-white/45 border-white/[0.07] hover:border-white/15 hover:text-white/65'
                    }`}
                  >
                    {room}
                  </button>
                  {/* Edit pencil */}
                  <button
                    onClick={() => startEditRoom(room)}
                    title="이름 변경"
                    className={`px-1.5 py-1 rounded-r-full border-r border-y text-caption transition-all opacity-0 group-hover:opacity-100 ${
                      filterRoom === room
                        ? 'bg-white/10 border-white/20 text-white/40 hover:text-white/70'
                        : 'border-white/[0.07] text-white/25 hover:text-white/55 hover:border-white/15'
                    }`}
                  >
                    ✎
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 전체 filter */}
          <button
            onClick={() => setFilterRoom('all')}
            className={`px-2.5 py-1 rounded-full border text-caption font-medium transition-all ${
              filterRoom === 'all'
                ? 'bg-white/10 text-white/70 border-white/20'
                : 'text-white/25 border-white/[0.05] hover:border-white/12 hover:text-white/45'
            }`}
          >
            전체
          </button>

          {/* Add room button */}
          <button
            onClick={handleAddRoom}
            title="공간 추가"
            className="px-2 py-1 rounded-full border border-dashed border-white/[0.12] text-caption text-white/25 hover:border-white/25 hover:text-white/50 transition-all"
          >
            + 공간
          </button>

          <div className="flex-1" />

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.08] text-caption text-white/35 hover:text-white/55 hover:border-white/15 transition-all disabled:opacity-30"
          >
            {isRegenerating ? (
              <span className="inline-block w-3 h-3 border border-white/20 border-t-white/50 rounded-full animate-spin" />
            ) : '↺'}
            재생성
          </button>
        </div>

        {/* Step count + filter hint */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-white/20">
            {filtered.length === plan.steps.length
              ? `총 ${plan.steps.length}스텝`
              : `${filterRoom} · ${filtered.length}/${plan.steps.length}스텝`}
          </span>
          {filterRoom !== 'all' && (
            <button
              onClick={() => setFilterRoom('all')}
              className="text-[10px] text-white/20 hover:text-white/45 transition-colors"
            >
              전체 보기 ×
            </button>
          )}
        </div>
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
