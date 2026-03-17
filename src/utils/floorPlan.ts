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

function snap(value: number, grid: number = 5): number {
  return Math.round(value / grid) * grid;
}

export function generateInitialLayout(rooms: string[]): FloorPlanData {
  if (rooms.length === 0) return { rooms: [], doors: [], stepPositions: {} };

  const cols = Math.ceil(Math.sqrt(rooms.length));
  const rows = Math.ceil(rooms.length / cols);

  const margin = 5;
  const gap = 3;
  const usableW = 100 - margin * 2;
  const usableH = 100 - margin * 2;

  const cellW = (usableW - gap * (cols - 1)) / cols;
  const cellH = (usableH - gap * (rows - 1)) / rows;

  const roomW = snap(Math.min(cellW, 40));
  const roomH = snap(Math.min(cellH, 35));

  const layoutRooms: FloorPlanRoomLayout[] = rooms.map((roomName, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    return {
      roomName,
      x: snap(margin + col * (cellW + gap)),
      y: snap(margin + row * (cellH + gap)),
      width: roomW,
      height: roomH,
    };
  });

  return { rooms: layoutRooms, doors: [], stepPositions: {} };
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

  // Place new rooms at bottom
  const maxY = kept.length > 0
    ? Math.max(...kept.map(r => r.y + r.height))
    : 5;

  const newLayouts: FloorPlanRoomLayout[] = newRoomNames.map((name, i) => ({
    roomName: name,
    x: snap(5 + i * 25),
    y: snap(Math.min(maxY + 5, 80)),
    width: 20,
    height: 20,
  }));

  return { rooms: [...kept, ...newLayouts], doors: floorPlan.doors ?? [], stepPositions: floorPlan.stepPositions ?? {} };
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

// ── Room validation & stabilization ──────────────────────────────────────

/**
 * Ensure room stays within canvas bounds and has minimum size
 * This is the STRICT validation - Room MUST fit inside [0, 100] x [0, 100]
 */
export function validateRoomBounds(room: FloorPlanRoomLayout): FloorPlanRoomLayout {
  const MIN_SIZE = 8;
  const MAX_SIZE = 100;

  // 1. Clamp width and height first (absolute constraints)
  let width = Math.max(MIN_SIZE, Math.min(room.width, MAX_SIZE));
  let height = Math.max(MIN_SIZE, Math.min(room.height, MAX_SIZE));

  // 2. Now clamp position so room + size doesn't exceed 100
  let x = Math.max(0, Math.min(room.x, MAX_SIZE - width));
  let y = Math.max(0, Math.min(room.y, MAX_SIZE - height));

  return { ...room, x, y, width, height };
}

/**
 * Check if two rooms overlap (no tolerance)
 */
function roomsOverlap(r1: FloorPlanRoomLayout, r2: FloorPlanRoomLayout): boolean {
  return !(
    r1.x + r1.width <= r2.x ||
    r2.x + r2.width <= r1.x ||
    r1.y + r1.height <= r2.y ||
    r2.y + r2.height <= r1.y
  );
}

/**
 * Resolve overlaps between all rooms using force-directed algorithm
 * Each overlapping pair pushes away from each other
 */
function resolveAllOverlaps(rooms: FloorPlanRoomLayout[]): FloorPlanRoomLayout[] {
  let adjusted = rooms.map(r => ({ ...r }));
  let iterationCount = 0;
  const maxIterations = 50;
  const minChange = 0.1; // Stop if changes are negligible

  while (iterationCount < maxIterations) {
    let totalChange = 0;
    const movements: { [key: string]: { dx: number; dy: number } } = {};

    // Initialize movements
    for (const room of adjusted) {
      movements[room.roomName] = { dx: 0, dy: 0 };
    }

    // Calculate repulsive forces between overlapping rooms
    for (let i = 0; i < adjusted.length; i++) {
      for (let j = i + 1; j < adjusted.length; j++) {
        const r1 = adjusted[i];
        const r2 = adjusted[j];

        if (roomsOverlap(r1, r2)) {
          // Calculate overlap amount
          const overlapX = Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x);
          const overlapY = Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y);

          // Calculate centers
          const c1x = r1.x + r1.width / 2;
          const c1y = r1.y + r1.height / 2;
          const c2x = r2.x + r2.width / 2;
          const c2y = r2.y + r2.height / 2;

          // Direction from r2 to r1
          let dx = c1x - c2x;
          let dy = c1y - c2y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Normalize and scale by overlap amount
          const pushForce = Math.max(overlapX, overlapY) / 10 + 1;
          dx = (dx / dist) * pushForce;
          dy = (dy / dist) * pushForce;

          // Apply forces (opposite directions)
          movements[r1.roomName].dx += dx;
          movements[r1.roomName].dy += dy;
          movements[r2.roomName].dx -= dx;
          movements[r2.roomName].dy -= dy;
        }
      }
    }

    // Apply movements to all rooms
    let changed = false;
    for (let i = 0; i < adjusted.length; i++) {
      const room = adjusted[i];
      const move = movements[room.roomName];

      if (Math.abs(move.dx) > minChange || Math.abs(move.dy) > minChange) {
        changed = true;
        totalChange += Math.abs(move.dx) + Math.abs(move.dy);

        // Apply movement with bounds checking
        const newX = Math.max(0, Math.min(room.x + move.dx, 100 - room.width));
        const newY = Math.max(0, Math.min(room.y + move.dy, 100 - room.height));

        adjusted[i] = { ...room, x: newX, y: newY };
      }
    }

    if (!changed || totalChange < minChange) break;
    iterationCount++;
  }

  return adjusted;
}

