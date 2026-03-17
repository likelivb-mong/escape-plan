import { useState, useRef, useCallback, useMemo } from 'react';
import type { GameFlowStep, StageLabel } from '../../types/gameFlow';
import type { FloorPlanRoomLayout } from '../../types/floorPlan';
import { clampStepToRoom, validateRoomBounds, tilesBBox } from '../../utils/floorPlan';
import { MODE_SHORT, OUTPUT_SHORT } from '../game-flow/TechSettings';

// ── Room color palette (Tailwind + raw rgba for tile fills) ──────────────────

const ROOM_BG_COLORS = [
  { border: 'border-white/[0.12]',    bg: 'bg-white/[0.03]',    header: 'bg-white/[0.05]',    text: 'text-white/60',    tileBg: 'rgba(255,255,255,0.03)',  tileBorder: 'rgba(255,255,255,0.18)' },
  { border: 'border-sky-400/20',      bg: 'bg-sky-500/[0.03]',  header: 'bg-sky-500/[0.07]',  text: 'text-sky-300/70',  tileBg: 'rgba(56,189,248,0.05)',   tileBorder: 'rgba(56,189,248,0.30)' },
  { border: 'border-rose-400/20',     bg: 'bg-rose-500/[0.03]', header: 'bg-rose-500/[0.07]', text: 'text-rose-300/70', tileBg: 'rgba(251,113,133,0.05)',  tileBorder: 'rgba(251,113,133,0.30)' },
  { border: 'border-amber-400/20',    bg: 'bg-amber-500/[0.03]',header: 'bg-amber-500/[0.07]',text: 'text-amber-300/70',tileBg: 'rgba(245,158,11,0.05)',   tileBorder: 'rgba(245,158,11,0.30)' },
  { border: 'border-emerald-400/20',  bg: 'bg-emerald-500/[0.03]',header: 'bg-emerald-500/[0.07]',text: 'text-emerald-300/70',tileBg: 'rgba(52,211,153,0.05)',tileBorder: 'rgba(52,211,153,0.30)' },
];

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

// ── Default step positions (grid layout within room bounds) ──────────────────

function getDefaultPos(index: number): { x: number; y: number } {
  const cols = 2;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const contentStartY = 14;
  return {
    x: 3 + col * 48,
    y: contentStartY + row * 28,
  };
}

// ── Props ────────────────────────────────────────────────────────────────────

