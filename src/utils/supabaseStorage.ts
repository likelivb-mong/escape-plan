/**
 * Supabase cloud storage for projects.
 * Works in parallel with localStorage — localStorage stays the sync source of truth,
 * Supabase provides cross-device persistence when the user is logged in.
 *
 * SQL to run once in the Supabase SQL editor:
 * ─────────────────────────────────────────────────────────────────────────────
 * create table if not exists public.projects (
 *   id            text        primary key,
 *   user_id       uuid        references auth.users(id) on delete cascade not null,
 *   name          text        not null,
 *   saved_at      timestamptz not null,
 *   updated_at    timestamptz not null,
 *   story_title   text,
 *   genres        text[],
 *   play_times    int[],
 *   synopsis      text,
 *   completion_level text      not null default 'brief',
 *   data          jsonb       not null,
 *   deleted_at    timestamptz,
 *   created_at    timestamptz not null default now()
 * );
 * alter table public.projects enable row level security;
 * create policy "Users manage own projects" on public.projects
 *   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '../lib/supabase';
import type { SavedProject, TrashedProject } from './projectStorage';

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  saved_at: string;
  updated_at: string;
  story_title: string | null;
  genres: string[] | null;
  play_times: number[] | null;
  synopsis: string | null;
  completion_level: string;
  data: Record<string, unknown>;
  deleted_at: string | null;
}

function toRow(project: SavedProject, userId: string, deletedAt?: string): ProjectRow {
  const { id, name, savedAt, updatedAt, storyTitle, genres, playTimes, synopsis, completionLevel, ...rest } = project;
  return {
    id,
    user_id: userId,
    name,
    saved_at: savedAt,
    updated_at: updatedAt,
    story_title: storyTitle ?? null,
    genres: genres ?? null,
    play_times: playTimes ?? null,
    synopsis: synopsis ?? null,
    completion_level: completionLevel,
    data: rest as Record<string, unknown>,
    deleted_at: deletedAt ?? null,
  };
}

function fromRow(row: ProjectRow): SavedProject {
  return {
    id: row.id,
    name: row.name,
    savedAt: row.saved_at,
    updatedAt: row.updated_at,
    storyTitle: row.story_title ?? undefined,
    genres: row.genres ?? undefined,
    playTimes: row.play_times ?? undefined,
    synopsis: row.synopsis ?? undefined,
    completionLevel: row.completion_level as SavedProject['completionLevel'],
    ...(row.data as Omit<SavedProject, 'id' | 'name' | 'savedAt' | 'updatedAt' | 'storyTitle' | 'genres' | 'playTimes' | 'synopsis' | 'completionLevel'>),
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function cloudUpsertProject(project: SavedProject, userId: string): Promise<void> {
  const row = toRow(project, userId);
  const { error } = await supabase.from('projects').upsert(row);
  if (error) console.error('[Supabase] upsert error:', error.message);
}

export async function cloudListProjects(userId: string): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[Supabase] list error:', error.message);
    return [];
  }
  return (data as ProjectRow[]).map(fromRow);
}

export async function cloudLoadProject(id: string): Promise<SavedProject | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] load error:', error.message);
    return null;
  }
  return fromRow(data as ProjectRow);
}

export async function cloudDeleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('[Supabase] delete error:', error.message);
}

export async function cloudMoveToTrash(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('[Supabase] trash error:', error.message);
}

export async function cloudListTrashed(userId: string): Promise<TrashedProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('[Supabase] list trash error:', error.message);
    return [];
  }
  return (data as ProjectRow[]).map((row) => ({
    ...fromRow(row),
    deletedAt: row.deleted_at!,
  }));
}

export async function cloudRestoreFromTrash(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) console.error('[Supabase] restore error:', error.message);
}
