import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData, FloorPlanRoomLayout, PassMapEntry } from '../types/floorPlan';
import { GRID_COLS, GRID_ROWS, CELL_PCT } from '../types/floorPlan';
import { ANSWER_TYPE_LABELS, DEVICE_SUBTYPE_LABELS } from './gameFlow';

// ── Tile utilities ────────────────────────────────────────────────────────────

export function tilesBBox(tiles: { row: number; col: number }[]): { x: number; y: number; width: number; height: number } {
  if (!tiles || tiles.length === 0) return { x: 0, y: 0, width: CELL_PCT, height: CELL_PCT };
  const rows = tiles.map(t => t.row);
  const cols = tiles.map(t => t.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  return {
    x: minCol * CELL_PCT,
    y: minRow * CELL_PCT,
    width: (maxCol - minCol + 1) * CELL_PCT,
    height: (maxRow - minRow + 1) * CELL_PCT,
  };
}

export function rectToTiles(x: number, y: number, width: number, height: number): { row: number; col: number }[] {
  const startCol = Math.max(0, Math.min(GRID_COLS - 1, Math.round(x / CELL_PCT)));
  const startRow = Math.max(0, Math.min(GRID_ROWS - 1, Math.round(y / CELL_PCT)));
  const numCols = Math.max(1, Math.round(width / CELL_PCT));
  const numRows = Math.max(1, Math.round(height / CELL_PCT));
  const tiles: { row: number; col: number }[] = [];
  for (let r = startRow; r < Math.min(GRID_ROWS, startRow + numRows); r++) {
    for (let c = startCol; c < Math.min(GRID_COLS, startCol + numCols); c++) {
      tiles.push({ row: r, col: c });
    }
  }
  return tiles;
}

export function syncRoomFromTiles(room: FloorPlanRoomLayout): FloorPlanRoomLayout {
  if (!room.tiles || room.tiles.length === 0) return room;
  const bbox = tilesBBox(room.tiles);
  return { ...room, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
}

// ── Auto-layout generator ────────────────────────────────────────────────────
// Generates tile-based rooms on a 20x20 grid. Each room gets a rectangular
// block of tiles. Rooms are placed in a grid pattern with gaps.

export function generateInitialLayout(rooms: string[]): FloorPlanData {
  if (rooms.length === 0) return { rooms: [] };

  const cols = Math.ceil(Math.sqrt(rooms.length));
  const rows = Math.ceil(rooms.length / cols);

  // Each room gets a portion of the 20x20 grid
  const gapCells = 1; // 1-cell gap between rooms
  const marginCells = 1; // 1-cell margin from edges
  const usableCols = GRID_COLS - marginCells * 2;
  const usableRows = GRID_ROWS - marginCells * 2;

  const cellW = Math.floor((usableCols - gapCells * (cols - 1)) / cols);
  const cellH = Math.floor((usableRows - gapCells * (rows - 1)) / rows);

  // Minimum 2x2 tiles per room
  const roomW = Math.max(2, Math.min(cellW, 8));
  const roomH = Math.max(2, Math.min(cellH, 6));

  const layoutRooms: FloorPlanRoomLayout[] = rooms.map((roomName, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const startCol = marginCells + col * (cellW + gapCells);
    const startRow = marginCells + row * (cellH + gapCells);

    // Generate tiles for this room (rectangular block)
    const tiles: { row: number; col: number }[] = [];
    for (let r = startRow; r < startRow + roomH; r++) {
      for (let c = startCol; c < startCol + roomW; c++) {
        if (r < GRID_ROWS && c < GRID_COLS) {
          tiles.push({ row: r, col: c });
        }
      }
    }

    const bbox = tilesBBox(tiles);
    return {
      roomName,
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      tiles,
    };
  });

  return { rooms: layoutRooms };
}

// ── Room reconciliation ──────────────────────────────────────────────────────

export function reconcileRooms(
  floorPlan: FloorPlanData,
  currentRooms: string[],
): FloorPlanData {
  const existing = new Map(floorPlan.rooms.map(r => [r.roomName, r]));
  const newRoomNames = currentRooms.filter(r => !existing.has(r));
  const kept = floorPlan.rooms.filter(r => currentRooms.includes(r.roomName));

  if (newRoomNames.length === 0 && kept.length === floorPlan.rooms.length) {
    return floorPlan;
  }

  // Find occupied cells
  const occupied = new Set<string>();
  for (const room of kept) {
    if (room.tiles) {
      room.tiles.forEach(t => occupied.add(`${t.row},${t.col}`));
    }
  }

  // Place new rooms in first available spot
  const newLayouts: FloorPlanRoomLayout[] = newRoomNames.map((name) => {
    const tiles = findFreeBlock(occupied, 4, 3);
    tiles.forEach(t => occupied.add(`${t.row},${t.col}`));
    const bbox = tilesBBox(tiles);
    return {
      roomName: name,
      x: bbox.x, y: bbox.y,
      width: bbox.width, height: bbox.height,
      tiles,
    };
  });

  return { rooms: [...kept, ...newLayouts] };
}

/** Find a free rectangular block of tiles on the grid */
function findFreeBlock(
  occupied: Set<string>,
  wantCols: number,
  wantRows: number,
): { row: number; col: number }[] {
  for (let r = 0; r <= GRID_ROWS - wantRows; r++) {
    for (let c = 0; c <= GRID_COLS - wantCols; c++) {
      let free = true;
      for (let dr = 0; dr < wantRows && free; dr++) {
        for (let dc = 0; dc < wantCols && free; dc++) {
          if (occupied.has(`${r + dr},${c + dc}`)) free = false;
        }
      }
      if (free) {
        const tiles: { row: number; col: number }[] = [];
        for (let dr = 0; dr < wantRows; dr++)
          for (let dc = 0; dc < wantCols; dc++)
            tiles.push({ row: r + dr, col: c + dc });
        return tiles;
      }
    }
  }
  // Fallback: just place at bottom-right corner
  const tiles: { row: number; col: number }[] = [];
  for (let dr = 0; dr < wantRows; dr++)
    for (let dc = 0; dc < wantCols; dc++)
      tiles.push({ row: GRID_ROWS - wantRows + dr, col: GRID_COLS - wantCols + dc });
  return tiles;
}

// ── PassMap computation ──────────────────────────────────────────────────────

export function computePassMapEntries(plan: GameFlowPlan): PassMapEntry[] {
  return plan.steps
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map(step => ({
      room: step.room,
      stepNumber: step.stepNumber,
      clueTitle: step.clueTitle,
      answerType: step.answerType,
      answerTypeLabel: ANSWER_TYPE_LABELS[step.answerType] ?? step.answerType,
      answer: step.answer,
      inputLabel: step.inputLabel,
      deviceSubtype: step.deviceSubtype
        ? (DEVICE_SUBTYPE_LABELS[step.deviceSubtype] ?? step.deviceSubtype)
        : null,
    }));
}

export function groupEntriesByRoom(
  entries: PassMapEntry[],
  rooms: string[],
): { room: string; entries: PassMapEntry[] }[] {
  const groups: { room: string; entries: PassMapEntry[] }[] = [];

  for (const room of rooms) {
    const roomEntries = entries.filter(e => e.room === room);
    if (roomEntries.length > 0) {
      groups.push({ room, entries: roomEntries });
    }
  }

  return groups;
}

// ── Room validation ──────────────────────────────────────────────────────

/**
 * Validate a single room's bounds. Ensures tiles fit within grid,
 * and rect values stay within [0, 100]. Used by FloorPlanCanvas/Room.
 */
export function validateRoomBounds(room: FloorPlanRoomLayout): FloorPlanRoomLayout {
  if (room.tiles && room.tiles.length > 0) {
    const clampedTiles = room.tiles.map(t => ({
      row: Math.max(0, Math.min(GRID_ROWS - 1, t.row)),
      col: Math.max(0, Math.min(GRID_COLS - 1, t.col)),
    }));
    const bbox = tilesBBox(clampedTiles);
    return { ...room, tiles: clampedTiles, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  }
  const MIN_SIZE = 5;
  let width = Math.max(MIN_SIZE, Math.min(room.width, 100));
  let height = Math.max(MIN_SIZE, Math.min(room.height, 100));
  let x = Math.max(0, Math.min(room.x, 100 - width));
  let y = Math.max(0, Math.min(room.y, 100 - height));
  return { ...room, x, y, width, height };
}

// ── Normalize (simple) ──────────────────────────────────────────────

/**
 * Ensure all room tiles stay within grid bounds.
 * No overlap resolution — rooms are tile-based and the grid IS the constraint.
 */
export function normalizeFloorPlan(data: FloorPlanData): FloorPlanData {
  const normalizedRooms = data.rooms.map(room => {
    // If room has tiles, just clamp them to grid bounds and recompute bbox
    if (room.tiles && room.tiles.length > 0) {
      const clampedTiles = room.tiles
        .map(t => ({
          row: Math.max(0, Math.min(GRID_ROWS - 1, t.row)),
          col: Math.max(0, Math.min(GRID_COLS - 1, t.col)),
        }))
        // Remove duplicate tiles after clamping
        .filter((t, i, arr) => arr.findIndex(o => o.row === t.row && o.col === t.col) === i);

      const bbox = tilesBBox(clampedTiles);
      return { ...room, tiles: clampedTiles, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
    }

    // Legacy rect room → convert to tiles
    const tiles = rectToTiles(room.x, room.y, room.width, room.height);
    const bbox = tilesBBox(tiles);
    return { ...room, tiles, x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  });

  return { ...data, rooms: normalizedRooms };
}

/**
 * Clamp step position to stay within a room's tile bounds
 */
export function clampStepToRoom(
  stepX: number,
  stepY: number,
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
): { x: number; y: number } {
  const pad = 2;
  return {
    x: Math.max(roomX + pad, Math.min(stepX, roomX + roomWidth - pad)),
    y: Math.max(roomY + pad, Math.min(stepY, roomY + roomHeight - pad)),
  };
}
