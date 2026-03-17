import { useState, useRef, useCallback, useMemo } from 'react';
import type { GameFlowPlan } from '../../types/gameFlow';
import type { FloorPlanData, DoorLayout, DoorType } from '../../types/floorPlan';
import { CELL_PCT, GRID_COLS, GRID_ROWS } from '../../types/floorPlan';
import { normalizeFloorPlan, validateRoomBounds, tilesBBox, rectToTiles, syncRoomFromTiles } from '../../utils/floorPlan';
import FloorPlanRoom from './FloorPlanRoom';
import FloorPlanDoor from './FloorPlanDoor';

interface FloorPlanCanvasProps {
  plan: GameFlowPlan;
  floorPlan: FloorPlanData;
  onUpdateFloorPlan: (data: FloorPlanData) => void;
  isEditing: boolean;
  onRenameRoom?: (oldName: string, newName: string) => void;
}

interface DragState {
  type: 'room' | 'door';
  id: string;
  mode: 'move' | 'resize';
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  // For tile-mode move: original tiles
  origTiles?: { row: number; col: number }[];
}

function snap(value: number, grid: number = 5): number {
  return Math.round(value / grid) * grid;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Room color palette (hex rgba for shape-edit overlay) ────────────────────

const ROOM_TILE_FILL = [
  'rgba(255,255,255,0.06)',
  'rgba(56,189,248,0.08)',
  'rgba(251,113,133,0.08)',
  'rgba(245,158,11,0.08)',
  'rgba(52,211,153,0.08)',
];
const ROOM_TILE_STROKE = [
  'rgba(255,255,255,0.25)',
  'rgba(56,189,248,0.40)',
  'rgba(251,113,133,0.40)',
  'rgba(245,158,11,0.40)',
  'rgba(52,211,153,0.40)',
];

export default function FloorPlanCanvas({
  plan,
  floorPlan,
  onUpdateFloorPlan,
  isEditing,
  onRenameRoom,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // ── Shape edit state ─────────────────────────────────────────────────────
  const [shapeEditMode, setShapeEditMode] = useState(false);
  const [shapeEditRoomName, setShapeEditRoomName] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [paintAction, setPaintAction] = useState<'add' | 'erase' | null>(null);
  const [lastPaintedCell, setLastPaintedCell] = useState<string | null>(null);

  // ── Validated floor plan ─────────────────────────────────────────────────
  const validatedFloorPlan = useMemo(() => {
    const validated = {
      ...floorPlan,
      rooms: floorPlan.rooms.map(validateRoomBounds),
    };
    let normalized = normalizeFloorPlan(validated);
    const finalRooms = normalized.rooms.map(room => {
      const x = Math.max(0, Math.min(room.x, 100 - room.width));
      const y = Math.max(0, Math.min(room.y, 100 - room.height));
      const width = Math.max(8, Math.min(room.width, 100));
      const height = Math.max(8, Math.min(room.height, 100));
      return { ...room, x, y, width, height };
    });
    return { ...normalized, rooms: finalRooms };
  }, [floorPlan]);

  const doors = validatedFloorPlan.doors ?? [];

  // Group steps by room
  const stepsByRoom = new Map<string, typeof plan.steps>();
  for (const step of plan.steps) {
    const arr = stepsByRoom.get(step.room) ?? [];
    arr.push(step);
    stepsByRoom.set(step.room, arr);
  }

  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() ?? null;
  }, []);

  // ── Cell coordinate helper ───────────────────────────────────────────────

  const getCellFromPointer = useCallback((e: React.PointerEvent): { row: number; col: number } | null => {
    const rect = getContainerRect();
    if (!rect) return null;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const col = clamp(Math.floor(px / CELL_PCT), 0, GRID_COLS - 1);
    const row = clamp(Math.floor(py / CELL_PCT), 0, GRID_ROWS - 1);
    return { row, col };
  }, [getContainerRect]);

  // Build cell → room index map for shape edit overlay
  const cellOwnerMap = useMemo(() => {
    const map = new Map<string, number>();
    validatedFloorPlan.rooms.forEach((room, idx) => {
      if (room.tiles && room.tiles.length > 0) {
        room.tiles.forEach(t => map.set(`${t.row},${t.col}`, idx));
      } else {
        // derive tiles from rectangle
        const startCol = Math.round(room.x / CELL_PCT);
        const startRow = Math.round(room.y / CELL_PCT);
        const numCols = Math.round(room.width / CELL_PCT);
        const numRows = Math.round(room.height / CELL_PCT);
        for (let r = startRow; r < startRow + numRows; r++) {
          for (let c = startCol; c < startCol + numCols; c++) {
            map.set(`${r},${c}`, idx);
          }
        }
      }
    });
    return map;
  }, [validatedFloorPlan.rooms]);

  // ── Shape paint handler ──────────────────────────────────────────────────

  const applyPaint = useCallback((row: number, col: number, action: 'add' | 'erase') => {
    const cellKey = `${row},${col}`;
    if (lastPaintedCell === cellKey) return;
    setLastPaintedCell(cellKey);

    if (!shapeEditRoomName) return;

    const rooms = validatedFloorPlan.rooms.map(room => {
      if (room.roomName !== shapeEditRoomName) return room;

      // Get current tiles (convert rect → tiles if needed)
      let currentTiles = room.tiles && room.tiles.length > 0
        ? [...room.tiles]
        : rectToTiles(room.x, room.y, room.width, room.height);

      if (action === 'add') {
        if (!currentTiles.some(t => t.row === row && t.col === col)) {
          currentTiles.push({ row, col });
        }
      } else {
        currentTiles = currentTiles.filter(t => !(t.row === row && t.col === col));
        if (currentTiles.length === 0) return room; // don't allow empty
      }

      const updated = { ...room, tiles: currentTiles };
      return syncRoomFromTiles(updated);
    });

    onUpdateFloorPlan({ ...validatedFloorPlan, rooms });
  }, [shapeEditRoomName, validatedFloorPlan, lastPaintedCell, onUpdateFloorPlan]);

  // ── Shape edit mode pointer handlers ────────────────────────────────────

  const handleShapePointerDown = useCallback((e: React.PointerEvent) => {
    if (!shapeEditMode) return;
    const cell = getCellFromPointer(e);
    if (!cell) return;
    e.stopPropagation();

    const { row, col } = cell;
    const cellKey = `${row},${col}`;
    const ownerIdx = cellOwnerMap.get(cellKey);

    if (shapeEditRoomName === null) {
      // Select a room by clicking its cell
      if (ownerIdx !== undefined) {
        setShapeEditRoomName(validatedFloorPlan.rooms[ownerIdx].roomName);
      }
      return;
    }

    // Determine paint action based on whether cell belongs to selected room
    const selectedRoom = validatedFloorPlan.rooms.find(r => r.roomName === shapeEditRoomName);
    const roomTiles = selectedRoom?.tiles ?? (selectedRoom ? rectToTiles(selectedRoom.x, selectedRoom.y, selectedRoom.width, selectedRoom.height) : []);
    const cellBelongsToRoom = roomTiles.some(t => t.row === row && t.col === col);
    const cellBelongsToOther = ownerIdx !== undefined && validatedFloorPlan.rooms[ownerIdx].roomName !== shapeEditRoomName;

    if (cellBelongsToOther) return; // can't paint over other rooms

    const action = cellBelongsToRoom ? 'erase' : 'add';
    setPaintAction(action);
    setLastPaintedCell(null);
    applyPaint(row, col, action);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [shapeEditMode, shapeEditRoomName, cellOwnerMap, validatedFloorPlan, getCellFromPointer, applyPaint]);

  const handleShapePointerMove = useCallback((e: React.PointerEvent) => {
    const cell = getCellFromPointer(e);
    setHoverCell(cell);

    if (!shapeEditMode || !paintAction || !shapeEditRoomName) return;
    if (!cell) return;

    // Only paint if pointer is captured (button still down)
    if (e.buttons === 0) {
      setPaintAction(null);
      return;
    }

    const cellBelongsToOther = cellOwnerMap.get(`${cell.row},${cell.col}`) !== undefined
      && validatedFloorPlan.rooms.find(r => r.roomName === shapeEditRoomName) !== validatedFloorPlan.rooms[cellOwnerMap.get(`${cell.row},${cell.col}`)!];

    if (!cellBelongsToOther) {
      applyPaint(cell.row, cell.col, paintAction);
    }
  }, [shapeEditMode, paintAction, shapeEditRoomName, cellOwnerMap, validatedFloorPlan, getCellFromPointer, applyPaint]);

  const handleShapePointerUp = useCallback(() => {
    setPaintAction(null);
    setLastPaintedCell(null);
  }, []);

  const enterShapeEdit = useCallback(() => {
    setShapeEditMode(true);
    setShapeEditRoomName(null);
    setHoverCell(null);
    setPaintAction(null);
  }, []);

  const exitShapeEdit = useCallback(() => {
    setShapeEditMode(false);
    setShapeEditRoomName(null);
    setHoverCell(null);
    setPaintAction(null);
  }, []);

  // ── Room handlers ────────────────────────────────────────────────────────

  const handleRoomMoveStart = useCallback((roomName: string, e: React.PointerEvent) => {
    if (shapeEditMode) return;
    const room = validatedFloorPlan.rooms.find(r => r.roomName === roomName);
    if (!room) return;
    setDragState({
      type: 'room', id: roomName, mode: 'move',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: room.x, startY: room.y, startW: room.width, startH: room.height,
      origTiles: room.tiles ? [...room.tiles] : undefined,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [validatedFloorPlan.rooms, shapeEditMode]);

  const handleRoomResizeStart = useCallback((roomName: string, e: React.PointerEvent) => {
    if (shapeEditMode) return;
    const room = validatedFloorPlan.rooms.find(r => r.roomName === roomName);
    if (!room) return;
    setDragState({
      type: 'room', id: roomName, mode: 'resize',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: room.x, startY: room.y, startW: room.width, startH: room.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [validatedFloorPlan.rooms, shapeEditMode]);

  // ── Door handlers ────────────────────────────────────────────────────────

  const handleDoorMoveStart = useCallback((doorId: string, e: React.PointerEvent) => {
    const door = doors.find(d => d.id === doorId);
    if (!door) return;
    setDragState({
      type: 'door', id: doorId, mode: 'move',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: door.x, startY: door.y, startW: door.width, startH: door.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [doors]);

  const handleDoorResizeStart = useCallback((doorId: string, e: React.PointerEvent) => {
    const door = doors.find(d => d.id === doorId);
    if (!door) return;
    setDragState({
      type: 'door', id: doorId, mode: 'resize',
      startPointerX: e.clientX, startPointerY: e.clientY,
      startX: door.x, startY: door.y, startW: door.width, startH: door.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [doors]);

  const handleDoorRotate = useCallback((doorId: string) => {
    onUpdateFloorPlan({
      ...floorPlan,
      doors: doors.map(d => d.id === doorId ? { ...d, rotation: (d.rotation + 90) % 360 } : d),
    });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleDoorDelete = useCallback((doorId: string) => {
    onUpdateFloorPlan({ ...floorPlan, doors: doors.filter(d => d.id !== doorId) });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleDoorChangeType = useCallback((doorId: string, type: DoorType) => {
    onUpdateFloorPlan({ ...floorPlan, doors: doors.map(d => d.id === doorId ? { ...d, type } : d) });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleAddDoor = useCallback(() => {
    const newDoor: DoorLayout = {
      id: `door-${Date.now()}`,
      x: 45, y: 45, width: 10, height: 10, rotation: 0, type: 'swing',
    };
    onUpdateFloorPlan({ ...floorPlan, doors: [...doors, newDoor] });
  }, [floorPlan, doors, onUpdateFloorPlan]);

  const handleUpdateStepPosition = useCallback((stepId: string, x: number, y: number) => {
    onUpdateFloorPlan({
      ...floorPlan,
      stepPositions: { ...(floorPlan.stepPositions ?? {}), [stepId]: { x, y } },
    });
  }, [floorPlan, onUpdateFloorPlan]);

  // ── Pointer move / up ────────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (shapeEditMode) {
      handleShapePointerMove(e);
      return;
    }
    if (!dragState) return;
    const rect = getContainerRect();
    if (!rect) return;

    const dx = ((e.clientX - dragState.startPointerX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.startPointerY) / rect.height) * 100;

    if (dragState.type === 'room') {
      const updatedRooms = validatedFloorPlan.rooms.map(room => {
        if (room.roomName !== dragState.id) return room;
        if (dragState.mode === 'move') {
          const newX = snap(clamp(dragState.startX + dx, 0, 100 - room.width));
          const newY = snap(clamp(dragState.startY + dy, 0, 100 - room.height));

          // Tile mode: shift all tiles by the grid offset
          if (dragState.origTiles && dragState.origTiles.length > 0) {
            const dcol = Math.round((newX - dragState.startX) / CELL_PCT);
            const drow = Math.round((newY - dragState.startY) / CELL_PCT);
            const newTiles = dragState.origTiles.map(t => ({
              row: clamp(t.row + drow, 0, GRID_ROWS - 1),
              col: clamp(t.col + dcol, 0, GRID_COLS - 1),
            }));
            const updated = { ...room, tiles: newTiles };
            return syncRoomFromTiles(updated);
          }

          return { ...room, x: newX, y: newY };
        } else {
          // resize only for rect mode
          const newWidth = snap(clamp(dragState.startW + dx, 8, 100));
          const newHeight = snap(clamp(dragState.startH + dy, 8, 100));
          const newX = Math.max(0, Math.min(room.x, 100 - newWidth));
          const newY = Math.max(0, Math.min(room.y, 100 - newHeight));
          return { ...room, x: newX, y: newY, width: newWidth, height: newHeight };
        }
      });
      const normalized = normalizeFloorPlan({ ...validatedFloorPlan, doors, rooms: updatedRooms });
      onUpdateFloorPlan(normalized);
    } else {
      const updatedDoors = doors.map(door => {
        if (door.id !== dragState.id) return door;
        if (dragState.mode === 'move') {
          return {
            ...door,
            x: snap(clamp(dragState.startX + dx, 0, 100 - door.width)),
            y: snap(clamp(dragState.startY + dy, 0, 100 - door.height)),
          };
        } else {
          return {
            ...door,
            width:  snap(clamp(dragState.startW + dx, 5, 60)),
            height: snap(clamp(dragState.startH + dy, 5, 60)),
          };
        }
      });
      onUpdateFloorPlan({ ...validatedFloorPlan, doors: updatedDoors });
    }
  }, [dragState, shapeEditMode, validatedFloorPlan, doors, getContainerRect, onUpdateFloorPlan, handleShapePointerMove]);

  const handlePointerUp = useCallback(() => {
    setDragState(null);
    handleShapePointerUp();
  }, [handleShapePointerUp]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Canvas toolbar */}
      <div className="flex items-center gap-3 px-1 flex-shrink-0">
        <span className="text-caption text-white/35">
          {validatedFloorPlan.rooms.length}개 공간 배치
        </span>
        {doors.length > 0 && (
          <span className="text-caption text-white/30">· 문 {doors.length}개</span>
        )}

        {isEditing && !shapeEditMode && (
          <>
            <span className="text-micro text-white/15">드래그로 이동 · 핸들로 크기 조절</span>
            <button
              onClick={handleAddDoor}
              className="px-2.5 py-1 rounded-full border border-white/[0.15] text-caption text-white/50 hover:text-white/75 hover:border-white/30 transition-all"
            >
              + 문 추가
            </button>
            <button
              onClick={enterShapeEdit}
              className="ml-auto px-2.5 py-1 rounded-full border border-white/[0.15] text-caption text-white/50 hover:text-white/75 hover:border-white/30 transition-all flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              모양 편집
            </button>
          </>
        )}

        {shapeEditMode && (
          <div className="flex items-center gap-2 ml-auto">
            {shapeEditRoomName ? (
              <span className="text-caption text-white/55 font-medium">
                <span className="text-white/30">편집 중: </span>{shapeEditRoomName}
              </span>
            ) : (
              <span className="text-caption text-white/35">공간 클릭하여 선택</span>
            )}
            {shapeEditRoomName && (
              <button
                onClick={() => setShapeEditRoomName(null)}
                className="px-2 py-0.5 rounded text-caption text-white/40 hover:text-white/65 border border-white/[0.10] hover:border-white/[0.20] transition-all"
              >
                다른 방
              </button>
            )}
            <button
              onClick={exitShapeEdit}
              className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.18] text-caption text-white/70 hover:text-white hover:bg-white/[0.12] transition-all font-medium"
            >
              완료
            </button>
          </div>
        )}
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className={`relative rounded-2xl border overflow-hidden transition-colors duration-200 ${
          shapeEditMode
            ? 'border-white/[0.20] bg-white/[0.02]'
            : isEditing
              ? 'border-white/[0.15] bg-white/[0.03]'
              : 'border-white/[0.07] bg-white/[0.01]'
        }`}
        style={{
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '1',
          backgroundImage: [
            shapeEditMode
              ? 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px)'
              : isEditing
                ? 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)'
                : 'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px)',
            shapeEditMode
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)'
              : isEditing
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)'
                : 'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '5% 5%',
          clipPath: 'inset(0)',
          cursor: shapeEditMode
            ? (shapeEditRoomName ? 'crosshair' : 'default')
            : undefined,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoverCell(null)}
        onPointerDown={shapeEditMode ? handleShapePointerDown : undefined}
      >
        {/* Rooms */}
        {validatedFloorPlan.rooms.map((layout, i) => (
          <FloorPlanRoom
            key={layout.roomName}
            layout={layout}
            steps={stepsByRoom.get(layout.roomName) ?? []}
            roomIndex={i}
            isEditing={isEditing}
            isShapeEditing={shapeEditMode}
            isShapeSelected={shapeEditRoomName === layout.roomName}
            stepPositions={validatedFloorPlan.stepPositions ?? {}}
            onMoveStart={handleRoomMoveStart}
            onResizeStart={handleRoomResizeStart}
            onUpdateStepPosition={handleUpdateStepPosition}
            onRenameRoom={onRenameRoom}
          />
        ))}

        {/* Doors */}
        {doors.map(door => (
          <FloorPlanDoor
            key={door.id}
            door={door}
            isEditing={isEditing && !shapeEditMode}
            onMoveStart={handleDoorMoveStart}
            onResizeStart={handleDoorResizeStart}
            onRotate={handleDoorRotate}
            onChangeType={handleDoorChangeType}
            onDelete={handleDoorDelete}
          />
        ))}

        {/* Shape edit overlay: hover highlight + painted cell preview */}
        {shapeEditMode && hoverCell && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${hoverCell.col * CELL_PCT}%`,
              top: `${hoverCell.row * CELL_PCT}%`,
              width: `${CELL_PCT}%`,
              height: `${CELL_PCT}%`,
              backgroundColor: shapeEditRoomName
                ? (paintAction === 'erase'
                    ? 'rgba(255,80,80,0.20)'
                    : 'rgba(255,255,255,0.12)')
                : 'rgba(255,255,255,0.08)',
              border: '1.5px dashed rgba(255,255,255,0.35)',
              boxSizing: 'border-box',
              zIndex: 50,
            }}
          />
        )}

        {/* Shape edit mode dim overlay for non-selected rooms */}
        {shapeEditMode && shapeEditRoomName && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            {validatedFloorPlan.rooms.map((room, i) => {
              if (room.roomName === shapeEditRoomName) return null;
              const tiles = room.tiles && room.tiles.length > 0
                ? room.tiles
                : (() => {
                    const sc = Math.round(room.x / CELL_PCT);
                    const sr = Math.round(room.y / CELL_PCT);
                    const nc = Math.round(room.width / CELL_PCT);
                    const nr = Math.round(room.height / CELL_PCT);
                    const ts: { row: number; col: number }[] = [];
                    for (let r = sr; r < sr + nr; r++)
                      for (let c = sc; c < sc + nc; c++)
                        ts.push({ row: r, col: c });
                    return ts;
                  })();
              return tiles.map(t => (
                <div
                  key={`dim-${room.roomName}-${t.row},${t.col}`}
                  style={{
                    position: 'absolute',
                    left: `${t.col * CELL_PCT}%`,
                    top: `${t.row * CELL_PCT}%`,
                    width: `${CELL_PCT}%`,
                    height: `${CELL_PCT}%`,
                    backgroundColor: ROOM_TILE_FILL[i % ROOM_TILE_FILL.length],
                    opacity: 0.4,
                  }}
                />
              ));
            })}
          </div>
        )}

        {/* Shape edit hint */}
        {shapeEditMode && !shapeEditRoomName && (
          <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none" style={{ zIndex: 60 }}>
            <span className="px-3 py-1.5 rounded-full bg-black/60 text-caption text-white/55 backdrop-blur-sm">
              공간을 클릭하여 선택 후 셀을 칠해 모양을 변경하세요
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
