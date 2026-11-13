-- run.io initial schema: profiles, runs, territory cells, parties.
-- Territory uses H3 resolution 10 cell ids (text). The app computes them for live feedback;
-- submit_run (week 2) recomputes them server-side. Clients never write `cells` directly.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (char_length(username) between 3 and 20),
  color       text not null default '#B7F34A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  avatar_url  text,
  xp          integer not null default 0 check (xp >= 0),
  level       integer generated always as (1 + xp / 1000) stored,
  created_at  timestamptz not null default now()
);

-- Create a profile automatically on sign-up. Username/colour come from sign-up metadata,
-- falling back to a unique placeholder the user can change in profile setup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, color)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'runner_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'color', ''), '#B7F34A')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Parties (enum values match src/types/party.ts)
-- ---------------------------------------------------------------------------
create type public.party_game_mode as enum ('territory_control', 'distance_race', 'king_of_the_hill');
create type public.party_visibility as enum ('public', 'private');
create type public.party_status as enum ('lobby', 'in_progress', 'completed');

create table public.parties (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  name              text not null check (char_length(name) between 2 and 40),
  host_id           uuid not null references public.profiles (id) on delete cascade,
  game_mode         public.party_game_mode not null default 'territory_control',
  visibility        public.party_visibility not null default 'public',
  status            public.party_status not null default 'lobby',
  max_participants  integer not null default 8 check (max_participants between 2 and 32),
  duration_minutes  integer not null default 30 check (duration_minutes between 5 and 240),
  started_at        timestamptz,
  ends_at           timestamptz,
  created_at        timestamptz not null default now()
);

create table public.party_members (
  party_id   uuid not null references public.parties (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  score      integer not null default 0,
  joined_at  timestamptz not null default now(),
  primary key (party_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Runs
-- ---------------------------------------------------------------------------
create type public.run_status as enum ('submitted', 'accepted', 'rejected');

create table public.runs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  party_id         uuid references public.parties (id) on delete set null,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  distance_m       real not null default 0 check (distance_m >= 0),
  duration_s       integer not null default 0 check (duration_s >= 0),
  cells_captured   integer not null default 0,
  xp_earned        integer not null default 0,
  route            extensions.geography(LineString, 4326),
  status           public.run_status not null default 'submitted',
  reject_reason    text,
  created_at       timestamptz not null default now(),
  check (ended_at >= started_at)
);

create index runs_user_id_idx on public.runs (user_id, started_at desc);
create index runs_party_id_idx on public.runs (party_id) where party_id is not null;

-- ---------------------------------------------------------------------------
-- Territory: one row per owned H3 cell, plus an append-only ownership history
-- ---------------------------------------------------------------------------
create table public.cells (
  h3           text primary key,
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  run_id       uuid references public.runs (id) on delete set null,
  captured_at  timestamptz not null default now()
);

create index cells_owner_id_idx on public.cells (owner_id);

create table public.cell_history (
  id          bigint generated always as identity primary key,
  h3          text not null,
  from_owner  uuid references public.profiles (id) on delete set null,
  to_owner    uuid not null references public.profiles (id) on delete cascade,
  run_id      uuid references public.runs (id) on delete set null,
  at          timestamptz not null default now()
);

create index cell_history_h3_idx on public.cell_history (h3, at desc);

-- ---------------------------------------------------------------------------
-- Leaderboard: score = cells_owned*100 + total_km*10 (+ party_wins*250 in week 3).
-- A security-definer function rather than a view so it can total everyone's runs
-- while the runs table itself (with private routes) stays owner-only.
-- ---------------------------------------------------------------------------
create function public.get_leaderboard(max_rows integer default 50)
returns table (
  rank        bigint,
  user_id     uuid,
  username    text,
  color       text,
  avatar_url  text,
  level       integer,
  cells_owned integer,
  total_km    double precision,
  run_count   integer,
  score       integer
)
language sql
stable
security definer set search_path = ''
as $$
  with totals as (
    select
      p.id as user_id,
      p.username,
      p.color,
      p.avatar_url,
      p.level,
      coalesce(c.cells_owned, 0) as cells_owned,
      coalesce(r.total_distance_m, 0) / 1000.0 as total_km,
      coalesce(r.run_count, 0) as run_count
    from public.profiles p
    left join (
      select owner_id, count(*)::integer as cells_owned from public.cells group by owner_id
    ) c on c.owner_id = p.id
    left join (
      select user_id, sum(distance_m)::double precision as total_distance_m, count(*)::integer as run_count
      from public.runs where status = 'accepted' group by user_id
    ) r on r.user_id = p.id
  )
  select
    rank() over (order by (cells_owned * 100 + floor(total_km * 10)) desc),
    user_id, username, color, avatar_url, level, cells_owned, total_km, run_count,
    (cells_owned * 100 + floor(total_km * 10))::integer
  from totals
  order by 1, username
  limit greatest(1, least(max_rows, 200));
$$;

revoke execute on function public.get_leaderboard(integer) from public, anon;
grant execute on function public.get_leaderboard(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.parties       enable row level security;
alter table public.party_members enable row level security;
alter table public.runs          enable row level security;
alter table public.cells         enable row level security;
alter table public.cell_history  enable row level security;

-- Profiles: every signed-in player can see others (map, leaderboard); you edit only yours.
create policy "profiles are visible to signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "users update their own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Runs (and routes) are private to their owner.
create policy "users read their own runs" on public.runs
  for select to authenticated using (user_id = auth.uid());
create policy "users insert their own runs" on public.runs
  for insert to authenticated with check (user_id = auth.uid() and status = 'submitted');

-- Cells: readable by everyone signed in; written only by submit_run (service role).
create policy "cells are visible to signed-in users" on public.cells
  for select to authenticated using (true);
create policy "cell history is visible to signed-in users" on public.cell_history
  for select to authenticated using (true);

-- Parties: listed for everyone signed in (private ones are joined by code in the app).
create policy "parties are visible to signed-in users" on public.parties
  for select to authenticated using (true);
create policy "users create parties they host" on public.parties
  for insert to authenticated with check (host_id = auth.uid());
create policy "hosts update their parties" on public.parties
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "hosts delete their parties" on public.parties
  for delete to authenticated using (host_id = auth.uid());

create policy "party members are visible to signed-in users" on public.party_members
  for select to authenticated using (true);
create policy "users join parties as themselves" on public.party_members
  for insert to authenticated with check (user_id = auth.uid());
create policy "users leave parties" on public.party_members
  for delete to authenticated using (user_id = auth.uid());

-- Users must not be able to grant themselves XP: only these profile columns are editable.
-- (A column-level revoke would not override Supabase's table-level grant, so re-grant instead.)
-- party_members has no update policy, so scores can't be edited by clients at all.
revoke update on public.profiles from authenticated, anon;
grant update (username, color, avatar_url) on public.profiles to authenticated;

-- Live updates for the map and party lobbies.
alter publication supabase_realtime add table public.cells, public.party_members, public.parties;
