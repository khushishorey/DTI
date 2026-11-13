-- Week 2: the core loop. A finished run goes app → submit-run Edge Function (validates the
-- GPS points and computes H3 cells) → apply_run() (one transaction: save the run, take over
-- cells, record history, award XP). Maps read cells_in_bounds(); Profile reads my_stats().

-- ---------------------------------------------------------------------------
-- Cell centres, so maps can fetch "cells in view" with a plain bounding-box query
-- ---------------------------------------------------------------------------
alter table public.cells
  add column center_lat double precision not null,
  add column center_lng double precision not null;

create index cells_center_idx on public.cells (center_lat, center_lng);

-- ---------------------------------------------------------------------------
-- apply_run: called only by the submit-run Edge Function (service role)
-- p_cells: [{"h3": "...", "lat": 0.0, "lng": 0.0}, ...] — cells the run captured
-- ---------------------------------------------------------------------------
create function public.apply_run(
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
  v_new       integer := 0;
  v_stolen    integer := 0;
  v_defended  integer := 0;
  v_xp        integer := 0;
begin
  insert into public.runs (user_id, party_id, started_at, ended_at, distance_m, duration_s, route, status, reject_reason)
  values (
    p_user_id, p_party_id, p_started_at, p_ended_at, p_distance_m, p_duration_s,
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

  return jsonb_build_object('run_id', v_run_id, 'status', p_status, 'reject_reason', null,
    'cells_new', v_new, 'cells_stolen', v_stolen, 'cells_defended', v_defended, 'xp_earned', v_xp);
end;
$$;

revoke execute on function public.apply_run(uuid, uuid, timestamptz, timestamptz, real, integer, text, public.run_status, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_run(uuid, uuid, timestamptz, timestamptz, real, integer, text, public.run_status, text, jsonb)
  to service_role;

-- ---------------------------------------------------------------------------
-- cells_in_bounds: owned cells inside a map viewport, with owner and last previous owner
-- ---------------------------------------------------------------------------
create function public.cells_in_bounds(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  max_rows integer default 1500
)
returns table (
  h3                  text,
  owner_id            uuid,
  owner_name          text,
  owner_color         text,
  captured_at         timestamptz,
  previous_owner_id   uuid,
  previous_owner_name text
)
language sql
stable
security invoker set search_path = ''
as $$
  select
    c.h3, c.owner_id, p.username, p.color, c.captured_at,
    h.from_owner, prev.username
  from public.cells c
  join public.profiles p on p.id = c.owner_id
  left join lateral (
    select ch.from_owner from public.cell_history ch
    where ch.h3 = c.h3 and ch.to_owner = c.owner_id
    order by ch.at desc limit 1
  ) h on true
  left join public.profiles prev on prev.id = h.from_owner
  where c.center_lat between min_lat and max_lat
    and c.center_lng between min_lng and max_lng
  order by c.captured_at desc
  limit greatest(1, least(max_rows, 5000));
$$;

revoke execute on function public.cells_in_bounds(double precision, double precision, double precision, double precision, integer) from public, anon;
grant execute on function public.cells_in_bounds(double precision, double precision, double precision, double precision, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- my_stats: career totals for the signed-in player (Profile + Home header)
-- ---------------------------------------------------------------------------
create function public.my_stats()
returns table (
  total_distance_m double precision,
  total_duration_s bigint,
  run_count        integer,
  cells_owned      integer,
  cells_captured   bigint,
  xp               integer,
  level            integer
)
language sql
stable
security invoker set search_path = ''
as $$
  select
    coalesce((select sum(distance_m) from public.runs where user_id = auth.uid() and status = 'accepted'), 0)::double precision,
    coalesce((select sum(duration_s) from public.runs where user_id = auth.uid() and status = 'accepted'), 0)::bigint,
    (select count(*) from public.runs where user_id = auth.uid() and status = 'accepted')::integer,
    (select count(*) from public.cells where owner_id = auth.uid())::integer,
    coalesce((select sum(cells_captured) from public.runs where user_id = auth.uid() and status = 'accepted'), 0)::bigint,
    p.xp,
    p.level
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke execute on function public.my_stats() from public, anon;
grant execute on function public.my_stats() to authenticated;

-- Runs are created only through submit-run now; drop the direct-insert path from week 1.
drop policy "users insert their own runs" on public.runs;
