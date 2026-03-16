/**
 * PassMap Exchange Format
 *
 * Shared schema for exporting Escape Plan AI flow data
 * and importing it into PassMap Manager.
 */

import type { GameFlowPlan, GameFlowStep } from '../../../types/gameFlow';
import type { ThemeStep, StepType, StepDetail } from '../types/passmap';

// ── Exchange JSON schema ────────────────────────────────────────────────────

export interface PassMapExchangeStep {
  stepNumber: number;
  label: string;
  type: 'puzzle' | 'lock' | 'device';
  zone: string;
  answer: string;
  input: string;
  output: string;
  resetMethod: string;
}

export interface PassMapExchangeData {
  themeName: string;
  branchCode: string;
  steps: PassMapExchangeStep[];
}

// ── Export: GameFlowPlan → Exchange JSON ─────────────────────────────────────

function mapProblemModeToStepType(step: GameFlowStep): StepType {
  if (step.problemMode === 'device') return 'device';
  if (step.answerType === 'key' || step.answerType === 'number_3' || step.answerType === 'number_4') return 'lock';
  return 'puzzle';
}

export function gameFlowToExchange(
  plan: GameFlowPlan,
  branchCode: string,
): PassMapExchangeData {
  return {
    themeName: plan.title,
    branchCode,
    steps: plan.steps.map((s) => ({
      stepNumber: s.stepNumber,
      label: s.clueTitle,
      type: mapProblemModeToStepType(s),
      zone: s.room,
      answer: s.answer,
      input: s.inputLabel,
      output: s.output,
      resetMethod: '',
    })),
  };
}

// ── Download helper ─────────────────────────────────────────────────────────

export function downloadExchangeJson(data: PassMapExchangeData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeName = data.themeName.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  const filename = `${safeName}_flow.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Import: Exchange JSON → PassMap ThemeStep[] + StepDetail[] ───────────────

function distributeStepPositions(count: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const cols = Math.ceil(Math.sqrt(count));
  const spacing = 120;
  const offsetX = 100;
  const offsetY = 80;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      x: offsetX + col * spacing + (row % 2 === 1 ? spacing / 2 : 0),
      y: offsetY + row * spacing,
    });
  }
  return positions;
}

export function exchangeToPassMapSteps(
  data: PassMapExchangeData,
  themeId: string,
): { steps: ThemeStep[]; details: StepDetail[] } {
  const positions = distributeStepPositions(data.steps.length);

  const steps: ThemeStep[] = data.steps.map((s, i) => ({
    id: `imported-${themeId}-${s.stepNumber}-${Date.now()}-${i}`,
    themeId,
    stepNumber: s.stepNumber,
    type: s.type as StepType,
    label: s.label,
    zone: s.zone,
    x: positions[i].x,
    y: positions[i].y,
    status: 'unchecked' as const,
  }));

  const details: StepDetail[] = data.steps.map((s, i) => ({
    stepId: steps[i].id,
    answer: s.answer,
    input: s.input,
    output: s.output,
    resetMethod: s.resetMethod,
    memo: '',
  }));

  return { steps, details };
}

// ── Validation ──────────────────────────────────────────────────────────────

export function validateExchangeData(data: unknown): data is PassMapExchangeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.themeName !== 'string' || !d.themeName) return false;
  if (typeof d.branchCode !== 'string' || !d.branchCode) return false;
  if (!Array.isArray(d.steps)) return false;

  return d.steps.every((s: unknown) => {
    if (!s || typeof s !== 'object') return false;
    const step = s as Record<string, unknown>;
    return (
      typeof step.stepNumber === 'number' &&
      typeof step.label === 'string' &&
      typeof step.type === 'string' &&
      ['puzzle', 'lock', 'device'].includes(step.type as string)
    );
  });
}
