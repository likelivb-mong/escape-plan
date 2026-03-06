import { useState, useRef } from 'react';
import type { GameFlowStep } from '../../types/gameFlow';
import type { FloorPlanRoomLayout } from '../../types/floorPlan';
import { AnswerTypeBadge } from '../game-flow/badges';

// ── Room color palette ─────────────────────────────────────────────────────────

const ROOM_BG_COLORS = [
  { border: 'border-white/[0.12]',    bg: 'bg-white/[0.03]',    header: 'bg-white/[0.04]',    text: 'text-white/60' },
  { border: 'border-sky-400/20',      bg: 'bg-sky-500/[0.03]',  header: 'bg-sky-500/[0.06]',  text: 'text-sky-300/70' },
  { border: 'border-rose-400/20',     bg: 'bg-rose-500/[0.03]', header: 'bg-rose-500/[0.06]', text: 'text-rose-300/70' },
  { border: 'border-amber-400/20',    bg: 'bg-amber-500/[0.03]',header: 'bg-amber-500/[0.06]',text: 'text-amber-300/70' },
  { border: 'border-emerald-400/20',  bg: 'bg-emerald-500/[0.03]',header: 'bg-emerald-500/[0.06]',text: 'text-emerald-300/70' },
];

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
}: FloorPlanRoomProps) {
  const colors = ROOM_BG_COLORS[roomIndex % ROOM_BG_COLORS.length];
  const roomRef = useRef<HTMLDivElement>(null);

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
    onUpdateStepPosition(
      stepDrag.stepId,
      clamp(stepDrag.startX + dx, 0, 88),
      clamp(stepDrag.startY + dy, 18, 90),
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
        <span className={`text-[10px] font-semibold ${colors.text} truncate`}>
          {layout.roomName}
        </span>
        <span className="text-[9px] text-white/25">
          {steps.length}스텝
        </span>
      </div>

      {/* Step chips — absolute positioned within room */}
      <div className="relative flex-1 min-h-0">
        {steps.map((step, i) => {
          const pos = stepPositions[step.id] ?? getDefaultPos(i);
          return (
            <div
              key={step.id}
              data-step-chip="true"
              className={`absolute flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.07] ${
                isEditing ? 'cursor-grab active:cursor-grabbing' : ''
              } ${stepDrag?.stepId === step.id ? 'opacity-80 z-10' : ''}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                maxWidth: '92%',
              }}
              onPointerDown={(e) => handleStepPointerDown(step, i, e)}
            >
              <span className="text-[9px] text-white/30 font-mono tabular-nums flex-shrink-0">
                {String(step.stepNumber).padStart(2, '0')}
              </span>
              <AnswerTypeBadge type={step.answerType} size="xs" />
              <span className="text-[9px] text-white/45 font-mono truncate">
                {step.answer}
              </span>
            </div>
          );
        })}
        {steps.length === 0 && (
          <span className="absolute top-2 left-3 text-[9px] text-white/15 italic">스텝 없음</span>
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
