import { useState, useRef, useCallback } from 'react';
import type { GameFlowStep, ProblemMode, AnswerType, OutputType, StageLabel } from '../../types/gameFlow';
import type { FloorPlanRoomLayout } from '../../types/floorPlan';
import { clampStepToRoom } from '../../utils/floorPlan';

// ── Room color palette ─────────────────────────────────────────────────────────

const ROOM_BG_COLORS = [
  { border: 'border-white/[0.12]',    bg: 'bg-white/[0.03]',    header: 'bg-white/[0.04]',    text: 'text-white/60' },
  { border: 'border-sky-400/20',      bg: 'bg-sky-500/[0.03]',  header: 'bg-sky-500/[0.06]',  text: 'text-sky-300/70' },
  { border: 'border-rose-400/20',     bg: 'bg-rose-500/[0.03]', header: 'bg-rose-500/[0.06]', text: 'text-rose-300/70' },
  { border: 'border-amber-400/20',    bg: 'bg-amber-500/[0.03]',header: 'bg-amber-500/[0.06]',text: 'text-amber-300/70' },
  { border: 'border-emerald-400/20',  bg: 'bg-emerald-500/[0.03]',header: 'bg-emerald-500/[0.06]',text: 'text-emerald-300/70' },
];

// ── Step visual icons & colors ──────────────────────────────────────────────

const PROBLEM_MODE_ICONS: Record<ProblemMode, string> = {
  clue: '🧩', device: '⚙️', clue_device: '🔮',
};

const ANSWER_TYPE_COLORS: Record<AnswerType, { bg: string; text: string; border: string }> = {
  key:        { bg: 'bg-rose-500/10',    text: 'text-rose-300/80',    border: 'border-rose-400/20' },
  number_4:   { bg: 'bg-white/[0.04]',   text: 'text-white/60',       border: 'border-white/10' },
  number_3:   { bg: 'bg-white/[0.04]',   text: 'text-white/60',       border: 'border-white/10' },
  alphabet_5: { bg: 'bg-green-500/10',   text: 'text-green-300/80',   border: 'border-green-400/20' },
  keypad:     { bg: 'bg-cyan-500/10',    text: 'text-cyan-300/80',    border: 'border-cyan-400/20' },
  xkit:       { bg: 'bg-purple-500/10',  text: 'text-purple-300/80',  border: 'border-purple-400/25' },
  auto:       { bg: 'bg-orange-500/10',  text: 'text-orange-300/80',  border: 'border-orange-400/20' },
};

const ANSWER_TYPE_SHORT: Record<AnswerType, string> = {
  key: '🗝', number_4: '4#', number_3: '3#', alphabet_5: 'ABC',
  keypad: '⌨', xkit: '📱', auto: '⚡',
};

const OUTPUT_ICONS: Record<OutputType, string> = {
  door_open: '🚪', hidden_compartment_open: '🔓', led_on: '💡', tv_on: '📺',
  xkit_guide_revealed: '📱', item_acquired: '📦', next_room_open: '➡️',
  ending_video: '🎬', escape_clear: '🏁',
};

