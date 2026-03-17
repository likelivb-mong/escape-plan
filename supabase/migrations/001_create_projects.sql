-- XCAPE AI — Projects table
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bmgswquftwwryvszrsyp/sql/new

-- Drop old table if exists (fresh start)
drop table if exists public.projects;

create table public.projects (
  id                            text        primary key,
  name                          text        not null,
  saved_at                      timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  story_title                   text,
  genres                        jsonb,
  play_times                    jsonb,
  synopsis                      text,
  completion_level              text        not null default 'brief',
  branch_code                   text,
  project_brief                 jsonb,
  cells                         jsonb       not null default '[]'::jsonb,
  selected_story                jsonb,
  puzzle_flow_plan              jsonb,
  puzzle_recommendation_groups  jsonb       not null default '[]'::jsonb,
  game_flow_design              jsonb,
  floor_plan_data               jsonb,
  passmap_link                  jsonb,
  created_at                    timestamptz not null default now()
);

-- No RLS — public access (no auth required)
alter table public.projects disable row level security;

-- Allow anonymous access (insert, select, update, delete)
grant all on public.projects to anon;
grant all on public.projects to authenticated;

-- Index for fast queries
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);
