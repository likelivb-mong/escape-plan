-- XCAPE AI — Projects table
-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oqccprellupnbmteotmp/sql/new

create table if not exists public.projects (
  id               text        primary key,
  user_id          uuid        references auth.users(id) on delete cascade not null,
  name             text        not null,
  saved_at         timestamptz not null,
  updated_at       timestamptz not null,
  story_title      text,
  genres           text[],
  play_times       int[],
  synopsis         text,
  completion_level text        not null default 'brief',
  data             jsonb       not null,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- Row Level Security: users can only access their own projects
alter table public.projects enable row level security;

create policy "Users manage own projects"
  on public.projects
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast per-user queries
create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_updated_at_idx on public.projects (updated_at desc);
