-- Add branch_code to chat_rooms to identify branch-specific group rooms
alter table public.chat_rooms add column if not exists branch_code text;

create index if not exists chat_rooms_branch_code_idx on public.chat_rooms (branch_code);
