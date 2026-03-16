import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal } from '../types/story';
import type { ProjectBrief } from '../types';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { PuzzleRecommendationGroup } from '../types/puzzleRecommendation';
import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData } from '../types/floorPlan';
import { normalizeFloorPlan } from './floorPlan';
import { supabase } from '../services/supabase';

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
  branchCode?: string | null;
  // Full state snapshot
  projectBrief: ProjectBrief | null;
  cells: MandalartCellData[];
  selectedStory: StoryProposal | null;
  puzzleFlowPlan: PuzzleFlowPlan | null;
  puzzleRecommendationGroups: PuzzleRecommendationGroup[];
  gameFlowDesign: GameFlowPlan | null;
  floorPlanData: FloorPlanData | null;
  passmapLink?: { branchCode: string; themeId: string } | null;
}

// ── Hybrid approach: Load from localStorage first, sync with Supabase in background ────

export function listSavedProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

export async function listSavedProjectsFromSupabase(): Promise<SavedProject[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      savedAt: row.saved_at,
      updatedAt: row.updated_at,
      storyTitle: row.story_title,
      genres: row.genres,
      playTimes: row.play_times,
      synopsis: row.synopsis,
      completionLevel: row.completion_level as CompletionLevel,
      branchCode: row.branch_code,
      projectBrief: row.project_brief,
      cells: row.cells || [],
      selectedStory: row.selected_story,
      puzzleFlowPlan: row.puzzle_flow_plan,
      puzzleRecommendationGroups: row.puzzle_recommendation_groups || [],
      gameFlowDesign: row.game_flow_design,
      // ⚠️ Always normalize floor plans from Supabase
      floorPlanData: row.floor_plan_data ? normalizeFloorPlan(row.floor_plan_data) : null,
      passmapLink: row.passmap_link,
    }));
  } catch (error) {
    console.error('Failed to load projects from Supabase:', error);
    return [];
  }
}

export function upsertProject(project: SavedProject): void {
  // ⚠️ CRITICAL: Normalize floor plan before saving
  const normalizedProject: SavedProject = {
    ...project,
    floorPlanData: project.floorPlanData ? normalizeFloorPlan(project.floorPlanData) : null,
  };

  // Update localStorage first (instant response)
  const projects = listSavedProjects();
  const idx = projects.findIndex((p) => p.id === normalizedProject.id);
  if (idx >= 0) {
    projects[idx] = normalizedProject;
  } else {
    projects.unshift(normalizedProject);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

  // Sync to Supabase in background
  upsertProjectToSupabase(normalizedProject).catch(console.error);
}

async function upsertProjectToSupabase(project: SavedProject): Promise<void> {
  try {
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        name: project.name,
        saved_at: project.savedAt,
        updated_at: project.updatedAt,
        story_title: project.storyTitle,
        genres: project.genres,
        play_times: project.playTimes,
        synopsis: project.synopsis,
        completion_level: project.completionLevel,
        branch_code: project.branchCode,
        project_brief: project.projectBrief,
        cells: project.cells,
        selected_story: project.selectedStory,
        puzzle_flow_plan: project.puzzleFlowPlan,
        puzzle_recommendation_groups: project.puzzleRecommendationGroups,
        game_flow_design: project.gameFlowDesign,
        floor_plan_data: project.floorPlanData,
        passmap_link: project.passmapLink,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to sync project to Supabase:', error);
  }
}

export function loadProjectById(id: string): SavedProject | null {
  const project = listSavedProjects().find((p) => p.id === id);
  if (!project) return null;

  // ⚠️ CRITICAL: Always normalize floorPlanData on load to ensure data integrity
  // This catches any floor plans saved before normalization was implemented
  return {
    ...project,
    floorPlanData: project.floorPlanData ? normalizeFloorPlan(project.floorPlanData) : null,
  };
}

export async function loadProjectByIdFromSupabase(id: string): Promise<SavedProject | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      savedAt: data.saved_at,
      updatedAt: data.updated_at,
      storyTitle: data.story_title,
      genres: data.genres,
      playTimes: data.play_times,
      synopsis: data.synopsis,
      completionLevel: data.completion_level as CompletionLevel,
      branchCode: data.branch_code,
      projectBrief: data.project_brief,
      cells: data.cells || [],
      selectedStory: data.selected_story,
      puzzleFlowPlan: data.puzzle_flow_plan,
      puzzleRecommendationGroups: data.puzzle_recommendation_groups || [],
      gameFlowDesign: data.game_flow_design,
      // ⚠️ Always normalize floor plans from Supabase
      floorPlanData: data.floor_plan_data ? normalizeFloorPlan(data.floor_plan_data) : null,
      passmapLink: data.passmap_link,
    };
  } catch (error) {
    console.error('Failed to load project from Supabase:', error);
    return null;
  }
}

export function deleteProjectById(id: string): void {
  // Delete from localStorage first
  const projects = listSavedProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

  // Delete from Supabase in background
  deleteProjectFromSupabase(id).catch(console.error);
}

async function deleteProjectFromSupabase(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete project from Supabase:', error);
  }
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
  if (puzzleFlowPlan || gameFlowDesign) return 'flow';
  if (selectedStory) return 'story';
  return 'brief';
}
