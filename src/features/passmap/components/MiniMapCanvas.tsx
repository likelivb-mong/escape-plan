import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import type { ThemeStep, ThemeRoom, StepDetail } from '../types/passmap';
import StepPin from './StepPin';

const GRID_PX = 20;
const CELL_PCT = 5; // each tile = 5% of canvas width/height

// ── Room color palette ─────────────────────────────────────────────────────
const ROOM_COLORS_RAW = [
  { bg: 'rgba(255,255,255,0.03)',  border: 'rgba(255,255,255,0.22)',  name: '#a0a8b8' },
  { bg: 'rgba(56,189,248,0.04)',   border: 'rgba(56,189,248,0.35)',   name: '#60b0d0' },
  { bg: 'rgba(251,113,133,0.04)', border: 'rgba(251,113,133,0.35)',  name: '#c06878' },
  { bg: 'rgba(245,158,11,0.04)',  border: 'rgba(245,158,11,0.35)',   name: '#b09040' },
  { bg: 'rgba(52,211,153,0.04)',  border: 'rgba(52,211,153,0.35)',   name: '#40a878' },
  { bg: 'rgba(139,92,246,0.04)',  border: 'rgba(139,92,246,0.35)',   name: '#8868c0' },
];

interface MiniMapCanvasProps {
  steps: ThemeStep[];
  selectedStepId: string | null;
  onSelectStep: (step: ThemeStep) => void;
  mapImage?: string;
  rooms?: ThemeRoom[];
  editable?: boolean;
  onStepMove?: (stepId: string, x: number, y: number) => void;
  onRoomUpdate?: (roomName: string, updates: Partial<ThemeRoom>) => void;
  onRoomMove?: (roomName: string, deltaX: number, deltaY: number) => void;
  details?: StepDetail[];
}

// ── AABB 충돌 감지 ────────────────────────────────────────────────────────────
function hasCollision(
  test: { x: number; y: number; width: number; height: number },
  excludeName: string,
  allRooms: ThemeRoom[],
): boolean {
  return allRooms.some((other) => {
    if (other.name === excludeName) return false;
    const otherBounds = getRoomBounds(other);
    return (
      test.x < otherBounds.x + otherBounds.w &&
      test.x + test.width > otherBounds.x &&
      test.y < otherBounds.y + otherBounds.h &&
      test.y + test.height > otherBounds.y
    );
  });
}

// ── Tile bounding box ─────────────────────────────────────────────────────────
function tilesBBox(tiles: { row: number; col: number }[]) {
  if (!tiles || tiles.length === 0) return null;
  const rows = tiles.map(t => t.row);
  const cols = tiles.map(t => t.col);
  const minRow = Math.min(...rows), maxRow = Math.max(...rows);
  const minCol = Math.min(...cols), maxCol = Math.max(...cols);
  return { minRow, maxRow, minCol, maxCol };
}

function getRoomBounds(room: ThemeRoom) {
  if (room.tiles && room.tiles.length > 0) {
    const bbox = tilesBBox(room.tiles)!;
    return {
      x: bbox.minCol * CELL_PCT,
      y: bbox.minRow * CELL_PCT,
      w: (bbox.maxCol - bbox.minCol + 1) * CELL_PCT,
      h: (bbox.maxRow - bbox.minRow + 1) * CELL_PCT,
    };
  }
  return { x: room.x, y: room.y, w: room.width, h: room.height };
}

function pxToX(px: number, rect: DOMRect) { return (px / rect.width) * 100; }
function pxToY(px: number, rect: DOMRect) { return (px / rect.height) * 100; }
function xToPx(pct: number, rect: DOMRect) { return (pct / 100) * rect.width; }
function yToPx(pct: number, rect: DOMRect) { return (pct / 100) * rect.height; }

