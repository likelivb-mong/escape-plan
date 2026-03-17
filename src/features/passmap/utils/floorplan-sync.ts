/**
 * FloorPlan → PassMap Sync
 *
 * Converts GameFlowPlan + FloorPlanData into PassMap ThemeStep[] + StepDetail[]
 * and writes directly to passmap-store (localStorage).
 *
 * RULES:
 * 1. Rooms are always tile-based (FloorPlanRoomLayout.tiles[])
 * 2. Steps are placed INSIDE their room's tile bounds
 * 3. PassMap Theme is the single source of truth after sync
 */

import type { GameFlowPlan, GameFlowStep } from '../../../types/gameFlow';
import { OUTPUT_LABELS } from '../../../utils/gameFlow';
import type { FloorPlanData, FloorPlanRoomLayout } from '../../../types/floorPlan';
import { CELL_PCT } from '../../../types/floorPlan';
import { tilesBBox } from '../../../utils/floorPlan';
import type { ThemeStep, StepType, StepDetail, Theme, ThemeRoom } from '../types/passmap';
import {
  getThemesByBranch,
  addTheme,
  updateTheme,
  saveStepsForTheme,
  saveDetailsForTheme,
  removeStepsByTheme,
  removeDetailsByStepIds,
  getStepsByTheme,
  generateUniqueThemeName,
} from './passmap-store';

// ── Step type mapping ──────────────────────────────────────────────────────

function mapToStepType(step: GameFlowStep): StepType {
  if (step.problemMode === 'device') return 'device';
  if (
    step.answerType === 'key' ||
    step.answerType === 'number_3' ||
    step.answerType === 'number_4'
  )
    return 'lock';
  return 'puzzle';
}

// ── Position: place steps within their room bounds ─────────────────────────

function computeStepPosition(
  room: FloorPlanRoomLayout | undefined,
  indexInRoom: number,
  totalInRoom: number,
  stepNumber: number,
): { x: number; y: number } {
  if (!room) {
    // Fallback: grid layout
    return {
      x: 10 + ((stepNumber - 1) % 5) * 18,
      y: 10 + Math.floor((stepNumber - 1) / 5) * 20,
    };
  }

  // Get room bounds from tiles
  const bbox = room.tiles && room.tiles.length > 0
    ? tilesBBox(room.tiles)
    : { x: room.x, y: room.y, width: room.width, height: room.height };

  // Place steps in a column within the room, with padding for header
  const padTop = 30; // % of room height for header
  const padX = 15;   // % padding left/right
  const padBottom = 10;

  const startX = bbox.x + bbox.width * padX / 100;
  const usableW = bbox.width * (100 - padX * 2) / 100;
  const startY = bbox.y + bbox.height * padTop / 100;
  const usableH = bbox.height * (100 - padTop - padBottom) / 100;

  const rowHeight = totalInRoom > 1 ? usableH / totalInRoom : 0;
  const x = startX + usableW * 0.5;
  const y = startY + rowHeight * indexInRoom + rowHeight * 0.5;

  // Clamp within room bounds
  return {
    x: Math.max(bbox.x + 1, Math.min(bbox.x + bbox.width - 1, x)),
    y: Math.max(bbox.y + 1, Math.min(bbox.y + bbox.height - 1, y)),
  };
}

// ── Build room data for theme ──────────────────────────────────────────────

function buildThemeRooms(
  floorPlan: FloorPlanData,
  plan: GameFlowPlan,
): ThemeRoom[] {
  const stepCountByRoom = new Map<string, number>();
  for (const step of plan.steps) {
    stepCountByRoom.set(step.room, (stepCountByRoom.get(step.room) || 0) + 1);
  }

  return floorPlan.rooms.map((r) => ({
    name: r.roomName,
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    stepCount: stepCountByRoom.get(r.roomName) || 0,
    tiles: r.tiles, // Always pass tiles through
  }));
}

// ── Main sync function ─────────────────────────────────────────────────────

export interface SyncResult {
  themeId: string;
  themeName: string;
  stepCount: number;
  action: 'created' | 'updated';
}

export function syncFloorPlanToPassMap(
  plan: GameFlowPlan,
  floorPlan: FloorPlanData,
  branchCode: string,
  overwriteThemeId?: string,
): SyncResult {
  const roomMap = new Map(floorPlan.rooms.map((r) => [r.roomName, r]));
  const themeRooms = buildThemeRooms(floorPlan, plan);

  // Count steps per room for positioning
  const roomStepIndex = new Map<string, number>();
  const roomStepCounts = new Map<string, number>();
  for (const step of plan.steps) {
    roomStepCounts.set(step.room, (roomStepCounts.get(step.room) || 0) + 1);
  }

  // Determine theme ID and name
  let themeId: string;
  let themeName: string;
  let action: 'created' | 'updated';

  if (overwriteThemeId) {
    themeId = overwriteThemeId;
    themeName = plan.title;
    action = 'updated';

    const oldStepIds = getStepsByTheme(themeId).map((s) => s.id);
    removeDetailsByStepIds(oldStepIds);
    removeStepsByTheme(themeId);
    updateTheme(themeId, { name: themeName, rooms: themeRooms });
  } else {
    themeId = `sync-${branchCode.toLowerCase()}-${Date.now()}`;
    themeName = generateUniqueThemeName(branchCode, plan.title);
    action = 'created';

    const newTheme: Theme = {
      id: themeId,
      branchCode,
      name: themeName,
      mapImage: '',
      rooms: themeRooms,
    };
    addTheme(newTheme);
  }

  // Convert steps (sorted by stepNumber)
  const sortedSteps = plan.steps.slice().sort((a, b) => a.stepNumber - b.stepNumber);

  const steps: ThemeStep[] = sortedSteps.map((gameStep) => {
    const room = roomMap.get(gameStep.room);
    const idxInRoom = roomStepIndex.get(gameStep.room) || 0;
    roomStepIndex.set(gameStep.room, idxInRoom + 1);
    const totalInRoom = roomStepCounts.get(gameStep.room) || 1;

    const pos = computeStepPosition(room, idxInRoom, totalInRoom, gameStep.stepNumber);

    return {
      id: `sync-${themeId}-${gameStep.stepNumber}-${Date.now()}`,
      themeId,
      stepNumber: gameStep.stepNumber,
      type: mapToStepType(gameStep),
      label: gameStep.clueTitle,
      zone: gameStep.room,
      x: pos.x,
      y: pos.y,
      status: 'unchecked' as const,
    };
  });

  // Convert details
  const details: StepDetail[] = sortedSteps.map((gameStep, i) => ({
    stepId: steps[i].id,
    answer: gameStep.answer,
    input: gameStep.inputLabel,
    output: OUTPUT_LABELS[gameStep.output] ?? gameStep.output,
    resetMethod: '',
    memo: gameStep.notes || '',
  }));

  saveStepsForTheme(themeId, steps);
  saveDetailsForTheme(themeId, details);

  return { themeId, themeName, stepCount: steps.length, action };
}

/**
 * Find existing PassMap themes for a branch that match the current project name.
 */
export function findMatchingTheme(
  branchCode: string,
  themeName: string,
): { id: string; name: string } | undefined {
  const themes = getThemesByBranch(branchCode);
  const match = themes.find((t) => t.name === themeName);
  return match ? { id: match.id, name: match.name } : undefined;
}
