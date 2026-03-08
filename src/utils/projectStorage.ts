import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal } from '../types/story';
import type { ProjectBrief } from '../types';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { PuzzleRecommendationGroup } from '../types/puzzleRecommendation';
import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData } from '../types/floorPlan';

const STORAGE_KEY = 'xcape-projects';

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

export function deriveCompletionLevel(
  selectedStory: StoryProposal | null,
  puzzleFlowPlan: PuzzleFlowPlan | null,
  gameFlowDesign: GameFlowPlan | null,
): CompletionLevel {
  if (puzzleFlowPlan || gameFlowDesign) return 'draft';
  if (selectedStory) return 'flow';
  return 'brief';
}
