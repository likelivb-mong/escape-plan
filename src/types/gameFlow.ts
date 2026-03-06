// ── Game Flow Design System Types ─────────────────────────────────────────────
// XCAPE Internal: Escape Room Game Design Tool

export type ProblemMode = 'clue' | 'device' | 'clue_device';

export type AnswerType =
  | 'key'
  | 'number_4'
  | 'number_3'
  | 'alphabet_5'
  | 'keypad'
  | 'xkit'
  | 'auto';

export type DeviceSubtype =
  | 'electronic_pen'
  | 'magnet'
  | 'tagging'
  | 'sensor'
  | 'light'
  | 'tv'
  | 'moving_room'
  | 'hidden_door'
  | 'auto_trigger'
  | 'keypad_device'
  | 'phone_device'
  | 'other';

export type StageLabel = '기' | '승' | '전' | '반전' | '결';

export type OutputType =
  | 'door_open'
  | 'hidden_compartment_open'
  | 'led_on'
  | 'tv_on'
  | 'xkit_guide_revealed'
  | 'item_acquired'
  | 'next_room_open'
  | 'ending_video'
  | 'escape_clear';

export interface GameFlowStep {
  id: string;
  stepNumber: number;
  room: string;
  stageLabel: StageLabel;
  clueTitle: string;
  problemMode: ProblemMode;
  answerType: AnswerType;
  deviceSubtype?: DeviceSubtype | null;
  inputLabel: string;
  answer: string;
  output: OutputType;
  clueTags: string[];
  deviceTags: string[];
  notes?: string;
  // xkit-specific fields
  xkitPrompt?: string;
  xkitAnswer?: string;
  xkitNextGuide?: string;
}

export interface GameFlowPlan {
  storyId: string;
  title: string;
  rooms: string[];
  steps: GameFlowStep[];
}
