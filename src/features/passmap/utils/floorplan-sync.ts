/**
 * FloorPlan → PassMap Sync
 *
 * Converts GameFlowPlan + FloorPlanData into PassMap ThemeStep[] + StepDetail[]
 * and writes directly to passmap-store (localStorage).
 * Preserves room layouts so PassMap MAP view shows rooms with steps inside.
 */

import type { GameFlowPlan, GameFlowStep } from '../../../types/gameFlow';
import { OUTPUT_LABELS } from '../../../utils/gameFlow';
import type { FloorPlanData, FloorPlanRoomLayout } from '../../../types/floorPlan';
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

// ── Position: place steps within their room (percentage-based) ─────────────

/**
 * Compute step position as percentage within the overall canvas.
 * Steps are placed inside their room bounds with grid-like distribution.
 */
function computeStepPosition(
  step: GameFlowStep,
  floorPlan: FloorPlanData,
  room: FloorPlanRoomLayout | undefined,
  indexInRoom: number,
  totalInRoom: number,
): { x: number; y: number } {
  if (!room) {
    // Fallback: grid layout using percentages
    return {
      x: 10 + ((step.stepNumber - 1) % 5) * 18,
      y: 10 + Math.floor((step.stepNumber - 1) / 5) * 20,
    };
  }

  // Check for custom position in floorPlan.stepPositions
  const customPos = floorPlan.stepPositions?.[step.id];
  if (customPos) {
    return {
      x: room.x + (customPos.x / 100) * room.width,
      y: room.y + (customPos.y / 100) * room.height,
    };
  }

  // Auto-distribute within room: leave padding for header
  const padTop = 35; // percent of room height reserved for header
  const padX = 12;   // percent padding left/right
  const padY = 10;   // percent padding bottom

  const usableW = room.width - (padX * 2 * room.width / 100);
  const usableH = room.height * (100 - padTop - padY) / 100;
  const startX = room.x + room.width * padX / 100;
  const startY = room.y + room.height * padTop / 100;

  // Single column layout within room (like the FloorPlan screenshot)
  const rowHeight = totalInRoom > 1 ? usableH / totalInRoom : 0;
  const x = startX + usableW * 0.5;
  const y = startY + rowHeight * indexInRoom + rowHeight * 0.5;

  return {
    x: Math.max(room.x + 2, Math.min(room.x + room.width - 2, x)),
    y: Math.max(room.y + 2, Math.min(room.y + room.height - 2, y)),
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

    const pos = computeStepPosition(gameStep, floorPlan, room, idxInRoom, totalInRoom);

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
