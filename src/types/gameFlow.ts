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
  // Puzzle detail fields
  description?: string;      // 퍼즐 상황 설명
  puzzleSetup?: string;      // 문제 설정 (플레이어가 마주하는 상황)
  puzzleSolution?: string;   // 풀이 방법 (정답에 도달하는 과정)
  hint?: string;             // 힌트
  content?: string;          // 추가 연출/내용
  // xkit-specific fields
  xkitPrompt?: string;
  xkitAnswer?: string;
  xkitNextGuide?: string;
}

export interface GameFlowPlan {
  id?: string;
  storyId?: string;
  title: string;
  description?: string;
  rooms: string[];
  steps: GameFlowStep[];
}
