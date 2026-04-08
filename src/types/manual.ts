import type { StageLabel } from './gameFlow';

export interface FlowManualRow {
  id: string;
  stepId: string;
  stepNumber: number;
  stageLabel: StageLabel;
  room: string;
  clue: string;
  input: string;
  xkit: boolean;
  key: boolean;
  device: boolean;
  output: string;
  stateChange: string;
  hint: string;
  reset: string;
}

export type PassMapManualCategory = 'key' | 'xkit' | 'device' | 'output';

export interface PassMapManualItem {
  id: string;
  stepId: string;
  stepNumber: number;
  room: string;
  x: number;
  y: number;
  label: string;
  category: PassMapManualCategory;
  output: string;
  note: string;
}

export interface ManualOverrides {
  flowManualByStepId: Record<string, Partial<FlowManualRow>>;
  passMapManualByStepId: Record<string, Partial<PassMapManualItem>>;
}
