-- Add soft-delete support for cross-device trash sync
alter table public.projects add column if not exists deleted_at timestamptz default null;

-- Index for filtering active vs trashed projects
create index if not exists projects_deleted_at_idx on public.projects (deleted_at);
