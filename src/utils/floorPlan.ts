import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData, FloorPlanRoomLayout, PassMapEntry } from '../types/floorPlan';
import { ANSWER_TYPE_LABELS, DEVICE_SUBTYPE_LABELS } from './gameFlow';

// ── Auto-layout generator ────────────────────────────────────────────────────

function snap(value: number, grid: number = 5): number {
  return Math.round(value / grid) * grid;
}

export function generateInitialLayout(rooms: string[]): FloorPlanData {
  if (rooms.length === 0) return { rooms: [] };

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
