// PassMap Manager Types

export interface Branch {
  code: string;
  name: string;
}

export interface ThemeRoom {
  name: string;
  x: number;       // 0-100 (percentage)
  y: number;
  width: number;    // percentage
  height: number;
  stepCount: number;
}

export interface Theme {
  id: string;
  branchCode: string;
  name: string;
  mapImage: string;
  rooms?: ThemeRoom[];
}

export type StepType = 'puzzle' | 'lock' | 'device';

export type StepStatus = 'unchecked' | 'complete' | 'warning' | 'issue';

export interface ThemeStep {
  id: string;
  themeId: string;
  stepNumber: number;
  type: StepType;
  label: string;
  zone: string;
  x: number;
  y: number;
  status: StepStatus;
}

export interface StepDetail {
  stepId: string;
  answer: string;
  input: string;
  output: string;
  resetMethod: string;
  memo: string;
}

// View mode for theme page
export type PassMapViewMode = 'map' | 'flow' | 'editor';

// Status color mapping
export const STATUS_COLORS: Record<StepStatus, string> = {
  unchecked: '#9CA3AF',  // gray
  complete: '#22C55E',   // green
  warning: '#F59E0B',    // orange
  issue: '#EF4444',      // red
};

// Step type icon mapping
export const STEP_TYPE_ICONS: Record<StepType, string> = {
  puzzle: '🧩',
  lock: '🔒',
  device: '⚙️',
};
