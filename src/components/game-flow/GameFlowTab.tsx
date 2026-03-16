import { useState, useMemo } from 'react';
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

  const filtered = useMemo(() =>
    filterRoom === 'all' ? plan.steps : plan.steps.filter((s) => s.room === filterRoom),
    [plan.steps, filterRoom],
  );

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
    if (!trimmed || trimmed === oldName) return;
    onUpdatePlan({
      ...plan,
      rooms: plan.rooms.map((r) => (r === oldName ? trimmed : r)),
      steps: plan.steps.map((s) => (s.room === oldName ? { ...s, room: trimmed } : s)),
    });
    if (filterRoom === oldName) setFilterRoom(trimmed);
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

    // Remove the dragged step
    const without = plan.steps.filter((s) => s.id !== stepId);

    // Build per-stage lists
    const byStage: Record<StageLabel, GameFlowStep[]> = {
      '기': [], '승': [], '전': [], '반전': [], '결': [],
    };
    for (const s of without) byStage[s.stageLabel].push(s);

    // Insert at the correct position in the target stage
    byStage[newStage].splice(insertIndex, 0, { ...step, stageLabel: newStage });

    // Flatten back in stage order and renumber
    const reordered = STAGE_ORDER.flatMap((label) => byStage[label]).map((s, i) => ({
      ...s,
      stepNumber: i + 1,
    }));

    onUpdatePlan({ ...plan, steps: reordered });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] flex-shrink-0 flex-wrap">
        {/* Stats */}
        <span className="text-caption text-white/30 mr-1">
          {plan.steps.length}스텝
        </span>

        {/* Room filter chips */}
        <button
          onClick={() => setFilterRoom('all')}
          className={`px-2.5 py-1 rounded-full border text-caption font-medium transition-all ${
            filterRoom === 'all'
              ? 'bg-white/10 text-white/70 border-white/20'
              : 'text-white/30 border-white/[0.07] hover:border-white/15 hover:text-white/50'
          }`}
        >
          전체
        </button>
        {plan.rooms.map((room) => (
          <button
            key={room}
            onClick={() => setFilterRoom(filterRoom === room ? 'all' : room)}
            onDoubleClick={() => {
              const newName = prompt(`"${room}" 이름 변경:`, room);
              if (newName) handleRenameRoom(room, newName);
            }}
            title="더블클릭으로 이름 변경"
            className={`px-2.5 py-1 rounded-full border text-caption font-medium transition-all ${
              filterRoom === room
                ? 'bg-white/10 text-white/70 border-white/20'
                : 'text-white/30 border-white/[0.07] hover:border-white/15 hover:text-white/50'
            }`}
          >
            {room}
          </button>
        ))}

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
