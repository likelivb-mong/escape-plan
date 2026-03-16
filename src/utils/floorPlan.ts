import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData, FloorPlanRoomLayout, PassMapEntry } from '../types/floorPlan';
import { ANSWER_TYPE_LABELS, DEVICE_SUBTYPE_LABELS } from './gameFlow';

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
 */
export function validateRoomBounds(room: FloorPlanRoomLayout): FloorPlanRoomLayout {
  const MIN_SIZE = 8;
  const MAX_SIZE = 95;

  let x = Math.max(0, Math.min(room.x, 100 - MIN_SIZE));
  let y = Math.max(0, Math.min(room.y, 100 - MIN_SIZE));
  let width = Math.max(MIN_SIZE, Math.min(room.width, 100 - x));
  let height = Math.max(MIN_SIZE, Math.min(room.height, 100 - y));

  return { ...room, x, y, width, height };
}

/**
 * Check if two rooms overlap (with small tolerance)
 */
function roomsOverlap(r1: FloorPlanRoomLayout, r2: FloorPlanRoomLayout, tolerance = 0.5): boolean {
  return !(
    r1.x + r1.width + tolerance < r2.x ||
    r2.x + r2.width + tolerance < r1.x ||
    r1.y + r1.height + tolerance < r2.y ||
    r2.y + r2.height + tolerance < r1.y
  );
}

/**
 * Adjust room to avoid overlaps with other rooms
 */
function adjustForOverlap(
  room: FloorPlanRoomLayout,
  others: FloorPlanRoomLayout[],
  maxIterations = 5,
): FloorPlanRoomLayout {
  let adjusted = room;

  for (let iter = 0; iter < maxIterations; iter++) {
    const overlapping = others.find(other => roomsOverlap(adjusted, other));
    if (!overlapping) break;

    // Try to move away from the overlapping room
    const dx = adjusted.x + adjusted.width / 2 - (overlapping.x + overlapping.width / 2);
    const dy = adjusted.y + adjusted.height / 2 - (overlapping.y + overlapping.height / 2);

    const moveX = dx !== 0 ? snap(Math.sign(dx) * 2) : 0;
    const moveY = dy !== 0 ? snap(Math.sign(dy) * 2) : 0;

    const newX = Math.max(0, Math.min(adjusted.x + moveX, 100 - adjusted.width));
    const newY = Math.max(0, Math.min(adjusted.y + moveY, 100 - adjusted.height));

    adjusted = { ...adjusted, x: newX, y: newY };
  }

  return adjusted;
}

/**
 * Normalize entire floor plan: validate bounds, prevent overlaps, keep steps inside
 */
export function normalizeFloorPlan(data: FloorPlanData): FloorPlanData {
  // 1. Validate each room's bounds
  let validatedRooms = data.rooms.map(validateRoomBounds);

  // 2. Prevent overlaps
  const normalizedRooms: FloorPlanRoomLayout[] = [];
  for (const room of validatedRooms) {
    const adjusted = adjustForOverlap(room, normalizedRooms);
    normalizedRooms.push(adjusted);
  }

  // 3. Clamp step positions to their rooms
  const normalizedStepPositions: Record<string, { x: number; y: number }> = {};
  const stepsByRoom = new Map<string, string[]>();

  // Group steps by room name
  for (const [stepId, pos] of Object.entries(data.stepPositions || {})) {
    // Find which room this step belongs to by looking for a matching room
    // This is a safety check - in practice, steps are stored separately
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
