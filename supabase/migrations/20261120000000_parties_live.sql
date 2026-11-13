-- Go-live: parties become playable. Clients create/join/start/finish/leave parties only through
-- the RPCs below; apply_run() scores accepted runs for live party members; the leaderboard gets a
-- "nearby" variant and other players get a public summary (aggregates only, never routes).

alter table public.party_members
  add column cells_captured integer not null default 0,
  add column distance_m real not null default 0;

create index party_members_user_idx on public.party_members (user_id);

-- Writes now go through the RPCs (code generation, capacity checks, host membership).
drop policy "users create parties they host" on public.parties;
drop policy "users join parties as themselves" on public.party_members;

-- Hosts may only rename / change visibility directly; status and timing go through the RPCs.
-- (Same re-grant pattern as profiles: a column revoke wouldn't override the table grant.)
revoke update on public.parties from authenticated, anon;
grant update (name, visibility) on public.parties to authenticated;

-- ---------------------------------------------------------------------------
-- create_party: host creates a lobby with a fresh 6-char code and joins it
-- ---------------------------------------------------------------------------
create function public.create_party(
  p_name             text,
  p_visibility       public.party_visibility,
  p_game_mode        public.party_game_mode,
  p_duration_minutes integer,
  p_max_participants integer
)
returns public.parties
language plpgsql
security definer set search_path = ''
as $$
declare
  v_party public.parties;
  v_tries integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  loop
    v_tries := v_tries + 1;
    if v_tries > 10 then
      raise exception 'Could not generate party code';
    end if;
    begin
      insert into public.parties (code, name, host_id, game_mode, visibility, duration_minutes, max_participants)
      values (
        (select string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 1 + floor(random() * 36)::integer, 1), '')
         from generate_series(1, 6)),
        btrim(p_name), auth.uid(), p_game_mode, p_visibility, p_duration_minutes, p_max_participants
      )
      returning * into v_party;
      exit;
    exception when unique_violation then
      -- code collision: draw another one
    end;
  end loop;

  insert into public.party_members (party_id, user_id) values (v_party.id, auth.uid());
  return v_party;
end;
$$;

-- ---------------------------------------------------------------------------
-- join_party: by code; the party row lock makes the capacity check race-free
-- ---------------------------------------------------------------------------
create function public.join_party(p_code text)
returns public.parties
language plpgsql
security definer set search_path = ''
as $$
declare
  v_party public.parties;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_party from public.parties where code = upper(btrim(p_code)) for update;
  if not found then
    raise exception 'Party not found';
  end if;
  if v_party.status = 'completed' then
    raise exception 'Party has ended';
  end if;

  if exists (select 1 from public.party_members where party_id = v_party.id and user_id = auth.uid()) then
    return v_party;
  end if;

  if (select count(*) from public.party_members where party_id = v_party.id) >= v_party.max_participants then
    raise exception 'Party is full';
  end if;

  insert into public.party_members (party_id, user_id) values (v_party.id, auth.uid());
  return v_party;
end;
$$;