interface FloorPlanRoomProps {
  layout: FloorPlanRoomLayout;
  steps: GameFlowStep[];
  roomIndex: number;
  isEditing: boolean;
  isShapeEditing?: boolean;
  isShapeSelected?: boolean;
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
  isShapeEditing = false,
  isShapeSelected = false,
  stepPositions,
  onMoveStart,
  onResizeStart,
  onUpdateStepPosition,
  onRenameRoom,
}: FloorPlanRoomProps) {
  const validatedLayout = useMemo(() => validateRoomBounds(layout), [layout]);
  const colors = ROOM_BG_COLORS[roomIndex % ROOM_BG_COLORS.length];
  const roomRef = useRef<HTMLDivElement>(null);

  // Room name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(layout.roomName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNameDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditing || isShapeEditing) return;
    e.stopPropagation();
    setNameValue(validatedLayout.roomName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  }, [isEditing, isShapeEditing, validatedLayout.roomName]);

  const commitRename = useCallback(() => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    if (trimmed && trimmed !== validatedLayout.roomName) {
      onRenameRoom?.(validatedLayout.roomName, trimmed);
    }
  }, [nameValue, validatedLayout.roomName, onRenameRoom]);

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
    if (!isEditing || isShapeEditing) return;
    if ((e.target as HTMLElement).dataset.resize) return;
    if ((e.target as HTMLElement).closest('[data-step-chip]')) return;
    onMoveStart(validatedLayout.roomName, e);
  };

  const handleStepPointerDown = (step: GameFlowStep, index: number, e: React.PointerEvent) => {
    if (!isEditing || isShapeEditing) return;
    e.stopPropagation();
    const pos = stepPositions[step.id] ?? getDefaultPos(index);
    setStepDrag({
      stepId: step.id,
      startPX: e.clientX, startPY: e.clientY,
      startX: pos.x, startY: pos.y,
    });
    roomRef.current?.setPointerCapture(e.pointerId);
  };

  const handleRoomPointerMove = (e: React.PointerEvent) => {
    if (!stepDrag || !roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const dx = ((e.clientX - stepDrag.startPX) / rect.width) * 100;
    const dy = ((e.clientY - stepDrag.startPY) / rect.height) * 100;

    let newX = stepDrag.startX + dx;
    let newY = stepDrag.startY + dy;

    const clamped = clampStepToRoom(
      validatedLayout.x + newX,
      validatedLayout.y + newY,
      validatedLayout.x,
      validatedLayout.y,
      validatedLayout.width,
      validatedLayout.height,
    );

    let finalX = clamped.x - layout.x;
    let finalY = clamped.y - layout.y;

    const MIN_DISTANCE = 8;
    for (const step of steps) {
      if (step.id === stepDrag.stepId) continue;
      const otherPos = stepPositions[step.id] ?? getDefaultPos(steps.indexOf(step));
      const dx2 = Math.abs(finalX - otherPos.x);
      const dy2 = Math.abs(finalY - otherPos.y);
      if (dx2 < MIN_DISTANCE && dy2 < MIN_DISTANCE) {
        if (dx2 < dy2) {
          finalX = finalX < otherPos.x ? otherPos.x - MIN_DISTANCE : otherPos.x + MIN_DISTANCE;
        } else {
          finalY = finalY < otherPos.y ? otherPos.y - MIN_DISTANCE : otherPos.y + MIN_DISTANCE;
        }
      }
    }

    const reclamped = clampStepToRoom(
      validatedLayout.x + finalX,
      validatedLayout.y + finalY,
      validatedLayout.x,
      validatedLayout.y,
      validatedLayout.width,
      validatedLayout.height,
    );

    onUpdateStepPosition(
      stepDrag.stepId,
      reclamped.x - layout.x,
      reclamped.y - layout.y,
    );
  };

  const handleRoomPointerUp = () => setStepDrag(null);

  // ── Tile mode ─────────────────────────────────────────────────────────────

  const hasTiles = !!(layout.tiles && layout.tiles.length > 0);

  const tileData = useMemo(() => {
    if (!layout.tiles || layout.tiles.length === 0) return null;
    const bbox = tilesBBox(layout.tiles);
    const minCol = Math.round(bbox.x / 5);
    const minRow = Math.round(bbox.y / 5);
    const numCols = Math.round(bbox.width / 5);
    const numRows = Math.round(bbox.height / 5);
    const tileSet = new Set(layout.tiles.map(t => `${t.row},${t.col}`));
    return { bbox, minCol, minRow, numCols, numRows, tileSet };
  }, [layout.tiles]);

  // ── Derived dimensions ────────────────────────────────────────────────────

  const boxX = hasTiles && tileData ? tileData.bbox.x : Math.max(0, Math.min(validatedLayout.x, 100 - validatedLayout.width));
  const boxY = hasTiles && tileData ? tileData.bbox.y : Math.max(0, Math.min(validatedLayout.y, 100 - validatedLayout.height));
  const boxW = hasTiles && tileData ? tileData.bbox.width : Math.max(8, Math.min(validatedLayout.width, 100));
  const boxH = hasTiles && tileData ? tileData.bbox.height : Math.max(8, Math.min(validatedLayout.height, 100));

  // ── Step chips (shared between tile + rect mode) ─────────────────────────

  const stepChips = (
    <div className="relative flex-1 min-h-0">
      {steps.map((step, i) => {
        const pos = stepPositions[step.id] ?? getDefaultPos(i);
        return (
          <div
            key={step.id}
            data-step-chip="true"
            className={`absolute rounded-lg border border-white/[0.12] bg-white/[0.06] backdrop-blur-sm ${
              isEditing && !isShapeEditing ? 'cursor-grab active:cursor-grabbing hover:brightness-125' : 'hover:brightness-110'
            } ${stepDrag?.stepId === step.id ? 'opacity-80 z-10 ring-1 ring-white/30' : ''} transition-all duration-100`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              maxWidth: '96%',
              minWidth: '70px',
            }}
            onPointerDown={(e) => handleStepPointerDown(step, i, e)}
          >
            {/* Header: number + stage */}
            <div className="flex items-center gap-1 px-1.5 pt-1 pb-0">
              <span className="text-[9px] font-mono font-bold text-white/35 tabular-nums leading-none">
                {String(step.stepNumber).padStart(2, '0')}
              </span>
              <span className={`text-[8px] font-bold leading-none ${STAGE_COLORS[step.stageLabel]}`}>
                {step.stageLabel}
              </span>
            </div>

            {/* Step title */}
            <div className="px-1.5 pt-0.5 pb-0">
              <span className="text-[10px] font-semibold text-white/82 leading-tight line-clamp-1 block">
                {step.clueTitle}
              </span>
            </div>

            {/* Answer */}
            {step.answer && (
              <div className="px-1.5 pt-0.5 pb-0">
                <span className="text-[10px] font-mono font-bold text-white/55 tracking-wider leading-none block">
                  {step.answer}
                </span>
              </div>
            )}

            {/* Tech: mode ▸ output */}
            <div className="flex items-center gap-0.5 px-1.5 pt-0.5 pb-1 text-[8px] text-white/30 leading-none">
              <span>{MODE_SHORT[step.problemMode] ?? step.problemMode}</span>
              <span className="text-white/20">▸</span>
              <span className="truncate">{OUTPUT_SHORT[step.output] ?? step.output}</span>
            </div>
          </div>
        );
      })}
      {steps.length === 0 && (
        <span className="absolute top-2 left-3 text-micro text-white/15 italic">스텝 없음</span>
      )}
    </div>
  );

  // ── Tile mode render ──────────────────────────────────────────────────────

  if (hasTiles && tileData) {
    const { minCol, minRow, numCols, numRows, tileSet } = tileData;
    const cellW = 100 / numCols;
    const cellH = 100 / numRows;
    const tileBg = colors.tileBg;
    const tileBorderColor = isShapeSelected ? 'rgba(255,255,255,0.55)' : colors.tileBorder;

    return (
      <div
        ref={roomRef}
        className={`absolute select-none ${isEditing && !isShapeEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        style={{ left: `${boxX}%`, top: `${boxY}%`, width: `${boxW}%`, height: `${boxH}%` }}
        onPointerDown={handleRoomPointerDown}
        onPointerMove={stepDrag ? handleRoomPointerMove : undefined}
        onPointerUp={stepDrag ? handleRoomPointerUp : undefined}
        onPointerCancel={stepDrag ? handleRoomPointerUp : undefined}
      >
        {/* Tile cells */}
        {layout.tiles!.map(({ row, col }) => {
          const relCol = col - minCol;
          const relRow = row - minRow;
          const hasT = !tileSet.has(`${row - 1},${col}`);
          const hasB = !tileSet.has(`${row + 1},${col}`);
          const hasL = !tileSet.has(`${row},${col - 1}`);
          const hasR = !tileSet.has(`${row},${col + 1}`);
          return (
            <div
              key={`${row},${col}`}
              style={{
                position: 'absolute',
                left: `${relCol * cellW}%`,
                top: `${relRow * cellH}%`,
                width: `${cellW}%`,
                height: `${cellH}%`,
                backgroundColor: tileBg,
                borderTop:    hasT ? `1.5px solid ${tileBorderColor}` : 'none',
                borderBottom: hasB ? `1.5px solid ${tileBorderColor}` : 'none',
                borderLeft:   hasL ? `1.5px solid ${tileBorderColor}` : 'none',
                borderRight:  hasR ? `1.5px solid ${tileBorderColor}` : 'none',
                boxSizing: 'border-box',
              }}
            />
          );
        })}

        {/* Room name label (top-left of bounding box) */}
        <div
          className={`absolute z-10 flex items-center justify-between px-2 py-1 left-0 right-0 top-0 ${colors.header} rounded-sm`}
          style={{ opacity: isShapeEditing ? 0.6 : 1 }}
        >
          <div className="flex items-center gap-1 min-w-0">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleNameKeyDown}
                className={`text-caption font-semibold ${colors.text} bg-transparent border-b border-white/30 outline-none w-full mr-2`}
                autoFocus
              />
            ) : (
              <span
                className={`text-caption font-semibold ${colors.text} truncate ${isEditing && !isShapeEditing ? 'cursor-text hover:underline decoration-dotted underline-offset-2' : ''}`}
                onDoubleClick={handleNameDoubleClick}
              >
                {validatedLayout.roomName}
              </span>
            )}
          </div>
          <span className="text-micro text-white/35 tabular-nums font-mono flex-shrink-0">{steps.length}</span>
        </div>

        {/* Step chips area */}
        {stepChips}

        {/* Resize handle — hidden in tile mode (use shape edit instead) */}
        {isEditing && !isShapeEditing && (
          <div
            data-resize="true"
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
            onPointerDown={e => { e.stopPropagation(); onResizeStart(validatedLayout.roomName, e); }}
          >
            <svg viewBox="0 0 16 16" className="w-full h-full text-white/15 hover:text-white/30 transition-colors">
              <path d="M14 2L2 14M14 6L6 14M14 10L10 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // ── Rectangle mode render (default) ──────────────────────────────────────

  return (
    <div
      ref={roomRef}
      className={`absolute rounded-xl border ${colors.border} ${colors.bg} overflow-hidden flex flex-col select-none ${
        isEditing && !isShapeEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        boxSizing: 'border-box',
        left: `${boxX}%`,
        top: `${boxY}%`,
        width: `${boxW}%`,
        height: `${boxH}%`,
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
              onChange={e => setNameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleNameKeyDown}
              className={`text-caption font-semibold ${colors.text} bg-transparent border-b border-white/30 outline-none w-full mr-2`}
              autoFocus
            />
          ) : (
            <span
              className={`text-caption font-semibold ${colors.text} truncate ${isEditing && !isShapeEditing ? 'cursor-text hover:underline decoration-dotted underline-offset-2' : ''}`}
              onDoubleClick={handleNameDoubleClick}
              title={isEditing ? '더블클릭으로 이름 변경' : undefined}
            >
              {validatedLayout.roomName}
            </span>
          )}
        </div>
        <span className="text-micro text-white/35 tabular-nums font-mono flex-shrink-0">{steps.length}</span>
      </div>

      {stepChips}

      {isEditing && !isShapeEditing && (
        <div
          data-resize="true"
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onPointerDown={e => { e.stopPropagation(); onResizeStart(validatedLayout.roomName, e); }}
        >
          <svg viewBox="0 0 16 16" className="w-full h-full text-white/15 hover:text-white/30 transition-colors">
            <path d="M14 2L2 14M14 6L6 14M14 10L10 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}
    </div>
  );
}
