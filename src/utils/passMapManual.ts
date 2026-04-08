import type { FloorPlanData, FloorPlanRoomLayout } from '../types/floorPlan';
import type { GameFlowPlan, GameFlowStep } from '../types/gameFlow';
import type { PassMapManualCategory, PassMapManualItem } from '../types/manual';
import { OUTPUT_LABELS } from './gameFlow';

function getRoomCenter(room: FloorPlanRoomLayout): { x: number; y: number } {
  return {
    x: room.x + room.width / 2,
    y: room.y + room.height / 2,
  };
}

function deriveCategory(step: GameFlowStep): PassMapManualCategory {
  if (step.answerType === 'key') return 'key';
  if (step.answerType === 'xkit' || step.xkitPrompt) return 'xkit';
  if (step.deviceSubtype || step.problemMode !== 'clue') return 'device';
  return 'output';
}

function getFallbackStepPosition(
  step: GameFlowStep,
  room: FloorPlanRoomLayout | undefined,
  indexInRoom: number,
): { x: number; y: number } {
  if (!room) {
    return { x: 10 + (indexInRoom % 5) * 12, y: 12 + Math.floor(indexInRoom / 5) * 10 };
  }

  const cols = Math.max(1, Math.min(3, Math.ceil((indexInRoom + 1) / 2)));
  const col = indexInRoom % cols;
  const row = Math.floor(indexInRoom / cols);
  const gapX = room.width / (cols + 1);
  const gapY = room.height / (Math.max(1, row + 2));

  return {
    x: room.x + gapX * (col + 1),
    y: room.y + gapY * (row + 1),
  };
}

export function buildPassMapManual(
  plan: GameFlowPlan,
  floorPlan: FloorPlanData,
  overrides: Record<string, Partial<PassMapManualItem>> = {},
): PassMapManualItem[] {
  const roomMap = new Map(floorPlan.rooms.map((room) => [room.roomName, room]));
  const roomIndices = new Map<string, number>();

  return plan.steps
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((step) => {
      const room = roomMap.get(step.room);
      const indexInRoom = roomIndices.get(step.room) ?? 0;
      roomIndices.set(step.room, indexInRoom + 1);

      const positioned = floorPlan.stepPositions?.[step.id]
        ?? getFallbackStepPosition(step, room, indexInRoom);

      const base: PassMapManualItem = {
        id: `passmap-manual-${step.id}`,
        stepId: step.id,
        stepNumber: step.stepNumber,
        room: step.room,
        x: positioned.x,
        y: positioned.y,
        label: step.clueTitle,
        category: deriveCategory(step),
        output: OUTPUT_LABELS[step.output] ?? step.output,
        note: step.notes?.trim() ?? '',
      };

      return {
        ...base,
        ...(overrides[step.id] ?? {}),
      };
    });
}

export function updatePassMapManualOverride(
  stepId: string,
  patch: Partial<PassMapManualItem>,
  current: Record<string, Partial<PassMapManualItem>>,
): Record<string, Partial<PassMapManualItem>> {
  return {
    ...current,
    [stepId]: {
      ...(current[stepId] ?? {}),
      ...patch,
    },
  };
}
