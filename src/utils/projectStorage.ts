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

export interface TrashedProject extends SavedProject {
  deletedAt: string;
}

// ── localStorage cache helpers (for instant UI, offline fallback) ─────────────

function readLocalProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

function writeLocalProjects(projects: SavedProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function cacheProjectLocally(project: SavedProject): void {
  const projects = readLocalProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.unshift(project);
  }
  writeLocalProjects(projects);
}

function removeFromLocalCache(id: string): void {
  const projects = readLocalProjects().filter((p) => p.id !== id);
  writeLocalProjects(projects);
}

// ── Row ↔ Project mapping ────────────────────────────────────────────────────

function mapRowToProject(row: any): SavedProject {
  return {
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
    floorPlanData: row.floor_plan_data ? normalizeFloorPlan(row.floor_plan_data) : null,
    passmapLink: row.passmap_link,
  };
}

function mapRowToTrashedProject(row: any): TrashedProject {
  return {
    ...mapRowToProject(row),
    deletedAt: row.deleted_at,
  };
}

function projectToRow(project: SavedProject) {
  return {
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
  };
}

// ── List projects (Supabase-first, localStorage fallback) ────────────────────

/** Instant list from localStorage cache */
export function listSavedProjects(): SavedProject[] {
  return readLocalProjects();
}

/** Primary list from Supabase (active projects only) */
export async function listSavedProjectsFromSupabase(): Promise<SavedProject[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Filter out trashed projects client-side (resilient to schema cache lag)
    const activeRows = (data || []).filter((row: any) => !row.deleted_at);
    const projects = activeRows.map(mapRowToProject);

    // Update localStorage cache with the fresh list
    writeLocalProjects(projects);

    return projects;
  } catch (error) {
    console.error('Failed to load projects from Supabase:', error);
    // Fallback to localStorage
    return readLocalProjects();
  }
}

// ── List trashed projects from Supabase ──────────────────────────────────────

export async function listTrashedProjectsFromSupabase(): Promise<TrashedProject[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Filter trashed projects client-side (resilient to schema cache lag)
    const trashedRows = (data || []).filter((row: any) => !!row.deleted_at);
    return trashedRows.map(mapRowToTrashedProject);
  } catch (error) {
    console.error('Failed to load trashed projects from Supabase:', error);
    return [];
  }
}

// ── Upsert (save/update) ────────────────────────────────────────────────────

export function upsertProject(project: SavedProject): void {
  const normalizedProject: SavedProject = {
    ...project,
    floorPlanData: project.floorPlanData ? normalizeFloorPlan(project.floorPlanData) : null,
  };

  // Update localStorage cache (instant response)
  cacheProjectLocally(normalizedProject);

  // Sync to Supabase
  upsertProjectToSupabase(normalizedProject).catch(console.error);
}

async function upsertProjectToSupabase(project: SavedProject): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('projects')
      .upsert(projectToRow(project));

    if (error) throw error;
  } catch (error) {
    console.error('Failed to sync project to Supabase:', error);
  }
}

// ── Load by ID (Supabase-first) ─────────────────────────────────────────────

/** Sync load from localStorage cache */
export function loadProjectById(id: string): SavedProject | null {
  const project = readLocalProjects().find((p) => p.id === id);
  if (!project) return null;

  return {
    ...project,
    floorPlanData: project.floorPlanData ? normalizeFloorPlan(project.floorPlanData) : null,
  };
}

/** Async load from Supabase (primary source of truth) */
export async function loadProjectByIdFromSupabase(id: string): Promise<SavedProject | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const project = mapRowToProject(data);
    // Update local cache
    cacheProjectLocally(project);
    return project;
  } catch (error) {
    console.error('Failed to load project from Supabase:', error);
    return null;
  }
}

// ── Delete (hard delete) ────────────────────────────────────────────────────

export function deleteProjectById(id: string): void {
  removeFromLocalCache(id);
  deleteProjectFromSupabase(id).catch(console.error);
}

async function deleteProjectFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
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

// ── Trash (soft delete via Supabase) ────────────────────────────────────────

export function moveToTrash(id: string): void {
  // Remove from local active cache
  removeFromLocalCache(id);

  // Soft-delete in Supabase (set deleted_at)
  if (supabase) {
    Promise.resolve(
      supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    ).then(({ error }) => {
      if (error) console.error('Failed to move project to trash in Supabase:', error);
    }).catch((err: unknown) => console.error('moveToTrash network error:', err));
  }
}

export function restoreFromTrash(id: string): void {
  // Clear deleted_at in Supabase to restore
  if (supabase) {
    Promise.resolve(
      supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', id)
    ).then(({ error }) => {
      if (error) console.error('Failed to restore project from Supabase:', error);
    }).catch((err: unknown) => console.error('restoreFromTrash network error:', err));
  }
}

export function permanentlyDelete(id: string): void {
  // Hard delete from Supabase
  deleteProjectFromSupabase(id).catch(console.error);
}

export function emptyTrash(): void {
  // Delete all trashed projects from Supabase
  if (supabase) {
    Promise.resolve(
      supabase
        .from('projects')
        .delete()
        .not('deleted_at', 'is', null)
    ).then(({ error }) => {
      if (error) console.error('Failed to empty trash in Supabase:', error);
    }).catch((err: unknown) => console.error('emptyTrash network error:', err));
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function deriveCompletionLevel(
  selectedStory: StoryProposal | null,
  puzzleFlowPlan: PuzzleFlowPlan | null,
  gameFlowDesign: GameFlowPlan | null,
): CompletionLevel {
  if (puzzleFlowPlan || gameFlowDesign) return 'flow';
  if (selectedStory) return 'story';
  return 'brief';
}
