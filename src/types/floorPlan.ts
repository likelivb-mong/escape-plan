import type { AnswerType } from './gameFlow';

export interface FloorPlanRoomLayout {
  roomName: string;   // must match a room from GameFlowPlan.rooms
  x: number;          // 0-100 (percentage position within canvas)
  y: number;
  width: number;      // 10-60 (percentage size)
  height: number;
}

export type DoorType = 'swing' | 'double' | 'bifold' | 'sliding';

export interface DoorLayout {
  id: string;
  x: number;      // 0-100 (% position)
  y: number;
  width: number;  // 5-60 (% width)
  height: number; // 5-60 (% height)
  rotation: number; // 0 | 90 | 180 | 270
  type: DoorType;
}

export interface FloorPlanData {
  rooms: FloorPlanRoomLayout[];
  doors: DoorLayout[];
  stepPositions: Record<string, { x: number; y: number }>; // stepId → % within room
}

export interface PassMapEntry {
  room: string;
  stepNumber: number;
  clueTitle: string;
  answerType: AnswerType;
  answerTypeLabel: string;
  answer: string;
  inputLabel: string;
  deviceSubtype?: string | null;
}