const STAGE_COLORS: Record<StageLabel, string> = {
  기: 'text-sky-400/80',
  승: 'text-emerald-400/80',
  전: 'text-amber-400/80',
  반전: 'text-rose-400/80',
  결: 'text-violet-400/80',
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ── Default step positions (stacked top-left if none stored) ───────────────────

function getDefaultPos(index: number): { x: number; y: number } {
  return { x: 3, y: 25 + index * 15 };
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface FloorPlanRoomProps {
  layout: FloorPlanRoomLayout;
  steps: GameFlowStep[];
  roomIndex: number;
  isEditing: boolean;
  stepPositions: Record<string, { x: number; y: number }>;
  onMoveStart: (roomName: string, e: React.PointerEvent) => void;
  onResizeStart: (roomName: string, e: React.PointerEvent) => void;
  onUpdateStepPosition: (stepId: string, x: number, y: number) => void;
  onRenameRoom?: (oldName: string, newName: string) => void;
}

export default function FloorPlanRoom({
  layout,
  steps,
  roomIndex,
  isEditing,
  stepPositions,
  onMoveStart,
  onResizeStart,
  onUpdateStepPosition,
  onRenameRoom,
}: FloorPlanRoomProps) {
  const colors = ROOM_BG_COLORS[roomIndex % ROOM_BG_COLORS.length];
  const roomRef = useRef<HTMLDivElement>(null);

  // Room name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(layout.roomName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNameDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    setNameValue(layout.roomName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  }, [isEditing, layout.roomName]);

  const commitRename = useCallback(() => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    if (trimmed && trimmed !== layout.roomName) {
      onRenameRoom?.(layout.roomName, trimmed);
    }
  }, [nameValue, layout.roomName, onRenameRoom]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setEditingName(false);
  }, [commitRename]);

  // Local step drag state
  const [stepDrag, setStepDrag] = useState<{
    stepId: string;
    startPX: number; startPY: number;
    startX: number; startY: number;
  } | null>(null);

  const handleRoomPointerDown = (e: React.PointerEvent) => {
    if (!isEditing) return;
    if ((e.target as HTMLElement).dataset.resize) return;
    if ((e.target as HTMLElement).closest('[data-step-chip]')) return;
    onMoveStart(layout.roomName, e);
  };

  const handleStepPointerDown = (step: GameFlowStep, index: number, e: React.PointerEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    const pos = stepPositions[step.id] ?? getDefaultPos(index);
    setStepDrag({
      stepId: step.id,
      startPX: e.clientX, startPY: e.clientY,
      startX: pos.x, startY: pos.y,
    });
    // Capture on the room element so move events arrive there
    roomRef.current?.setPointerCapture(e.pointerId);
  };

  const handleRoomPointerMove = (e: React.PointerEvent) => {
    if (!stepDrag || !roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const dx = ((e.clientX - stepDrag.startPX) / rect.width) * 100;
    const dy = ((e.clientY - stepDrag.startPY) / rect.height) * 100;

    // Calculate new position
    let newX = stepDrag.startX + dx;
    let newY = stepDrag.startY + dy;

    // Clamp to room bounds (converting from room percentage to canvas percentage)
    const clamped = clampStepToRoom(
      layout.x + newX,
      layout.y + newY,
      layout.x,
      layout.y,
      layout.width,
      layout.height
    );

    // Convert back to room-relative percentages
    onUpdateStepPosition(
      stepDrag.stepId,
      clamped.x - layout.x,
      clamped.y - layout.y,
    );
  };

  const handleRoomPointerUp = () => setStepDrag(null);

  return (
    <div
      ref={roomRef}
      className={`absolute rounded-xl border ${colors.border} ${colors.bg} overflow-hidden flex flex-col select-none ${
        isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        left: `${layout.x}%`,
        top: `${layout.y}%`,
        width: `${layout.width}%`,
        height: `${layout.height}%`,
      }}
      onPointerDown={handleRoomPointerDown}
      onPointerMove={stepDrag ? handleRoomPointerMove : undefined}
      onPointerUp={stepDrag ? handleRoomPointerUp : undefined}
      onPointerCancel={stepDrag ? handleRoomPointerUp : undefined}
    >
      {/* Room header */}
      <div className={`px-2.5 py-1.5 ${colors.header} flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-1.5 min-w-0">
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleNameKeyDown}
              className={`text-caption font-semibold ${colors.text} bg-transparent border-b border-white/30 outline-none w-full mr-2`}
              autoFocus
            />
          ) : (
            <span
              className={`text-caption font-semibold ${colors.text} truncate ${isEditing ? 'cursor-text hover:underline decoration-dotted underline-offset-2' : ''}`}
              onDoubleClick={handleNameDoubleClick}
              title={isEditing ? '더블클릭으로 이름 변경' : undefined}
            >
              {layout.roomName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Device count indicator */}
          {steps.filter(s => s.problemMode === 'device' || s.problemMode === 'clue_device').length > 0 && (
            <span className="text-[9px] text-amber-300/50" title="장치 포함 스텝">
              ⚙️{steps.filter(s => s.problemMode === 'device' || s.problemMode === 'clue_device').length}
            </span>
          )}
          <span className="text-micro text-white/35 tabular-nums font-mono">
            {steps.length}
          </span>
        </div>
      </div>

      {/* Step chips — absolute positioned within room */}
      <div className="relative flex-1 min-h-0">
        {steps.map((step, i) => {
          const pos = stepPositions[step.id] ?? getDefaultPos(i);
          const atColor = ANSWER_TYPE_COLORS[step.answerType];
          return (
            <div
              key={step.id}
              data-step-chip="true"
              className={`absolute flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${atColor.bg} border ${atColor.border} backdrop-blur-sm ${
                isEditing ? 'cursor-grab active:cursor-grabbing hover:brightness-125' : 'hover:brightness-110'
              } ${stepDrag?.stepId === step.id ? 'opacity-80 z-10 ring-1 ring-white/30' : ''} transition-all duration-100`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                maxWidth: '94%',
              }}
              onPointerDown={(e) => handleStepPointerDown(step, i, e)}
            >
              {/* Stage label */}
              <span className={`text-[9px] font-bold ${STAGE_COLORS[step.stageLabel]} flex-shrink-0 leading-none`}>
                {step.stageLabel}
              </span>

              {/* Step number */}
              <span className={`text-micro font-mono font-semibold tabular-nums flex-shrink-0 ${atColor.text}`}>
                {String(step.stepNumber).padStart(2, '0')}
              </span>

              {/* Problem mode icon */}
              <span className="text-[10px] flex-shrink-0 leading-none" title={step.problemMode}>
                {PROBLEM_MODE_ICONS[step.problemMode]}
              </span>

              {/* Answer type short label */}
              <span className={`text-[9px] font-bold flex-shrink-0 ${atColor.text}`}>
                {ANSWER_TYPE_SHORT[step.answerType]}
              </span>

              {/* Answer value */}
              {step.answer && (
                <span className="text-micro text-white/50 font-mono truncate max-w-[60px]">
                  {step.answer}
                </span>
              )}

              {/* Output icon */}
              <span className="text-[10px] flex-shrink-0 leading-none opacity-60" title={step.output}>
                {OUTPUT_ICONS[step.output]}
              </span>
            </div>
          );
        })}
        {steps.length === 0 && (
          <span className="absolute top-2 left-3 text-micro text-white/15 italic">스텝 없음</span>
        )}
      </div>

      {/* Resize handle — only visible in edit mode */}
      {isEditing && (
        <div
          data-resize="true"
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart(layout.roomName, e);
          }}
        >
          <svg
            viewBox="0 0 16 16"
            className="w-full h-full text-white/15 hover:text-white/30 transition-colors"
          >
            <path d="M14 2L2 14M14 6L6 14M14 10L10 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}
    </div>
  );
}