-- ---------------------------------------------------------------------------
-- leave_party: drop own membership; a host leaving a lobby disbands it
-- ---------------------------------------------------------------------------
create function public.leave_party(p_party_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_party public.parties;
begin
  select * into v_party from public.parties where id = p_party_id for update;
  if not found then
    return;
  end if;

  if v_party.host_id = auth.uid() and v_party.status = 'lobby' then
    delete from public.parties where id = p_party_id;
  else
    delete from public.party_members where party_id = p_party_id and user_id = auth.uid();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- start_party: host only, from lobby, with at least two runners
-- ---------------------------------------------------------------------------
create function public.start_party(p_party_id uuid)
returns public.parties
language plpgsql
security definer set search_path = ''
as $$
declare
  v_party public.parties;
begin
  select * into v_party from public.parties where id = p_party_id for update;
  if not found then
    raise exception 'Party not found';
  end if;
  if v_party.host_id is distinct from auth.uid() then
    raise exception 'Only the host can start';
  end if;
  if v_party.status <> 'lobby' then
    raise exception 'Party already started';
  end if;
  if (select count(*) from public.party_members where party_id = p_party_id) < 2 then
    raise exception 'Need at least 2 runners';
  end if;

  update public.parties
  set status = 'in_progress',
      started_at = now(),
      ends_at = now() + make_interval(mins => duration_minutes)
  where id = p_party_id
  returning * into v_party;
  return v_party;
end;
$$;

-- ---------------------------------------------------------------------------
-- finish_party: host anytime; any member once ends_at has passed; no-op when completed
-- ---------------------------------------------------------------------------
create function public.finish_party(p_party_id uuid)
returns public.parties
language plpgsql
security definer set search_path = ''
as $$
declare
  v_party public.parties;
begin
  select * into v_party from public.parties where id = p_party_id for update;
  if not found then
    raise exception 'Party not found';
  end if;
  if v_party.status = 'completed' then
    return v_party;
  end if;

  if v_party.host_id is distinct from auth.uid() then
    if not exists (select 1 from public.party_members where party_id = p_party_id and user_id = auth.uid()) then
      raise exception 'Not a party member';
    end if;
    if v_party.ends_at is null or now() < v_party.ends_at then
      raise exception 'Party has not ended yet';
    end if;
  end if;

  update public.parties set status = 'completed' where id = p_party_id returning * into v_party;
  return v_party;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_party_leaderboard: live standings for one party
-- ---------------------------------------------------------------------------
create function public.get_party_leaderboard(p_party_id uuid)
returns table (
  rank           bigint,
  user_id        uuid,
  username       text,
  color          text,
  avatar_url     text,
  score          integer,
  cells_captured integer,
  distance_m     real,
  is_host        boolean
)
language sql
stable
security definer set search_path = ''
as $$
  select
    rank() over (order by m.score desc),
    m.user_id, p.username, p.color, p.avatar_url, m.score, m.cells_captured, m.distance_m,
    m.user_id = pa.host_id
  from public.party_members m
  join public.profiles p on p.id = m.user_id
  join public.parties pa on pa.id = m.party_id
  where m.party_id = p_party_id
  order by 1, p.username;
$$;

-- ---------------------------------------------------------------------------
-- get_leaderboard_nearby: get_leaderboard, limited to players owning a cell in the box
-- ---------------------------------------------------------------------------
create function public.get_leaderboard_nearby(
  min_lat  double precision,
  min_lng  double precision,
  max_lat  double precision,
  max_lng  double precision,
  max_rows integer default 50
)
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
    where exists (
      select 1 from public.cells nc
      where nc.owner_id = p.id
        and nc.center_lat between min_lat and max_lat
        and nc.center_lng between min_lng and max_lng
    )
  )
  select
    rank() over (order by (cells_owned * 100 + floor(total_km * 10)) desc),
    user_id, username, color, avatar_url, level, cells_owned, total_km, run_count,
    (cells_owned * 100 + floor(total_km * 10))::integer
  from totals
  order by 1, username
  limit greatest(1, least(max_rows, 200));
$$;

-- ---------------------------------------------------------------------------
-- player_summary: another player's public stats; reads runs past RLS for totals only
-- ---------------------------------------------------------------------------
create function public.player_summary(p_user_id uuid)
returns table (
  user_id     uuid,
  username    text,
  color       text,
  avatar_url  text,
  level       integer,
  xp          integer,
  cells_owned integer,
  total_km    double precision,
  run_count   integer,
  joined_at   timestamptz
)
language sql
stable
security definer set search_path = ''
as $$
  select
    p.id, p.username, p.color, p.avatar_url, p.level, p.xp,
    (select count(*) from public.cells where owner_id = p.id)::integer,
    coalesce((select sum(distance_m) from public.runs where user_id = p.id and status = 'accepted'), 0)::double precision / 1000.0,
    (select count(*) from public.runs where user_id = p.id and status = 'accepted')::integer,
    p.created_at
  from public.profiles p
  where p.id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- apply_run: unchanged from core_loop, plus party scoring. The party id is kept only for a
