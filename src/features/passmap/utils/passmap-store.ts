/**
 * PassMap Store
 *
 * localStorage-backed data store for PassMap Manager.
 * Initializes from mock data on first load, then persists all changes.
 */

import type { Theme, ThemeStep, StepDetail } from '../types/passmap';
import { MOCK_THEMES } from '../mock/themes';
import { MOCK_STEPS, MOCK_STEP_DETAILS } from '../mock/steps';

// ── Storage keys ────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  themes: 'passmap-themes',
  steps: 'passmap-steps',
  details: 'passmap-details',
  initialized: 'passmap-initialized',
} as const;

// ── Initialize from mock if first load ──────────────────────────────────────

function ensureInitialized(): void {
  if (localStorage.getItem(STORAGE_KEYS.initialized)) return;
  localStorage.setItem(STORAGE_KEYS.themes, JSON.stringify(MOCK_THEMES));
  localStorage.setItem(STORAGE_KEYS.steps, JSON.stringify(MOCK_STEPS));
  localStorage.setItem(STORAGE_KEYS.details, JSON.stringify(MOCK_STEP_DETAILS));
  localStorage.setItem(STORAGE_KEYS.initialized, '1');
}

// ── Generic read/write ──────────────────────────────────────────────────────

function readList<T>(key: string): T[] {
  ensureInitialized();
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function writeList<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Themes ──────────────────────────────────────────────────────────────────

export function getAllThemes(): Theme[] {
  return readList<Theme>(STORAGE_KEYS.themes);
}

export function getThemesByBranch(branchCode: string): Theme[] {
  return getAllThemes().filter((t) => t.branchCode === branchCode);
}

export function getThemeById(themeId: string): Theme | undefined {
  return getAllThemes().find((t) => t.id === themeId);
}

export function addTheme(theme: Theme): void {
  const themes = getAllThemes();
  themes.push(theme);
  writeList(STORAGE_KEYS.themes, themes);
}

export function updateTheme(themeId: string, updates: Partial<Theme>): void {
  const themes = getAllThemes().map((t) =>
    t.id === themeId ? { ...t, ...updates } : t,
  );
  writeList(STORAGE_KEYS.themes, themes);
}

// ── Steps ───────────────────────────────────────────────────────────────────

export function getAllSteps(): ThemeStep[] {
  return readList<ThemeStep>(STORAGE_KEYS.steps);
}

export function getStepsByTheme(themeId: string): ThemeStep[] {
  return getAllSteps().filter((s) => s.themeId === themeId);
}

export function saveStepsForTheme(themeId: string, steps: ThemeStep[]): void {
  const all = getAllSteps().filter((s) => s.themeId !== themeId);
  all.push(...steps);
  writeList(STORAGE_KEYS.steps, all);
}

export function addSteps(steps: ThemeStep[]): void {
  const all = getAllSteps();
  all.push(...steps);
  writeList(STORAGE_KEYS.steps, all);
}

export function removeStepsByTheme(themeId: string): void {
  const filtered = getAllSteps().filter((s) => s.themeId !== themeId);
  writeList(STORAGE_KEYS.steps, filtered);
}

// ── Step Details ────────────────────────────────────────────────────────────

export function getAllDetails(): StepDetail[] {
  return readList<StepDetail>(STORAGE_KEYS.details);
}

export function getDetailByStepId(stepId: string): StepDetail | undefined {
  return getAllDetails().find((d) => d.stepId === stepId);
}

export function getDetailsByStepIds(stepIds: string[]): StepDetail[] {
  const idSet = new Set(stepIds);
  return getAllDetails().filter((d) => idSet.has(d.stepId));
}

export function saveDetailsForTheme(themeId: string, details: StepDetail[]): void {
  // Get step IDs for this theme to know which details to replace
  const themeStepIds = new Set(
    getStepsByTheme(themeId).map((s) => s.id),
  );
  // Also include IDs from the new details
  details.forEach((d) => themeStepIds.add(d.stepId));

  const all = getAllDetails().filter((d) => !themeStepIds.has(d.stepId));
  all.push(...details);
  writeList(STORAGE_KEYS.details, all);
}

export function addDetails(details: StepDetail[]): void {
  const all = getAllDetails();
  all.push(...details);
  writeList(STORAGE_KEYS.details, all);
}

export function removeDetailsByStepIds(stepIds: string[]): void {
  const idSet = new Set(stepIds);
  const filtered = getAllDetails().filter((d) => !idSet.has(d.stepId));
  writeList(STORAGE_KEYS.details, filtered);
}

// ── Duplicate theme naming ──────────────────────────────────────────────────

export function findDuplicateTheme(branchCode: string, themeName: string): Theme | undefined {
  return getAllThemes().find(
    (t) => t.branchCode === branchCode && t.name === themeName,
  );
}

export function generateUniqueThemeName(branchCode: string, baseName: string): string {
  const themes = getThemesByBranch(branchCode);
  const existingNames = new Set(themes.map((t) => t.name));

  if (!existingNames.has(baseName)) return baseName;

  let counter = 2;
  while (existingNames.has(`${baseName} (${counter})`)) {
    counter++;
  }
  return `${baseName} (${counter})`;
}

// ── Import helper (all-in-one) ──────────────────────────────────────────────

export interface ImportResult {
  themeId: string;
  themeName: string;
  stepCount: number;
  action: 'created' | 'overwritten';
}

export function importThemeData(
  theme: Theme,
  steps: ThemeStep[],
  details: StepDetail[],
  overwrite: boolean,
): ImportResult {
  if (overwrite) {
    // Remove old steps/details for this theme
    const oldStepIds = getStepsByTheme(theme.id).map((s) => s.id);
    removeDetailsByStepIds(oldStepIds);
    removeStepsByTheme(theme.id);
    updateTheme(theme.id, { name: theme.name });
  } else {
    addTheme(theme);
  }

  addSteps(steps);
  addDetails(details);

  return {
    themeId: theme.id,
    themeName: theme.name,
    stepCount: steps.length,
    action: overwrite ? 'overwritten' : 'created',
  };
}
