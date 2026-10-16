-- Additive setup: run once before deploying the bylaws reader.
begin;
create table if not exists public.bylaws_settings (
  id text primary key check (id = 'articles'),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.bylaws_settings(id) values ('articles') on conflict do nothing;
create table if not exists public.bylaws_access (
  member_id text primary key references public.members(id),
  restricted boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.bylaws_events (
  id uuid primary key default gen_random_uuid(),
  member_id text references public.members(id),
  actor text not null,
  event text not null check (event in ('opened','copy_attempt','print_attempt','save_attempt','capture_shortcut','activated','deactivated','restricted','restored')),
  created_at timestamptz not null default now()
);
create index if not exists bylaws_events_created_idx on public.bylaws_events(created_at desc);
alter table public.bylaws_settings enable row level security;
alter table public.bylaws_access enable row level security;
alter table public.bylaws_events enable row level security;
revoke all on public.bylaws_settings, public.bylaws_access, public.bylaws_events from public, anon, authenticated;
grant select, insert, update, delete on public.bylaws_settings, public.bylaws_access, public.bylaws_events to service_role;
commit;