/**
 * Normalize entire floor plan: validate bounds, prevent overlaps, keep steps inside
 */
export function normalizeFloorPlan(data: FloorPlanData): FloorPlanData {
  // 1. Validate each room's bounds STRICTLY
  let validatedRooms = data.rooms.map(validateRoomBounds);

  // 2. Resolve ALL overlaps simultaneously using force-directed algorithm
  let normalizedRooms = resolveAllOverlaps(validatedRooms);

  // 3. Final validation pass to ensure bounds
  normalizedRooms = normalizedRooms.map(validateRoomBounds);

  // 4. One more overlap check - if still overlapping, scale down problematic rooms
  let stillOverlapping = true;
  let safetyIterations = 0;
  while (stillOverlapping && safetyIterations < 10) {
    stillOverlapping = false;
    for (let i = 0; i < normalizedRooms.length; i++) {
      for (let j = i + 1; j < normalizedRooms.length; j++) {
        if (roomsOverlap(normalizedRooms[i], normalizedRooms[j])) {
          stillOverlapping = true;
          // ⚠️ AGGRESSIVE: Push rooms apart more forcefully
          const r1 = normalizedRooms[i];
          const r2 = normalizedRooms[j];

          const c1x = r1.x + r1.width / 2;
          const c1y = r1.y + r1.height / 2;
          const c2x = r2.x + r2.width / 2;
          const c2y = r2.y + r2.height / 2;

          // Direction and distance
          let dx = c1x - c2x;
          let dy = c1y - c2y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Normalize
          dx = (dx / dist) * 5;
          dy = (dy / dist) * 5;

          // Push apart
          const newX1 = Math.max(0, Math.min(r1.x + dx, 100 - r1.width));
          const newY1 = Math.max(0, Math.min(r1.y + dy, 100 - r1.height));
          const newX2 = Math.max(0, Math.min(r2.x - dx, 100 - r2.width));
          const newY2 = Math.max(0, Math.min(r2.y - dy, 100 - r2.height));

          normalizedRooms[i] = { ...r1, x: newX1, y: newY1 };
          normalizedRooms[j] = { ...r2, x: newX2, y: newY2 };

          // If still overlapping after movement, scale down
          if (roomsOverlap(normalizedRooms[i], normalizedRooms[j])) {
            if (normalizedRooms[i].width > 8) {
              normalizedRooms[i] = {
                ...normalizedRooms[i],
                width: Math.max(8, normalizedRooms[i].width - 2),
              };
            }
            if (normalizedRooms[j].width > 8) {
              normalizedRooms[j] = {
                ...normalizedRooms[j],
                width: Math.max(8, normalizedRooms[j].width - 2),
              };
            }
          }
        }
      }
    }
    // Re-validate after adjustments
    normalizedRooms = normalizedRooms.map(validateRoomBounds);
    safetyIterations++;
  }

  // 5. Final desperation check: If still overlapping, use grid layout
  let hasOverlap = false;
  for (let i = 0; i < normalizedRooms.length && !hasOverlap; i++) {
    for (let j = i + 1; j < normalizedRooms.length; j++) {
      if (roomsOverlap(normalizedRooms[i], normalizedRooms[j])) {
        hasOverlap = true;
        break;
      }
    }
  }

  if (hasOverlap) {
    // Force grid layout as last resort
    console.warn('[normalizeFloorPlan] Overlaps persist after resolution, forcing grid layout');
    normalizedRooms = normalizedRooms.map((room, index) => {
      const cols = Math.ceil(Math.sqrt(normalizedRooms.length));
      const col = index % cols;
      const row = Math.floor(index / cols);

      const cellW = (100 - 10) / cols;
      const cellH = (100 - 10) / cols;
      const roomW = Math.min(cellW - 2, room.width);
      const roomH = Math.min(cellH - 2, room.height);

      return {
        ...room,
        x: 5 + col * cellW + (cellW - roomW) / 2,
        y: 5 + row * cellH + (cellH - roomH) / 2,
        width: roomW,
        height: roomH,
      };
    });
  }

  // 6. Step positions
  const normalizedStepPositions: Record<string, { x: number; y: number }> = {};
  for (const [stepId, pos] of Object.entries(data.stepPositions || {})) {
    normalizedStepPositions[stepId] = pos;
  }

  return {
    ...data,
    rooms: normalizedRooms,
    doors: data.doors ?? [],
    stepPositions: normalizedStepPositions,
  };
}

/**
 * Clamp step position to stay within a room
 */
export function clampStepToRoom(
  stepX: number,
  stepY: number,
  roomX: number,
  roomY: number,
  roomWidth: number,
  roomHeight: number,
): { x: number; y: number } {
  // Convert room percentages to actual positioning space
  const minX = roomX + 2;
  const maxX = roomX + roomWidth - 8;
  const minY = roomY + 18;
  const maxY = roomY + roomHeight - 5;

  return {
    x: Math.max(minX, Math.min(stepX, maxX)),
    y: Math.max(minY, Math.min(stepY, maxY)),
  };
}