export default function MiniMapCanvas({
  steps,
  selectedStepId,
  onSelectStep,
  mapImage,
  rooms,
  editable = false,
  onStepMove,
  onRoomUpdate,
  onRoomMove,
  details = [],
}: MiniMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) =>
      setContainerWidth(entries[0].contentRect.width),
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const [draggedRoom, setDraggedRoom] = useState<{
    name: string; x: number; y: number; width: number; height: number;
  } | null>(null);

  // ── Shape edit mode ────────────────────────────────────────────────────────
  const [shapeEditMode, setShapeEditMode] = useState(false);
  const [shapeEditRoomName, setShapeEditRoomName] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [paintAction, setPaintAction] = useState<'add' | 'erase' | null>(null);
  const [lastPaintedCell, setLastPaintedCell] = useState<string | null>(null);

  const hasRooms = rooms && rooms.length > 0;

  const canvasHeight = useMemo(() => {
    if (!containerWidth || !rooms || rooms.length === 0) return 600;
    const maxBottomPct = Math.max(...rooms.map((r) => {
      if (r.tiles && r.tiles.length > 0) {
        const bbox = tilesBBox(r.tiles)!;
        return (bbox.maxRow + 1) * CELL_PCT;
      }
      return r.y + r.height;
    }));
    return Math.max(600, (maxBottomPct / 100) * containerWidth * 1.2);
  }, [rooms, containerWidth]);

  const stepCountByZone = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of steps) map.set(s.zone, (map.get(s.zone) || 0) + 1);
    return map;
  }, [steps]);

  const detailByStepId = useMemo(() => {
    const map = new Map<string, StepDetail>();
    for (const d of details) map.set(d.stepId, d);
    return map;
  }, [details]);

  // Build cell → room index map
  const cellOwnerMap = useMemo(() => {
    const map = new Map<string, number>();
    (rooms ?? []).forEach((room, idx) => {
      if (room.tiles && room.tiles.length > 0) {
        room.tiles.forEach(t => map.set(`${t.row},${t.col}`, idx));
      } else {
        const sc = Math.round(room.x / CELL_PCT);
        const sr = Math.round(room.y / CELL_PCT);
        const nc = Math.max(1, Math.round(room.width / CELL_PCT));
        const nr = Math.max(1, Math.round(room.height / CELL_PCT));
        for (let r = sr; r < sr + nr; r++)
          for (let c = sc; c < sc + nc; c++)
            map.set(`${r},${c}`, idx);
      }
    });
    return map;
  }, [rooms]);

  // ── Shape paint ────────────────────────────────────────────────────────────
  const getCellFromPointer = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const col = Math.max(0, Math.min(19, Math.floor(px / CELL_PCT)));
    const row = Math.max(0, Math.min(39, Math.floor(py / CELL_PCT)));
    return { row, col };
  }, []);

  const applyPaint = useCallback((row: number, col: number, action: 'add' | 'erase') => {
    const cellKey = `${row},${col}`;
    if (lastPaintedCell === cellKey) return;
    setLastPaintedCell(cellKey);
    if (!shapeEditRoomName || !onRoomUpdate || !rooms) return;

    const room = rooms.find(r => r.name === shapeEditRoomName);
    if (!room) return;

    let currentTiles = room.tiles && room.tiles.length > 0
      ? [...room.tiles]
      : (() => {
          const sc = Math.round(room.x / CELL_PCT);
          const sr = Math.round(room.y / CELL_PCT);
          const nc = Math.max(1, Math.round(room.width / CELL_PCT));
          const nr = Math.max(1, Math.round(room.height / CELL_PCT));
          const ts: { row: number; col: number }[] = [];
          for (let r = sr; r < sr + nr; r++)
            for (let c = sc; c < sc + nc; c++)
              ts.push({ row: r, col: c });
          return ts;
        })();

    if (action === 'add') {
      if (!currentTiles.some(t => t.row === row && t.col === col)) {
        currentTiles.push({ row, col });
      }
    } else {
      currentTiles = currentTiles.filter(t => !(t.row === row && t.col === col));
      if (currentTiles.length === 0) return;
    }

    const bbox = tilesBBox(currentTiles);
    if (!bbox) return;
    onRoomUpdate(room.name, {
      tiles: currentTiles,
      x: bbox.minCol * CELL_PCT,
      y: bbox.minRow * CELL_PCT,
      width: (bbox.maxCol - bbox.minCol + 1) * CELL_PCT,
      height: (bbox.maxRow - bbox.minRow + 1) * CELL_PCT,
    });
  }, [shapeEditRoomName, lastPaintedCell, onRoomUpdate, rooms]);

  const handleShapePointerDown = useCallback((e: React.PointerEvent) => {
    if (!shapeEditMode) return;
    const cell = getCellFromPointer(e);
    if (!cell) return;
    e.stopPropagation();
    const { row, col } = cell;
    const ownerIdx = cellOwnerMap.get(`${row},${col}`);

    if (!shapeEditRoomName) return;

    const room = rooms?.find(r => r.name === shapeEditRoomName);
    const roomTiles = room?.tiles && room.tiles.length > 0
      ? room.tiles
      : (() => {
          if (!room) return [];
          const sc = Math.round(room.x / CELL_PCT);
          const sr = Math.round(room.y / CELL_PCT);
          const nc = Math.max(1, Math.round(room.width / CELL_PCT));
          const nr = Math.max(1, Math.round(room.height / CELL_PCT));
          const ts: { row: number; col: number }[] = [];
          for (let r = sr; r < sr + nr; r++)
            for (let c = sc; c < sc + nc; c++)
              ts.push({ row: r, col: c });
          return ts;
        })();

    const cellBelongsToRoom = roomTiles.some(t => t.row === row && t.col === col);
    const cellBelongsToOther = ownerIdx !== undefined && rooms![ownerIdx].name !== shapeEditRoomName;
    if (cellBelongsToOther) return;

    const action = cellBelongsToRoom ? 'erase' : 'add';
    setPaintAction(action);
    setLastPaintedCell(null);
    applyPaint(row, col, action);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [shapeEditMode, shapeEditRoomName, cellOwnerMap, rooms, getCellFromPointer, applyPaint]);

  const handleShapePointerMove = useCallback((e: React.PointerEvent) => {
    const cell = getCellFromPointer(e);
    setHoverCell(cell);
    if (!shapeEditMode || !paintAction || !shapeEditRoomName || !cell) return;
    if (e.buttons === 0) { setPaintAction(null); return; }
    const ownerIdx = cellOwnerMap.get(`${cell.row},${cell.col}`);
    const cellBelongsToOther = ownerIdx !== undefined && rooms![ownerIdx].name !== shapeEditRoomName;
    if (!cellBelongsToOther) applyPaint(cell.row, cell.col, paintAction);
  }, [shapeEditMode, paintAction, shapeEditRoomName, cellOwnerMap, rooms, getCellFromPointer, applyPaint]);

  // ── Step drag ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.MouseEvent, step: ThemeStep) => {
      if (!editable || !onStepMove || shapeEditMode) return;
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY;
      const origX = step.x, origY = step.y;
      const room = rooms?.find((r) => r.name === step.zone);

      const handleMouseMove = (me: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let newX = origX + pxToX(me.clientX - startX, rect);
        let newY = origY + pxToY(me.clientY - startY, rect);

        if (room) {
          const bounds = getRoomBounds(room);
          const PIN = 2.5;
          newX = Math.max(bounds.x + PIN, Math.min(bounds.x + bounds.w - PIN, newX));
          newY = Math.max(bounds.y + PIN, Math.min(bounds.y + bounds.h - PIN, newY));
        } else {
          newX = Math.max(2, Math.min(98, newX));
          newY = Math.max(2, Math.min(98, newY));
        }
        onStepMove(step.id, newX, newY);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [editable, onStepMove, rooms, shapeEditMode],
  );

  // ── Room drag ────────────────────────────────────────────────────────────
  const handleRoomDragStart = useCallback(
    (e: React.MouseEvent, room: ThemeRoom, dragType: 'move' | 'resize') => {
      if (!editable || shapeEditMode) return;
      e.preventDefault();
      e.stopPropagation();

      const bounds = getRoomBounds(room);
      let lastValidX = bounds.x, lastValidY = bounds.y;
      let lastValidW = bounds.w, lastValidH = bounds.h;

      const handleMouseMove = (me: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = me.clientX - e.clientX;
        const dy = me.clientY - e.clientY;

        if (dragType === 'move') {
          let newPxX = xToPx(bounds.x, rect) + dx;
          let newPxY = yToPx(bounds.y, rect) + dy;
          newPxX = Math.round(newPxX / GRID_PX) * GRID_PX;
          newPxY = Math.round(newPxY / GRID_PX) * GRID_PX;
          let newX = Math.max(0, Math.min(100 - bounds.w, pxToX(newPxX, rect)));
          let newY = Math.max(0, Math.min(100 - bounds.h, pxToY(newPxY, rect)));

          const testBounds = { x: newX, y: newY, width: bounds.w, height: bounds.h };
          if (!hasCollision(testBounds, room.name, rooms ?? [])) {
            lastValidX = newX; lastValidY = newY;
          }
          setDraggedRoom({ name: room.name, x: lastValidX, y: lastValidY, width: bounds.w, height: bounds.h });
        } else {
          let newPxW = xToPx(bounds.w, rect) + dx;
          let newPxH = yToPx(bounds.h, rect) + dy;
          newPxW = Math.round(Math.max(GRID_PX * 4, newPxW) / GRID_PX) * GRID_PX;
          newPxH = Math.round(Math.max(GRID_PX * 3, newPxH) / GRID_PX) * GRID_PX;
          let newW = Math.min(pxToX(newPxW, rect), 100 - bounds.x);
          let newH = Math.min(pxToY(newPxH, rect), 100 - bounds.y);

          const testBounds = { x: bounds.x, y: bounds.y, width: newW, height: newH };
          if (!hasCollision(testBounds, room.name, rooms ?? [])) {
            lastValidW = newW; lastValidH = newH;
          }
          setDraggedRoom({ name: room.name, x: bounds.x, y: bounds.y, width: lastValidW, height: lastValidH });
        }
      };

      const handleMouseUp = () => {
        if (dragType === 'move') {
          const deltaX = lastValidX - bounds.x;
          const deltaY = lastValidY - bounds.y;
          if ((deltaX !== 0 || deltaY !== 0) && onRoomMove) {
            // For tiled rooms, shift all tiles
            if (room.tiles && room.tiles.length > 0) {
              const dcol = Math.round(deltaX / CELL_PCT);
              const drow = Math.round(deltaY / CELL_PCT);
              const newTiles = room.tiles.map(t => ({
                row: Math.max(0, t.row + drow),
                col: Math.max(0, t.col + dcol),
              }));
              const bbox = tilesBBox(newTiles);
              if (bbox) {
                onRoomUpdate?.(room.name, {
                  tiles: newTiles,
                  x: bbox.minCol * CELL_PCT,
                  y: bbox.minRow * CELL_PCT,
                  width: (bbox.maxCol - bbox.minCol + 1) * CELL_PCT,
                  height: (bbox.maxRow - bbox.minRow + 1) * CELL_PCT,
                });
              }
            } else {
              onRoomMove(room.name, deltaX, deltaY);
            }
          }
        } else {
          if (lastValidW !== bounds.w || lastValidH !== bounds.h) {
            onRoomUpdate?.(room.name, { width: lastValidW, height: lastValidH });
          }
        }
        setDraggedRoom(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [editable, rooms, onRoomMove, onRoomUpdate, shapeEditMode],
  );

  const exitShapeEdit = () => {
    setShapeEditMode(false);
    setShapeEditRoomName(null);
    setHoverCell(null);
    setPaintAction(null);
  };

  const enterShapeEdit = (roomName: string) => {
    setShapeEditMode(true);
    setShapeEditRoomName(roomName);
    setLastPaintedCell(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Shape edit instruction banner */}
      {shapeEditMode && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.15]">
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex-shrink-0">모양 편집</span>
          <span className="text-caption text-white/55 flex-shrink-0 font-medium">{shapeEditRoomName}</span>
          <span className="text-caption text-white/30 hidden sm:block">· 셀 클릭/드래그로 추가, 이미 있는 셀은 제거</span>
          <div className="flex items-center gap-1.5 ml-auto">
            {rooms && rooms.length > 1 && (
              <div className="flex gap-0.5">
                {rooms.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setShapeEditRoomName(r.name)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all truncate max-w-[60px] ${
                      r.name === shapeEditRoomName
                        ? 'bg-white/[0.15] text-white/80'
                        : 'text-white/30 hover:text-white/60 hover:bg-white/[0.06]'
                    }`}
                    title={r.name}
                  >
                    {r.name.length > 5 ? r.name.slice(0, 5) + '…' : r.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={exitShapeEdit}
              className="px-2.5 py-1 rounded-full bg-white text-black text-caption font-semibold hover:bg-white/90 transition-all flex-shrink-0"
            >
              완료
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-xl border overflow-x-hidden overflow-y-auto transition-colors ${
          shapeEditMode ? 'border-white/[0.20] bg-[#09090c]' : 'border-white/10 bg-[#0a0b0e]'
        }`}
        style={{ height: `${canvasHeight}px`, cursor: shapeEditMode ? (shapeEditRoomName ? 'crosshair' : 'default') : undefined }}
        onPointerDown={shapeEditMode ? handleShapePointerDown : undefined}
        onPointerMove={shapeEditMode ? handleShapePointerMove : undefined}
        onPointerUp={() => { setPaintAction(null); setLastPaintedCell(null); }}
        onPointerLeave={() => setHoverCell(null)}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: mapImage
              ? `url(${mapImage})`
              : shapeEditMode
                ? `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`
                : `linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)`,
            backgroundSize: mapImage ? 'cover' : `${GRID_PX}px ${GRID_PX}px`,
          }}
        />

        {/* Rooms */}
        {hasRooms && rooms.map((room, i) => {
          const colors = ROOM_COLORS_RAW[i % ROOM_COLORS_RAW.length];
          const count = stepCountByZone.get(room.name) ?? room.stepCount;
          const isDragging = draggedRoom?.name === room.name;
          const isSelected = shapeEditMode && shapeEditRoomName === room.name;

          if (room.tiles && room.tiles.length > 0) {
            // ── Tile mode room ──────────────────────────────────────────
            const bbox = tilesBBox(room.tiles)!;
            const numCols = bbox.maxCol - bbox.minCol + 1;
            const numRows = bbox.maxRow - bbox.minRow + 1;
            const tileSet = new Set(room.tiles.map(t => `${t.row},${t.col}`));
            const borderColor = isSelected ? 'rgba(255,255,255,0.55)' : colors.border;

            const bboxX = isDragging ? draggedRoom!.x : bbox.minCol * CELL_PCT;
            const bboxY = isDragging ? draggedRoom!.y : bbox.minRow * CELL_PCT;
            const bboxW = (bbox.maxCol - bbox.minCol + 1) * CELL_PCT;
            const bboxH = (bbox.maxRow - bbox.minRow + 1) * CELL_PCT;

            return (
              <div
                key={room.name}
                className={`absolute select-none ${editable && !shapeEditMode ? 'cursor-move' : ''}`}
                style={{ left: `${bboxX}%`, top: `${bboxY}%`, width: `${bboxW}%`, height: `${bboxH}%` }}
                onMouseDown={editable && !shapeEditMode ? (e) => handleRoomDragStart(e, room, 'move') : undefined}
              >
                {/* Tile cells */}
                {room.tiles.map(({ row, col }) => {
                  const relCol = col - bbox.minCol;
                  const relRow = row - bbox.minRow;
                  const hasT = !tileSet.has(`${row - 1},${col}`);
                  const hasB = !tileSet.has(`${row + 1},${col}`);
                  const hasL = !tileSet.has(`${row},${col - 1}`);
                  const hasR = !tileSet.has(`${row},${col + 1}`);
                  return (
                    <div
                      key={`${row},${col}`}
                      style={{
                        position: 'absolute',
                        left: `${(relCol / numCols) * 100}%`,
                        top: `${(relRow / numRows) * 100}%`,
                        width: `${(1 / numCols) * 100}%`,
                        height: `${(1 / numRows) * 100}%`,
                        backgroundColor: colors.bg,
                        borderTop:    hasT ? `1.5px solid ${borderColor}` : 'none',
                        borderBottom: hasB ? `1.5px solid ${borderColor}` : 'none',
                        borderLeft:   hasL ? `1.5px solid ${borderColor}` : 'none',
                        borderRight:  hasR ? `1.5px solid ${borderColor}` : 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  );
                })}

                {/* Room label */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 z-10"
                  style={{ background: colors.bg }}>
                  <span className="text-xs font-bold tracking-wide truncate" style={{ color: colors.name }}>{room.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                    <span className="text-[10px] text-white/25 font-medium">{count}스텝</span>
                    {editable && !shapeEditMode && (
                      <button
                        title="모양 편집"
                        onClick={(e) => { e.stopPropagation(); enterShapeEdit(room.name); }}
                        className="w-4 h-4 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/[0.12] transition-all"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Resize handle */}
                {editable && !shapeEditMode && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-20"
                    style={{ background: colors.border, borderRadius: '0 0 4px 0' }}
                    onMouseDown={(e) => { e.stopPropagation(); handleRoomDragStart(e, room, 'resize'); }}
                  />
                )}
              </div>
            );
          }

          // ── Rectangle mode room ─────────────────────────────────────────
          const dx = isDragging ? draggedRoom!.x : room.x;
          const dy = isDragging ? draggedRoom!.y : room.y;
          const dw = isDragging ? draggedRoom!.width : room.width;
          const dh = isDragging ? draggedRoom!.height : room.height;

          return (
            <div
              key={room.name}
              className={`absolute rounded-lg select-none ${editable && !shapeEditMode ? 'cursor-move' : ''}`}
              style={{
                left: `${dx}%`, top: `${dy}%`, width: `${dw}%`, height: `${dh}%`,
                border: `1.5px solid ${isSelected ? 'rgba(255,255,255,0.55)' : colors.border}`,
                backgroundColor: colors.bg,
              }}
              onMouseDown={editable && !shapeEditMode ? (e) => handleRoomDragStart(e, room, 'move') : undefined}
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 select-none">
                <span className="text-xs font-bold tracking-wide pointer-events-none" style={{ color: colors.name }}>{room.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/25 font-medium pointer-events-none">{count}스텝</span>
                  {editable && !shapeEditMode && (
                    <button
                      title="모양 편집"
                      onClick={(e) => { e.stopPropagation(); enterShapeEdit(room.name); }}
                      className="w-4 h-4 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/[0.12] transition-all"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {editable && !shapeEditMode && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
                  style={{ background: colors.border, borderRadius: '0 0 4px 0' }}
                  onMouseDown={(e) => { e.stopPropagation(); handleRoomDragStart(e, room, 'resize'); }}
                />
              )}
            </div>
          );
        })}

        {/* Step Pins */}
        {steps.map((step) => (
          <StepPin
            key={step.id}
            step={step}
            isSelected={step.id === selectedStepId}
            onClick={onSelectStep}
            draggable={editable && !shapeEditMode}
            onDragStart={editable && !shapeEditMode ? handleDragStart : undefined}
            detail={detailByStepId.get(step.id)}
          />
        ))}

        {/* Shape edit hover cell */}
        {shapeEditMode && hoverCell && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${hoverCell.col * CELL_PCT}%`,
              top: `${hoverCell.row * CELL_PCT}%`,
              width: `${CELL_PCT}%`,
              height: `${CELL_PCT}%`,
              backgroundColor: shapeEditRoomName
                ? (paintAction === 'erase' ? 'rgba(255,80,80,0.18)' : 'rgba(255,255,255,0.10)')
                : 'rgba(255,255,255,0.07)',
              border: '1.5px dashed rgba(255,255,255,0.30)',
              boxSizing: 'border-box',
              zIndex: 50,
            }}
          />
        )}

        {/* Shape edit: hint when painting */}
        {shapeEditMode && shapeEditRoomName && (
          <div className="absolute top-2 right-2 pointer-events-none" style={{ zIndex: 60 }}>
            <span className="px-2 py-1 rounded bg-black/70 text-[9px] text-white/40 backdrop-blur-sm">
              클릭·드래그: 추가 / 칠해진 셀: 제거
            </span>
          </div>
        )}

        {!hasRooms && (
          <div className="absolute top-4 left-4 text-xs text-white/10 font-mono select-none">MAP VIEW</div>
        )}
        {steps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm pointer-events-none">Step이 없습니다</div>
        )}
      </div>
    </div>
  );
}
