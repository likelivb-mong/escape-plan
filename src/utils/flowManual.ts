import type { GameFlowPlan, GameFlowStep } from '../types/gameFlow';
import type { FlowManualRow } from '../types/manual';
import { OUTPUT_LABELS } from './gameFlow';

function buildInputLabel(step: GameFlowStep): string {
  const parts = [step.inputLabel, step.answer].map((part) => part?.trim()).filter(Boolean);
  return parts.join(' / ');
}

function buildStateChange(step: GameFlowStep): string {
  if (step.xkitNextGuide?.trim()) return step.xkitNextGuide.trim();
  if (step.content?.trim()) return step.content.trim();
  if (step.notes?.trim()) return step.notes.trim();
  return OUTPUT_LABELS[step.output] ?? step.output;
}

function buildReset(step: GameFlowStep): string {
  if (step.deviceSubtype) return `${step.deviceSubtype} 장치 초기화`;
  if (step.answerType === 'key') return '열쇠/오브제 원위치';
  if (step.answerType === 'xkit') return 'X-KIT 상태 초기화';
  return '기본 리셋';
}

export function buildFlowManual(
  plan: GameFlowPlan,
  overrides: Record<string, Partial<FlowManualRow>> = {},
): FlowManualRow[] {
  return plan.steps
    .slice()
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((step) => {
      const base: FlowManualRow = {
        id: `flow-manual-${step.id}`,
        stepId: step.id,
        stepNumber: step.stepNumber,
        stageLabel: step.stageLabel,
        room: step.room,
        clue: step.clueTitle,
        input: buildInputLabel(step),
        xkit: step.answerType === 'xkit' || !!step.xkitPrompt,
        key: step.answerType === 'key',
        device: !!step.deviceSubtype || step.problemMode !== 'clue',
        output: OUTPUT_LABELS[step.output] ?? step.output,
        stateChange: buildStateChange(step),
        hint: step.hint?.trim() ?? '',
        reset: buildReset(step),
      };

      return {
        ...base,
        ...(overrides[step.id] ?? {}),
      };
    });
}

export function updateFlowManualOverride(
  stepId: string,
  patch: Partial<FlowManualRow>,
  current: Record<string, Partial<FlowManualRow>>,
): Record<string, Partial<FlowManualRow>> {
  return {
    ...current,
    [stepId]: {
      ...(current[stepId] ?? {}),
      ...patch,
    },
  };
}
