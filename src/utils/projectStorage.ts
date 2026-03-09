import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal } from '../types/story';
import type { ProjectBrief } from '../types';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { PuzzleRecommendationGroup } from '../types/puzzleRecommendation';
import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData } from '../types/floorPlan';

const STORAGE_KEY = 'xcape-projects';
const TRASH_KEY = 'xcape-projects-trash';

export type CompletionLevel = 'brief' | 'story' | 'flow' | 'draft';

export interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  updatedAt: string;
  // Summary for card display
  storyTitle?: string;
  genres?: string[];
  playTimes?: number[];
  synopsis?: string;
  completionLevel: CompletionLevel;
  // Full state snapshot
  projectBrief: ProjectBrief | null;
  cells: MandalartCellData[];
  selectedStory: StoryProposal | null;
  puzzleFlowPlan: PuzzleFlowPlan | null;
  puzzleRecommendationGroups: PuzzleRecommendationGroup[];
  gameFlowDesign: GameFlowPlan | null;
  floorPlanData: FloorPlanData | null;
}

export function listSavedProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

export function upsertProject(project: SavedProject): void {
  const projects = listSavedProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.unshift(project);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function loadProjectById(id: string): SavedProject | null {
  return listSavedProjects().find((p) => p.id === id) ?? null;
}

export function deleteProjectById(id: string): void {
  const projects = listSavedProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ── Trash ─────────────────────────────────────────────────────────────────────

export interface TrashedProject extends SavedProject {
  deletedAt: string;
}

export function listTrashedProjects(): TrashedProject[] {
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TrashedProject[];
  } catch {
    return [];
  }
}

export function moveToTrash(id: string): void {
  const project = loadProjectById(id);
  if (!project) return;
  // Add to trash
  const trash = listTrashedProjects();
  trash.unshift({ ...project, deletedAt: new Date().toISOString() });
  localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  // Remove from active projects
  deleteProjectById(id);
}

export function restoreFromTrash(id: string): void {
  const trash = listTrashedProjects();
  const item = trash.find((p) => p.id === id);
  if (!item) return;
  // Restore to active (strip deletedAt)
  const { deletedAt: _deleted, ...project } = item;
  upsertProject(project as SavedProject);
  // Remove from trash
  const updated = trash.filter((p) => p.id !== id);
  localStorage.setItem(TRASH_KEY, JSON.stringify(updated));
}

export function permanentlyDelete(id: string): void {
  const trash = listTrashedProjects().filter((p) => p.id !== id);
  localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
}

export function emptyTrash(): void {
  localStorage.removeItem(TRASH_KEY);
}

export function deriveCompletionLevel(
  selectedStory: StoryProposal | null,
  puzzleFlowPlan: PuzzleFlowPlan | null,
  gameFlowDesign: GameFlowPlan | null,
): CompletionLevel {
  if (puzzleFlowPlan || gameFlowDesign) return 'draft';
  if (selectedStory) return 'flow';
  return 'brief';
}
