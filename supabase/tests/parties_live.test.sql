-- Party RPCs, party scoring in apply_run, nearby leaderboard, player summary.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres). The auth trigger creates a profile per user.
-- u1 host, u2 joiner, u3 other host, u4 outsider, u5 brand-new user.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'u1@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'u2@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'u3@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'u4@test.local'),
  ('55555555-5555-5555-5555-555555555555', 'u5@test.local');

insert into public.parties (id, code, name, host_id, status, max_participants) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'AB12CD', 'Capacity two', '11111111-1111-1111-1111-111111111111', 'lobby', 2),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'DONE01', 'Finished', '33333333-3333-3333-3333-333333333333', 'completed', 8),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'LOBBY1', 'Still lobby', '33333333-3333-3333-3333-333333333333', 'lobby', 8);

insert into public.party_members (party_id, user_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444');

-- ---------------------------------------------------------------------------
-- create_party (as u1)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select public.create_party('Morning crew', 'public', 'territory_control', 30, 8);
select ok(
  (select code ~ '^[A-Z0-9]{6}$' from public.parties where name = 'Morning crew'),
  'create_party generates a 6-char code');
select ok(
  exists (select 1 from public.party_members m join public.parties p on p.id = m.party_id
          where p.name = 'Morning crew' and m.user_id = '11111111-1111-1111-1111-111111111111'),
  'create_party adds the host as a member');

-- ---------------------------------------------------------------------------
-- join_party
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is((public.join_party(' ab12cd ')).code, 'AB12CD', 'join_party is case/space insensitive');
select ok(
  exists (select 1 from public.party_members
          where party_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = '22222222-2222-2222-2222-222222222222'),
  'join_party inserts the membership');
select lives_ok($$ select public.join_party('AB12CD') $$, 'join_party is idempotent for an existing member');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select throws_ok($$ select public.join_party('AB12CD') $$, 'P0001', 'Party is full', 'join_party rejects full party');
select throws_ok($$ select public.join_party('ZZZZZZ') $$, 'P0001', 'Party not found', 'join_party rejects unknown code');
select throws_ok($$ select public.join_party('DONE01') $$, 'P0001', 'Party has ended', 'join_party rejects completed party');

-- ---------------------------------------------------------------------------
-- start_party
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok($$ select public.start_party('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'P0001', 'Only the host can start', 'start_party non-host rejected');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select public.create_party('Solo party', 'private', 'distance_race', 30, 8);
select throws_ok($$ select public.start_party((select id from public.parties where name = 'Solo party')) $$,
  'P0001', 'Need at least 2 runners', 'start_party with 1 member rejected');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is((public.start_party('aaaaaaaa-0000-0000-0000-000000000001')).status, 'in_progress'::public.party_status,
  'start_party by host goes live');
select throws_ok($$ select public.start_party('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'P0001', 'Party already started', 'start_party twice rejected');

-- ---------------------------------------------------------------------------
-- apply_run party scoring (service-side call, as postgres)
-- ---------------------------------------------------------------------------
reset role;

select public.apply_run('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001',
  now() - interval '10 minutes', now(), 1500, 600, null, 'accepted', null,
  '[{"h3":"t_cell_a","lat":10.0,"lng":10.0},{"h3":"t_cell_b","lat":10.1,"lng":10.1},{"h3":"t_cell_c","lat":10.2,"lng":10.2}]');
select is((select score from public.party_members
           where party_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = '22222222-2222-2222-2222-222222222222'),
  315, 'apply_run scores party member');
select is((select cells_captured from public.party_members
           where party_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = '22222222-2222-2222-2222-222222222222'),
  3, 'apply_run adds captured cells to the party member');
select is((select distance_m from public.party_members
           where party_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = '22222222-2222-2222-2222-222222222222'),
  1500::real, 'apply_run adds distance to the party member');

-- non-member (u4 is not in AB12CD); this run also gives u4 a far-away cell for the nearby test
create temp table r_nonmember as
select public.apply_run('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-0000-0000-0000-000000000001',
  now() - interval '10 minutes', now(), 1000, 600, null, 'accepted', null,
  '[{"h3":"t_cell_far","lat":50.0,"lng":50.0}]') as res;
select is((select party_id from public.runs where id = (select (res ->> 'run_id')::uuid from r_nonmember)), null,
  'apply_run ignores party for non-member');

-- lobby party
create temp table r_lobby as
select public.apply_run('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-0000-0000-0000-000000000003',
  now() - interval '10 minutes', now(), 1000, 600, null, 'accepted', null, '[]') as res;
select is((select party_id from public.runs where id = (select (res ->> 'run_id')::uuid from r_lobby)), null,
  'apply_run ignores party in lobby');
select is((select score from public.party_members
           where party_id = 'aaaaaaaa-0000-0000-0000-000000000003' and user_id = '44444444-4444-4444-4444-444444444444'),
  0, 'apply_run leaves lobby score unchanged');

-- completed party
create temp table r_done as
select public.apply_run('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000002',
  now() - interval '10 minutes', now(), 1000, 600, null, 'accepted', null, '[]') as res;
select is((select party_id from public.runs where id = (select (res ->> 'run_id')::uuid from r_done)), null,
  'apply_run ignores completed party');
select is((select score from public.party_members
           where party_id = 'aaaaaaaa-0000-0000-0000-000000000002' and user_id = '33333333-3333-3333-3333-333333333333'),
  0, 'apply_run leaves completed party score unchanged');

-- after ends_at (party lasts 30 minutes from now())
create temp table r_late as
select public.apply_run('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001',
  now(), now() + interval '31 minutes', 1000, 600, null, 'accepted', null, '[]') as res;
select is((select party_id from public.runs where id = (select (res ->> 'run_id')::uuid from r_late)), null,
  'apply_run ignores party after ends_at');
select is((select score from public.party_members
           where party_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = '22222222-2222-2222-2222-222222222222'),
  315, 'apply_run leaves score unchanged after ends_at and for non-members');

-- ---------------------------------------------------------------------------
-- Leaderboards and summary (as u1)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select results_eq(
  $$ select rank, user_id, score, is_host from public.get_party_leaderboard('aaaaaaaa-0000-0000-0000-000000000001') $$,
  $$ values (1::bigint, '22222222-2222-2222-2222-222222222222'::uuid, 315, false),
            (2::bigint, '11111111-1111-1111-1111-111111111111'::uuid, 0, true) $$,
  'get_party_leaderboard ranks by score');

select ok(exists (select 1 from public.get_leaderboard_nearby(9, 9, 11, 11)
                  where user_id = '22222222-2222-2222-2222-222222222222'),
  'get_leaderboard_nearby includes owners inside box');
select ok(not exists (select 1 from public.get_leaderboard_nearby(9, 9, 11, 11)
                      where user_id = '44444444-4444-4444-4444-444444444444'),
  'get_leaderboard_nearby excludes owners outside box');

select is((select cells_owned from public.player_summary('55555555-5555-5555-5555-555555555555')), 0,
  'player_summary cells_owned is 0 for a new user');
select is((select total_km from public.player_summary('55555555-5555-5555-5555-555555555555')), 0::double precision,
  'player_summary total_km is 0 for a new user');

-- ---------------------------------------------------------------------------
-- finish_party / leave_party
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok($$ select public.finish_party('aaaaaaaa-0000-0000-0000-000000000001') $$,
  'P0001', 'Party has not ended yet', 'finish_party by member before ends_at rejected');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is((public.finish_party('aaaaaaaa-0000-0000-0000-000000000001')).status, 'completed'::public.party_status,
  'finish_party by host completes anytime');
select is((public.finish_party('aaaaaaaa-0000-0000-0000-000000000001')).status, 'completed'::public.party_status,
  'finish_party is a no-op when already completed');

select public.leave_party((select id from public.parties where name = 'Morning crew'));
select ok(not exists (select 1 from public.parties where name = 'Morning crew'),
  'leave_party by host deletes a lobby party');

select * from finish();
rollback;