-- member of an in-progress party whose run ended inside the party window; else stored as null.
-- (create or replace keeps the existing service_role-only grants.)
-- ---------------------------------------------------------------------------
create or replace function public.apply_run(
  p_user_id       uuid,
  p_party_id      uuid,
  p_started_at    timestamptz,
  p_ended_at      timestamptz,
  p_distance_m    real,
  p_duration_s    integer,
  p_route_wkt     text,
  p_status        public.run_status,
  p_reject_reason text,
  p_cells         jsonb
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_run_id    uuid;
  v_party_id  uuid;
  v_new       integer := 0;
  v_stolen    integer := 0;
  v_defended  integer := 0;
  v_xp        integer := 0;
begin
  select pa.id into v_party_id
  from public.parties pa
  join public.party_members m on m.party_id = pa.id and m.user_id = p_user_id
  where pa.id = p_party_id
    and pa.status = 'in_progress'
    and p_ended_at between pa.started_at and pa.ends_at;

  insert into public.runs (user_id, party_id, started_at, ended_at, distance_m, duration_s, route, status, reject_reason)
  values (
    p_user_id, v_party_id, p_started_at, p_ended_at, p_distance_m, p_duration_s,
    case when p_route_wkt is null then null
         else extensions.st_geogfromtext('SRID=4326;' || p_route_wkt) end,
    p_status, p_reject_reason
  )
  returning id into v_run_id;

  if p_status <> 'accepted' then
    return jsonb_build_object('run_id', v_run_id, 'status', p_status, 'reject_reason', p_reject_reason,
      'cells_new', 0, 'cells_stolen', 0, 'cells_defended', 0, 'xp_earned', 0);
  end if;

  -- Lock the cells this run touches so two runs finishing at once can't interleave.
  drop table if exists pg_temp.incoming;
  create temporary table incoming on commit drop as
  select x.h3, x.lat, x.lng, c.owner_id as previous_owner
  from jsonb_to_recordset(coalesce(p_cells, '[]'::jsonb)) as x(h3 text, lat double precision, lng double precision)
  left join public.cells c on c.h3 = x.h3;

  perform 1 from public.cells c join pg_temp.incoming i on i.h3 = c.h3 for update of c;

  select
    count(*) filter (where previous_owner is null),
    count(*) filter (where previous_owner is not null and previous_owner <> p_user_id),
    count(*) filter (where previous_owner = p_user_id)
  into v_new, v_stolen, v_defended
  from pg_temp.incoming;

  insert into public.cell_history (h3, from_owner, to_owner, run_id)
  select h3, previous_owner, p_user_id, v_run_id
  from pg_temp.incoming
  where previous_owner is distinct from p_user_id;

  -- Taking a cell (or running through your own) makes you the owner and refreshes its timestamp.
  insert into public.cells (h3, owner_id, run_id, captured_at, center_lat, center_lng)
  select h3, p_user_id, v_run_id, now(), lat, lng from pg_temp.incoming
  on conflict (h3) do update
    set owner_id = excluded.owner_id,
        run_id = excluded.run_id,
        captured_at = excluded.captured_at;

  -- XP: base 50, +1 per 100 m, +10 per minute, +5 per new cell, +10 per stolen cell.
  v_xp := 50
    + floor(p_distance_m / 100)::integer
    + (p_duration_s / 60) * 10
    + v_new * 5
    + v_stolen * 10;

  update public.runs set cells_captured = v_new + v_stolen, xp_earned = v_xp where id = v_run_id;
  update public.profiles set xp = xp + v_xp where id = p_user_id;

  -- Party score: 100 per captured cell, +1 per 100 m.
  if v_party_id is not null then
    update public.party_members
    set score = score + (v_new + v_stolen) * 100 + floor(p_distance_m / 100)::integer,
        cells_captured = cells_captured + v_new + v_stolen,
        distance_m = distance_m + p_distance_m
    where party_id = v_party_id and user_id = p_user_id;
  end if;

  return jsonb_build_object('run_id', v_run_id, 'status', p_status, 'reject_reason', null,
    'cells_new', v_new, 'cells_stolen', v_stolen, 'cells_defended', v_defended, 'xp_earned', v_xp);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: signed-in players only
-- ---------------------------------------------------------------------------
revoke execute on function public.create_party(text, public.party_visibility, public.party_game_mode, integer, integer) from public, anon;
grant execute on function public.create_party(text, public.party_visibility, public.party_game_mode, integer, integer) to authenticated;
revoke execute on function public.join_party(text) from public, anon;
grant execute on function public.join_party(text) to authenticated;
revoke execute on function public.leave_party(uuid) from public, anon;
grant execute on function public.leave_party(uuid) to authenticated;
revoke execute on function public.start_party(uuid) from public, anon;
grant execute on function public.start_party(uuid) to authenticated;
revoke execute on function public.finish_party(uuid) from public, anon;
grant execute on function public.finish_party(uuid) to authenticated;
revoke execute on function public.get_party_leaderboard(uuid) from public, anon;
grant execute on function public.get_party_leaderboard(uuid) to authenticated;
revoke execute on function public.get_leaderboard_nearby(double precision, double precision, double precision, double precision, integer) from public, anon;
grant execute on function public.get_leaderboard_nearby(double precision, double precision, double precision, double precision, integer) to authenticated;
revoke execute on function public.player_summary(uuid) from public, anon;
grant execute on function public.player_summary(uuid) to authenticated;
