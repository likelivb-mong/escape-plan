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
 * Adjust room to avoid overlaps with other rooms
 * Uses a smarter algorithm that finds the best direction to move
 */
function adjustForOverlap(
  room: FloorPlanRoomLayout,
  others: FloorPlanRoomLayout[],
): FloorPlanRoomLayout {
  let adjusted = room;
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const overlapping = others.find(other => roomsOverlap(adjusted, other));
    if (!overlapping) break;

    // Find center-to-center vector
    const centerX = adjusted.x + adjusted.width / 2;
    const centerY = adjusted.y + adjusted.height / 2;
    const otherCenterX = overlapping.x + overlapping.width / 2;
    const otherCenterY = overlapping.y + overlapping.height / 2;

    const dx = centerX - otherCenterX;
    const dy = centerY - otherCenterY;

    // Determine primary push direction
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let moveX = 0;
    let moveY = 0;

    if (absDx > absDy) {
      // Push horizontally more
      moveX = dx > 0 ? 3 : -3;
      moveY = dy > 0 ? 1 : -1;
    } else {
      // Push vertically more
      moveX = dx > 0 ? 1 : -1;
      moveY = dy > 0 ? 3 : -3;
    }

    // Apply movement and validate
    const newX = Math.max(0, Math.min(adjusted.x + moveX, 100 - adjusted.width));
    const newY = Math.max(0, Math.min(adjusted.y + moveY, 100 - adjusted.height));

    // If we didn't actually move, try a different strategy
    if (newX === adjusted.x && newY === adjusted.y) {
      // Can't move further, try scaling down if possible
      if (adjusted.width > 10 && adjusted.height > 10) {
        adjusted = {
          ...adjusted,
          width: Math.max(8, adjusted.width - 2),
          height: Math.max(8, adjusted.height - 2),
        };
      } else {
        break; // Give up
      }
    } else {
      adjusted = { ...adjusted, x: newX, y: newY };
    }

    attempts++;
  }

  return adjusted;
}

/**
 * Normalize entire floor plan: validate bounds, prevent overlaps, keep steps inside
 */
export function normalizeFloorPlan(data: FloorPlanData): FloorPlanData {
  // 1. Validate each room's bounds STRICTLY
  let validatedRooms = data.rooms.map(validateRoomBounds);

  // 2. Prevent overlaps with better algorithm
  const normalizedRooms: FloorPlanRoomLayout[] = [];
  for (const room of validatedRooms) {
    // Re-validate after adjusting for overlaps
    const adjusted = adjustForOverlap(room, normalizedRooms);
    const final = validateRoomBounds(adjusted);
    normalizedRooms.push(final);
  }

  // 3. Clamp step positions to their rooms
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
