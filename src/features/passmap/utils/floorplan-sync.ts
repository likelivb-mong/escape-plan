/**
 * FloorPlan → PassMap Sync
 *
 * Converts GameFlowPlan + FloorPlanData into PassMap ThemeStep[] + StepDetail[]
 * and writes directly to passmap-store (localStorage).
 */

import type { GameFlowPlan, GameFlowStep } from '../../../types/gameFlow';
import type { FloorPlanData, FloorPlanRoomLayout } from '../../../types/floorPlan';
import type { ThemeStep, StepType, StepDetail, Theme } from '../types/passmap';
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

// ── Position conversion ────────────────────────────────────────────────────

const MAP_WIDTH = 800;
const MAP_HEIGHT = 550;

/**
 * Convert a step's percentage-based position (within its room) to
 * absolute pixel coordinates on the PassMap MAP canvas.
 */
function toAbsolutePosition(
  step: GameFlowStep,
  floorPlan: FloorPlanData,
  room: FloorPlanRoomLayout | undefined,
): { x: number; y: number } {
  if (!room) {
    // Fallback: grid layout
    return {
      x: 100 + ((step.stepNumber - 1) % 6) * 110,
      y: 80 + Math.floor((step.stepNumber - 1) / 6) * 110,
    };
  }

  // Check if there's a custom position stored in floorPlan.stepPositions
  const customPos = floorPlan.stepPositions?.[step.id];
  if (customPos) {
    // customPos is percentage within room → convert to absolute
    const absX = ((room.x + (customPos.x / 100) * room.width) / 100) * MAP_WIDTH;
    const absY = ((room.y + (customPos.y / 100) * room.height) / 100) * MAP_HEIGHT;
    return { x: Math.round(absX), y: Math.round(absY) };
  }

  // Default: center of the room with slight offset per step
  const stepsInRoom = floorPlan.rooms
    ? undefined // we'll handle offset below
    : undefined;
  const roomCenterX = room.x + room.width / 2;
  const roomCenterY = room.y + room.height / 2;

  // Slight offset based on step number to avoid overlap
  const offsetX = ((step.stepNumber % 3) - 1) * (room.width * 0.2);
  const offsetY = (Math.floor(step.stepNumber / 3) % 3 - 1) * (room.height * 0.15);

  const absX = ((roomCenterX + offsetX) / 100) * MAP_WIDTH;
  const absY = ((roomCenterY + offsetY) / 100) * MAP_HEIGHT;

  return {
    x: Math.round(Math.max(20, Math.min(MAP_WIDTH - 20, absX))),
    y: Math.round(Math.max(20, Math.min(MAP_HEIGHT - 20, absY))),
  };
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

  // Determine theme ID and name
  let themeId: string;
  let themeName: string;
  let action: 'created' | 'updated';

  if (overwriteThemeId) {
    // Overwrite existing theme
    themeId = overwriteThemeId;
    themeName = plan.title;
    action = 'updated';

    // Clear old steps & details
    const oldStepIds = getStepsByTheme(themeId).map((s) => s.id);
    removeDetailsByStepIds(oldStepIds);
    removeStepsByTheme(themeId);
    updateTheme(themeId, { name: themeName });
  } else {
    // Create new theme
    themeId = `sync-${branchCode.toLowerCase()}-${Date.now()}`;
    themeName = generateUniqueThemeName(branchCode, plan.title);
    action = 'created';

    const newTheme: Theme = {
      id: themeId,
      branchCode,
      name: themeName,
      mapImage: '',
    };
    addTheme(newTheme);
  }

  // Convert steps
  const steps: ThemeStep[] = plan.steps
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((gameStep) => {
      const room = roomMap.get(gameStep.room);
      const pos = toAbsolutePosition(gameStep, floorPlan, room);

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
  const details: StepDetail[] = plan.steps
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((gameStep, i) => ({
      stepId: steps[i].id,
      answer: gameStep.answer,
      input: gameStep.inputLabel,
      output: gameStep.output,
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
