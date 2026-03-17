/**
 * PassMap Store
 *
 * localStorage-backed data store for PassMap Manager.
 * Initializes from mock data on first load, merges on version bump.
 * Emits change events so React components can re-render on data updates.
 */

import type { Theme, ThemeStep, StepDetail } from '../types/passmap';
import { MOCK_THEMES } from '../mock/themes';
import { MOCK_STEPS, MOCK_STEP_DETAILS } from '../mock/steps';

// ── Storage keys ────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  themes: 'passmap-themes',
  steps: 'passmap-steps',
  details: 'passmap-details',
  version: 'passmap-version',
} as const;

// Bump this when mock data changes to trigger merge of new mocks
const CURRENT_VERSION = '6';

// ── Change event system ─────────────────────────────────────────────────────
// Allows React components to subscribe to store changes

type StoreChangeListener = () => void;
const listeners = new Set<StoreChangeListener>();

export function subscribeToStoreChanges(listener: StoreChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((fn) => fn());
}

// ── Initialize: merge mock data with existing user data ─────────────────────

function ensureInitialized(): void {
  const stored = localStorage.getItem(STORAGE_KEYS.version);
  if (stored === CURRENT_VERSION) return;

  if (!stored) {
    // First ever load: seed everything from mock
    localStorage.setItem(STORAGE_KEYS.themes, JSON.stringify(MOCK_THEMES));
    localStorage.setItem(STORAGE_KEYS.steps, JSON.stringify(MOCK_STEPS));
    localStorage.setItem(STORAGE_KEYS.details, JSON.stringify(MOCK_STEP_DETAILS));
  } else {
    // Version bump: merge new mock data without overwriting user data
    const existingThemes = readListRaw<Theme>(STORAGE_KEYS.themes);
    const existingSteps = readListRaw<ThemeStep>(STORAGE_KEYS.steps);
    const existingDetails = readListRaw<StepDetail>(STORAGE_KEYS.details);

    const existingThemeIds = new Set(existingThemes.map((t) => t.id));
    const existingStepIds = new Set(existingSteps.map((s) => s.id));
    const existingDetailStepIds = new Set(existingDetails.map((d) => d.stepId));

    // Add only new mock entries that don't exist in user data
    const newThemes = MOCK_THEMES.filter((t) => !existingThemeIds.has(t.id));
    const newSteps = MOCK_STEPS.filter((s) => !existingStepIds.has(s.id));
    const newDetails = MOCK_STEP_DETAILS.filter((d) => !existingDetailStepIds.has(d.stepId));

    if (newThemes.length > 0) {
      writeList(STORAGE_KEYS.themes, [...existingThemes, ...newThemes]);
    }
    if (newSteps.length > 0) {
      writeList(STORAGE_KEYS.steps, [...existingSteps, ...newSteps]);
    }
    if (newDetails.length > 0) {
      writeList(STORAGE_KEYS.details, [...existingDetails, ...newDetails]);
    }
  }

  localStorage.setItem(STORAGE_KEYS.version, CURRENT_VERSION);
}

// ── Generic read/write ──────────────────────────────────────────────────────

/** Read without init check (used during init itself) */
function readListRaw<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function readList<T>(key: string): T[] {
  ensureInitialized();
  return readListRaw<T>(key);
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
  notifyListeners();
}

export function updateTheme(themeId: string, updates: Partial<Theme>): void {
  const themes = getAllThemes().map((t) =>
    t.id === themeId ? { ...t, ...updates } : t,
  );
  writeList(STORAGE_KEYS.themes, themes);
  notifyListeners();
}

export function deleteTheme(themeId: string): void {
  // Remove theme
  const themes = getAllThemes().filter((t) => t.id !== themeId);
  writeList(STORAGE_KEYS.themes, themes);

  // Remove associated steps and details
  const stepIds = getStepsByTheme(themeId).map((s) => s.id);
  removeStepsByTheme(themeId);
  if (stepIds.length > 0) {
    removeDetailsByStepIds(stepIds);
  }
  notifyListeners();
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
  notifyListeners();
}

export function addSteps(steps: ThemeStep[]): void {
  const all = getAllSteps();
  all.push(...steps);
  writeList(STORAGE_KEYS.steps, all);
  notifyListeners();
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
  notifyListeners();
}

export function addDetails(details: StepDetail[]): void {
  const all = getAllDetails();
  all.push(...details);
  writeList(STORAGE_KEYS.details, all);
  notifyListeners();
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
