-- XCAPE Chat — Chat rooms & messages
-- Run this in the Supabase SQL Editor

-- Chat rooms
create table if not exists public.chat_rooms (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  type        text        not null default 'group' check (type in ('group', '1on1')),
  avatar_color text       not null default '#6366f1',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Chat room members
create table if not exists public.chat_members (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        not null references public.chat_rooms(id) on delete cascade,
  user_id     text        not null,
  user_name   text        not null,
  user_role   text        not null default 'crew' check (user_role in ('admin', 'manager', 'crew')),
  branch_code text,
  joined_at   timestamptz not null default now(),
  unique(room_id, user_id)
);

-- Chat messages
create table if not exists public.chat_messages (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        not null references public.chat_rooms(id) on delete cascade,
  sender_id   text        not null,
  sender_name text        not null,
  sender_role text        not null default 'crew',
  content     text        not null,
  read_by     jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- No RLS — public access (matches existing pattern)
alter table public.chat_rooms disable row level security;
alter table public.chat_members disable row level security;
alter table public.chat_messages disable row level security;

grant all on public.chat_rooms to anon;
grant all on public.chat_rooms to authenticated;
grant all on public.chat_members to anon;
grant all on public.chat_members to authenticated;
grant all on public.chat_messages to anon;
grant all on public.chat_messages to authenticated;

-- Indexes
create index if not exists chat_messages_room_id_idx on public.chat_messages (room_id, created_at desc);
create index if not exists chat_members_room_id_idx on public.chat_members (room_id);
create index if not exists chat_members_user_id_idx on public.chat_members (user_id);

-- Enable Realtime for chat_messages
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_rooms;
