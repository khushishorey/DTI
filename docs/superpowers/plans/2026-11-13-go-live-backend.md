# Go-Live Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every remaining mock-data path in run.io with live Supabase data, and put every environment variable and secret the live app needs in the right place.

**Architecture:** Weeks 1–2 are already live: auth, `submit-run` Edge Function → `apply_run()`, `cells_in_bounds()`, `my_stats()`, `get_leaderboard()` (SQL only, no client yet). What is still mock: parties (pure Zustand), all three leaderboard tabs, nearby players, player profile, achievements, and the `?? MOCK_*` fallbacks on Home/Explore/Profile. This plan adds one migration (party RPCs, party scoring inside `apply_run`, `player_summary`, nearby leaderboard), thin services + react-query hooks + pure adapters (unit-tested), wires the screens, and keeps the offline demo mode (no keys) as the only place mocks are used.

**Tech Stack:** Expo SDK 58, Expo Router, Supabase (Postgres, Auth, Realtime, Edge Functions/Deno), `@supabase/supabase-js`, `@tanstack/react-query`, Zustand, Jest (`jest-expo`), pgTAP (`supabase test db`).

**Spec:** [ROADMAP.md](../../../ROADMAP.md) §3.3–3.4 and weeks 3–4, [design.md](../../../design.md), [README.md](../../../README.md). Existing schema: `supabase/migrations/20261113000000_initial_schema.sql`, `20261116000000_core_loop.sql`.

## Global Constraints

- Expo SDK `~58`: before touching any Expo/EAS API, read `https://docs.expo.dev/versions/v58.0.0/` (AGENTS.md rule). Install packages only via `npx expo install`.
- `src/services/*` are the only modules that talk to Supabase; screens use hooks in `src/hooks/useServerData.ts` (ROADMAP §3.4).
- Clients never write `cells`, `runs`, `party_members.score`, or `profiles.xp` directly; only security-definer RPCs / `submit-run` do (ROADMAP §3.3).
- RLS stays enabled on every table; new RPCs `revoke ... from public, anon` and `grant ... to authenticated` (pattern in `core_loop.sql`).
- Leaderboard score formula (matches existing UI copy): `cells_owned*100 + floor(total_km*10)`. Party score formula: `cells_new*100 + cells_stolen*100 + floor(distance_m/100)` per accepted run inside the party window.
- Party enum values are exactly `lobby | in_progress | completed`; game modes `territory_control | distance_race | king_of_the_hill`; party code matches `^[A-Z0-9]{6}$`.
- Secrets: `EXPO_PUBLIC_*` values are bundled into the app and public. The service-role key, DB password, access tokens and Google Maps key never get an `EXPO_PUBLIC_` prefix and never get committed.
- Before every commit: `npm run typecheck && npm run lint && npm test` pass.
- Branch flow: one branch per task `feat/live-<thing>`, small PRs into `main` (ROADMAP §5).

## Environment Variable Reference (what "required" means)

| Name | Where it lives | Required? | Used by |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` locally; EAS env var (all profiles) | **Yes** | `src/lib/supabase.ts` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same | **Yes** (public, safe because of RLS) | `src/lib/supabase.ts` |
| `EXPO_PUBLIC_TRACKING_MODE` (`real`\|`simulated`) | `.env`; EAS `preview` profile may set `simulated` for demo APKs | Optional | `src/lib/tracking/sources.ts` |
| `GOOGLE_MAPS_ANDROID_API_KEY` | `.env` (read by `app.config.ts` at build time, **not** `EXPO_PUBLIC_`); EAS secret | **Yes for Android builds** (map is blank without it) | `app.config.ts` → `android.config.googleMaps.apiKey` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected into Edge Functions by Supabase | Nothing to set | `supabase/functions/submit-run/index.ts` |
| `SUPABASE_ACCESS_TOKEN` | Your shell / CI only (`npx supabase login` or CI secret) | Needed to deploy | Supabase CLI |
| `SUPABASE_DB_PASSWORD` | Your shell / CI only | Needed for `db push` | Supabase CLI |
| `EXPO_TOKEN` | CI only | Only if building from CI | EAS CLI |

## Review Focus

1. A player calls `submit-run` with a `partyId` of a party they are not in, or one that is `lobby`/`completed`: the run must still count for the leaderboard but must not touch any party score.
2. Two players join the last open slot in a party at the same moment: only one succeeds, the other gets "party is full".
3. `join_party` with a lowercase / padded code, an unknown code, or a `completed` party: clear error, no membership row.
4. A non-host calls `start_party`; the host calls it on a party that is already live: both rejected.
5. A brand-new account with zero runs, zero cells, no party: Profile, Leaderboard, Home show empty states, not crashes or `NaN`.

---

## File Structure

- Create `supabase/migrations/20261120000000_parties_live.sql` — all new SQL.
- Create `supabase/tests/parties_live.test.sql` — pgTAP tests for it.
- Create `src/services/parties.ts`, `src/services/leaderboard.ts`, `src/services/players.ts` — Supabase calls + row→UI adapters.
- Create `src/lib/__tests__/liveAdapters.test.ts` — adapter + achievements tests (same pattern as `adapters.test.ts`).
- Create `src/lib/achievements.ts` — pure `deriveAchievements(stats)`.
- Create `src/hooks/useParties.ts` — party queries, mutations, realtime subscription.
- Create `app.config.ts` (replaces `app.json`), `eas.json`; env docs live in `.env.example` + README.
- Modify `src/stores/usePartyStore.ts` (shrink to `activePartyId` only), `src/hooks/useServerData.ts`, `src/hooks/useRunSubmission.ts`, `src/services/runs.ts`, screens under `src/app/parties/*`, `src/app/leaderboard.tsx`, `index.tsx`, `explore.tsx`, `profile.tsx`, `player/[id].tsx`, `src/components/map/MapHomeView*.tsx`.
- Delete at the end: `src/data/mockParties.ts`, `mockLeaderboard.ts`, `mockPlayers.ts`; trim `mockProfile.ts`, `mockTerritories.ts` to what offline mode needs.

---

### Task 1: Environment and secrets foundation

**Files:**
- Modify: `.gitignore`, `.env.example`
- Create: `app.config.ts`, `eas.json`
- Delete: `app.json` (content moves into `app.config.ts`)
- Modify: `README.md` (env section)

**Interfaces:**
- Produces: `app.config.ts` default export `ExpoConfig` factory; env names exactly as in the table above.

- [ ] **Step 1: Stop `.env` from being committable.** `.gitignore` currently only ignores `.env*.local`, contradicting ROADMAP §5. Add lines `.env` and `.env.*` followed by `!.env.example`. Verify: `git check-ignore -v .env` prints the rule; `git check-ignore .env.example` prints nothing.
- [ ] **Step 2: Read** `https://docs.expo.dev/versions/v58.0.0/config/app/` and the EAS env-variable docs linked from `https://docs.expo.dev/llms.txt`. Note the current syntax for dynamic config and `eas env:create`.
- [ ] **Step 3: Create `app.config.ts`** exporting `({ config }: ConfigContext): ExpoConfig`, containing everything currently in `app.json` (including the uncommitted `expo-status-bar` / `expo-web-browser` plugins) plus `android: { ..., config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY } } }`. Then `git rm app.json`. Verify: `npx expo config --type public` prints the same plugins/scheme as before and `android.config.googleMaps.apiKey` equals the env value (run once with the var set, once unset → `undefined`, no crash).
- [ ] **Step 4: Rewrite `.env.example`** listing every name from the Environment table that belongs in `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_TRACKING_MODE`, `GOOGLE_MAPS_ANDROID_API_KEY`), one comment line each saying where to get it and whether it is public. Never put the service-role key here.
- [ ] **Step 5: Create `eas.json`** with profiles `development` (`developmentClient: true`, `distribution: internal`), `preview` (`distribution: internal`, Android `buildType: apk`, `env: { EXPO_PUBLIC_TRACKING_MODE: "real" }`), `production`. Do not inline Supabase values; `.env` is gitignored so EAS cannot see it.
- [ ] **Step 6: README** — replace the "Connect the backend" env bullet with: copy `.env.example`; for builds run `npx eas-cli@latest env:create` for `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (visibility `plaintext`/`sensitive` per the docs you read) and `GOOGLE_MAPS_ANDROID_API_KEY` (visibility `secret`).
- [ ] **Step 7: Verify and commit.** Run `npm run typecheck && npm run lint && npm test`; then
```bash
git add .gitignore .env.example app.config.ts eas.json README.md
git rm app.json
git commit -m "chore: env handling, dynamic app config, EAS profiles"
```

---

### Task 2: Stand up the live Supabase project and prove the existing loop

No code. Needs a human with the Supabase and Google Cloud accounts; do these manually and record results in the PR description.

**Files:** none (writes your local `.env`).

- [ ] **Step 1: Create the project** at supabase.com (region nearest the campus). Save the DB password in a password manager.
- [ ] **Step 2: Fill `.env`** with Project URL and anon key (Project Settings → API). Never use the `service_role` key here.
- [ ] **Step 3: Link and push schema.**
```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase functions deploy submit-run
```
Expected: both migrations applied; function listed under Edge Functions. (`SUPABASE_*` function secrets are injected automatically; set none.)
- [ ] **Step 4: Auth settings** (Dashboard → Authentication): Email provider on; **Confirm email OFF** for the demo (README says so); URL Configuration → Site URL `runio://`, add redirect `runio://**`.
- [ ] **Step 5: Android map key.** In Google Cloud enable "Maps SDK for Android", create a key restricted to the Android app package + SHA-1 of the EAS keystore; put it in `.env` as `GOOGLE_MAPS_ANDROID_API_KEY` and in EAS as a secret.
- [ ] **Step 6: Decide on demo seed.** `supabase/seed.sql` creates 4 auth users with the known password `runio-demo-123`. Only push it (`npx supabase db push --include-seed`) to a throwaway/demo project, never one with real users; otherwise the map starts empty.
- [ ] **Step 7: Smoke test** with `EXPO_PUBLIC_TRACKING_MODE=simulated npx expo start --web`: register → set username → start run → finish → Summary shows server-computed cells/XP; Dashboard Table Editor shows rows in `runs`, `cells`, `cell_history`; a second account running the same route shows `cells_stolen > 0`. Expected: all of that works before any new code is added. If it does not, fix it first; later tasks assume it.

---

### Task 3: Party and leaderboard SQL (migration + pgTAP)

**Files:**
- Create: `supabase/migrations/20261120000000_parties_live.sql`
- Test: `supabase/tests/parties_live.test.sql`

**Interfaces — Produces (SQL, all `security definer set search_path = ''`, granted to `authenticated` only unless noted):**
- `alter table party_members add column cells_captured integer not null default 0, add column distance_m real not null default 0;`
- `create_party(p_name text, p_visibility party_visibility, p_game_mode party_game_mode, p_duration_minutes integer, p_max_participants integer) returns public.parties` — generates a unique 6-char `[A-Z0-9]` code (retry on collision), inserts the party with `host_id = auth.uid()`, inserts the host into `party_members`.
- `join_party(p_code text) returns public.parties` — `upper(btrim(p_code))`; errors (use `raise exception` with these exact messages): `'Party not found'`, `'Party has ended'` (status `completed`), `'Party is full'`; idempotent if already a member; locks the party row (`for update`) so the capacity check is race-free.
- `leave_party(p_party_id uuid) returns void` — deletes own membership; host leaving a `lobby` party deletes the party.
- `start_party(p_party_id uuid) returns public.parties` — host only (`'Only the host can start'`), only from `lobby` (`'Party already started'`), needs ≥ 2 members (`'Need at least 2 runners'`); sets `status='in_progress'`, `started_at=now()`, `ends_at=now()+duration_minutes`.
- `finish_party(p_party_id uuid) returns public.parties` — allowed when `now() >= ends_at` for any member, or anytime for host; sets `completed`; no-op if already completed.
- `get_party_leaderboard(p_party_id uuid) returns table (rank bigint, user_id uuid, username text, color text, avatar_url text, score integer, cells_captured integer, distance_m real, is_host boolean)` — ordered by score desc, `rank()`.
- `get_leaderboard_nearby(min_lat double precision, min_lng double precision, max_lat double precision, max_lng double precision, max_rows integer default 50)` — same columns as `get_leaderboard`, restricted to users owning ≥1 cell whose center is in the box.
- `player_summary(p_user_id uuid) returns table (user_id uuid, username text, color text, avatar_url text, level integer, xp integer, cells_owned integer, total_km double precision, run_count integer, joined_at timestamptz)` — bypasses `runs` RLS for aggregates only, never returns routes.
- `create or replace function public.apply_run(...)` with the **same signature** as today, plus, after the existing XP block: if `p_party_id` is not null **and** the user is a member **and** the party is `in_progress` **and** `p_ended_at` is between `started_at` and `ends_at`, then `update party_members set score = score + (v_new+v_stolen)*100 + floor(p_distance_m/100), cells_captured = cells_captured + v_new + v_stolen, distance_m = distance_m + p_distance_m`. Otherwise silently ignore the party id and store `party_id = null` on the run.

- [ ] **Step 1: Write the failing pgTAP file** `supabase/tests/parties_live.test.sql` (`begin; select plan(N); ... select * from finish(); rollback;`), creating two users via `insert into auth.users` and `set local role authenticated; set local request.jwt.claims ...` per Supabase's pgTAP docs. Tests, by name and assertion:
  - `join_party is case/space insensitive`: `join_party(' ab12cd ')` joins party coded `AB12CD`.
  - `join_party rejects full party`: capacity 2 with 2 members → `throws_ok(..., 'Party is full')`.
  - `join_party rejects unknown code` → `'Party not found'`; rejects `completed` → `'Party has ended'`.
  - `start_party non-host rejected` → `'Only the host can start'`; `start_party twice` → `'Party already started'`; with 1 member → `'Need at least 2 runners'`.
  - `apply_run scores party member`: live party, accepted run with 3 new cells, 1500 m → member `score = 315`, `cells_captured = 3`.
  - `apply_run ignores party for non-member / lobby / completed / after ends_at`: score unchanged and `runs.party_id is null`.
  - `get_leaderboard_nearby excludes owners outside box`; `player_summary` returns `cells_owned = 0, total_km = 0` for a new user (not null).
- [ ] **Step 2: Run to confirm failure.** `npx supabase start` (needs Docker) then `npx supabase test db`. Expected: FAIL — functions do not exist.
- [ ] **Step 3: Write the migration** implementing the signatures above. Add `alter publication supabase_realtime add table public.party_members` is already done in the initial schema — do not repeat it. Add `create index party_members_user_idx on public.party_members (user_id)`. `revoke execute ... from public, anon; grant execute ... to authenticated` for each new function. Drop the direct client write paths that bypass the RPCs: `drop policy "users create parties they host" on public.parties; drop policy "users join parties as themselves" on public.party_members;` (keep select/delete/update policies as they are).
- [ ] **Step 4: Run** `npx supabase db reset && npx supabase test db`. Expected: all PASS.
- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/20261120000000_parties_live.sql supabase/tests/parties_live.test.sql
git commit -m "feat(db): party RPCs, party scoring in apply_run, nearby leaderboard, player summary"
```
- [ ] **Step 6: Push to the live project** after review: `npx supabase db push`. Expected: new migration listed as applied. (Do this only after the PR merges so the hosted DB never runs unreviewed SQL.)

---

### Task 4: Services, adapters and hooks for parties, leaderboards, players

**Files:**
- Create: `src/services/parties.ts`, `src/services/leaderboard.ts`, `src/services/players.ts`, `src/lib/achievements.ts`, `src/hooks/useParties.ts`
- Modify: `src/hooks/useServerData.ts` (add keys + hooks), `src/stores/usePartyStore.ts`
- Test: `src/lib/__tests__/liveAdapters.test.ts`

**Interfaces:**
- Consumes: SQL from Task 3; `Party`, `PartyParticipant` (`src/types/party.ts`), `LeaderboardEntry` (`src/types/user.ts`), `requireSupabase()`.
- Produces:
  - `parties.ts`: `fetchParties(): Promise<Party[]>` (select `parties` + `party_members(profiles(...))` embedded); `createParty(input: CreatePartyInput): Promise<Party>` → rpc `create_party`; `joinPartyByCode(code: string): Promise<Party>`; `leaveParty(id: string): Promise<void>`; `startParty(id: string): Promise<Party>`; `finishParty(id: string): Promise<Party>`; pure `partyFromRows(row: PartyRow, members: MemberRow[]): Party` (maps `started_at`/`ends_at` ISO → epoch ms, `host_id` → `isHost`, `distance_m/1000`, `territoryCapturedKm2 = cells_captured * cellArea` where the per-cell area comes from h3-js `getHexagonAreaAvg(10, 'km2')`).
  - `leaderboard.ts`: `fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]>`, `fetchNearbyLeaderboard(bounds: Bounds)`, `fetchPartyLeaderboard(partyId: string)`; pure `leaderboardFromRows(rows: LeaderboardRow[], myUserId?: string): LeaderboardEntry[]` (sets `isCurrentUser`, `distanceKm = total_km`, `territoryCapturedKm2 = cells_owned * cellArea`).
  - `players.ts`: `fetchPlayer(id: string)` → `player_summary`; `nearbyRunnersFromTerritories(territories: Territory[], myUserId?: string): NearbyRunner[]` (pure; `{ id, username, color, cellCount }`, excludes me, sorted by `cellCount` desc).
  - `achievements.ts`: `deriveAchievements(stats: MyStats): PlayerAchievement[]` — exactly four: `first-stride` (runCount ≥ 1), `groundbreaker` (areaOwnedKm2 ≥ 1), `explorer` (cellsOwned ≥ 25), `ultra-runner` (totalDistanceKm ≥ 500, `progress` string like `"286 / 500 km"` when locked).
  - Hooks in `useServerData.ts`: `useGlobalLeaderboard()`, `useNearbyLeaderboard(bounds)`, `usePartyLeaderboard(partyId)`, `usePlayer(id)`; `useParties.ts`: `useParties()`, `useParty(id)`, `useCreateParty()`, `useJoinParty()`, `useStartParty()`, `useFinishParty()`, `useLeaveParty()` (mutations invalidate `queryKeys.parties`), and `usePartyRealtime(partyId?: string)` subscribing to `postgres_changes` on `party_members` and `parties` (filter `party_id=eq.<id>` / `id=eq.<id>`) and invalidating `queryKeys.party(id)` + `queryKeys.partyLeaderboard(id)`; unsubscribes on unmount.
  - `usePartyStore` becomes `{ activePartyId: string | null; setActivePartyId(id: string | null): void }` — remove all mock logic (`createParty`, `startCompetition`, `makePartyCode`, mock runners).

- [ ] **Step 1: Write failing tests** in `src/lib/__tests__/liveAdapters.test.ts`:
  - `partyFromRows maps host, scores and epoch times`: input with `started_at: '2026-11-20T10:00:00Z'` → `startedAt === Date.parse(...)`, host member has `isHost: true`, `distanceCoveredKm === 1.5` for `distance_m: 1500`.
  - `partyFromRows handles party with no startedAt` → `startedAt` and `endsAt` are `undefined`.
  - `leaderboardFromRows flags current user and handles empty list` → `[]` for `[]`; entry with matching `user_id` has `isCurrentUser: true`.
  - `nearbyRunnersFromTerritories counts cells per owner, excludes me, sorts desc`.
  - `deriveAchievements for a zero-stat player` → none unlocked, no `NaN` in any `progress`; `deriveAchievements` unlocks `first-stride` at `runCount: 1`.
- [ ] **Step 2: Run** `npx jest src/lib/__tests__/liveAdapters.test.ts`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** the pure functions first (`partyFromRows`, `leaderboardFromRows`, `nearbyRunnersFromTerritories`, `deriveAchievements`) to pass the tests; then the thin Supabase wrappers (each: call → `if (error) throw error` → adapt; map `error.message` unchanged so the SQL messages `'Party is full'` etc. reach the UI).
- [ ] **Step 4: Run** `npx jest` — all pass; `npm run typecheck` clean.
- [ ] **Step 5: Add hooks and shrink `usePartyStore`.** Typecheck will list every screen still using the old store API — leave those errors for Task 5; commit only when green, so do Steps 5–6 together with Task 5's edits on the same branch if needed (one PR: "party backend + wiring").
- [ ] **Step 6: Commit**
```bash
git add src/services src/lib src/hooks src/stores
git commit -m "feat: live services and hooks for parties, leaderboards, players"
```

---

### Task 5: Wire the party flow end to end

**Files:**
- Modify: `src/app/parties/{index,create,join,lobby,leaderboard,results}.tsx`, `src/services/runs.ts`, `src/hooks/useRunSubmission.ts`, `src/app/run.tsx` (only if it owns the start action)
- Test: add to `liveAdapters.test.ts` where logic is pure; screens verified manually (Step 6).

**Interfaces:**
- Consumes: Task 4 hooks; `useAuthStore` session id replaces `CURRENT_PLAYER_ID`.
- Produces: `submitRun(session, partyId)` is already parameterised; `uploadFinishedRun` must read `usePartyStore.getState().activePartyId` **only when that party's status is `in_progress`** (look it up from the react-query cache via `queryClient.getQueryData(queryKeys.party(id))`), else pass `null`. Invalidate `queryKeys.partyLeaderboard(id)` and `queryKeys.party(id)` after a saved run.

- [ ] **Step 1: `index.tsx` and `join.tsx`** — replace `usePartyStore((s) => s.parties)` with `useParties()`; membership check becomes `party.participants.some(p => p.id === myUserId)`; show loading and an empty state ("No parties yet — create one") and an error state with retry. Joining calls `useJoinParty().mutateAsync(code)` and shows the thrown message (`Party is full`, `Party not found`, `Party has ended`) in the existing error slot; success calls `setActivePartyId` and routes to `/parties/lobby`.
- [ ] **Step 2: `create.tsx`** — submit via `useCreateParty()`; on success `setActivePartyId(party.id)` and route to lobby; the 6-char code shown is `party.code` from the server.
- [ ] **Step 3: `lobby.tsx`** — read `useParty(activePartyId)`, call `usePartyRealtime(activePartyId)` so the member list updates live; host "Start" calls `useStartParty()` (disabled with the server's message when < 2 runners); non-hosts see a waiting state; when `status` flips to `in_progress` anyone on the lobby routes to `/parties/leaderboard`.
- [ ] **Step 4: `parties/leaderboard.tsx`** — standings from `usePartyLeaderboard(id)` + `usePartyRealtime(id)`; countdown from `party.endsAt`; when it reaches 0 call `useFinishParty()` once (guard with a ref), then route to results. Remove `completeCompetition` and the mock-runner logic.
- [ ] **Step 5: `results.tsx`** — final standings from `usePartyLeaderboard`; "Done" clears `activePartyId`. **`useRunSubmission`/`submitRun`**: pass the live party id as specified in Interfaces.
- [ ] **Step 6: Manual verification on two accounts** (two browsers or web + phone): A creates, B joins by code (lowercase works), lobby shows B within ~2 s without refresh; A starts; both run the simulated route; party standings move after each run's submission; A's countdown ends → both see results; a third attempt to join shows "Party has ended". Expected: all of the above.
- [ ] **Step 7: Verify and commit**: `npm run typecheck && npm run lint && npm test`, then
```bash
git add -A src
git commit -m "feat: live parties — create/join/lobby/live standings/results, party-tagged runs"
```

---

### Task 6: Live leaderboard screen

**Files:**
- Modify: `src/app/leaderboard.tsx`, `src/components/leaderboard/LeaderboardPodium.tsx` / `LeaderboardEntryRow.tsx` only if they assume ≥ 3 entries.

**Interfaces:** Consumes `useGlobalLeaderboard`, `useNearbyLeaderboard(bounds)`, `usePartyLeaderboard(id)`.

- [ ] **Step 1: Replace the three mock sources.** `global` → `useGlobalLeaderboard()`; `nearby` → `useNearbyLeaderboard(bounds)` using `snapBounds(DEMO_BOUNDS)` until a real device region is available (use the last map bounds if the store has one); `party` → `usePartyLeaderboard(activePartyId)` and show "Join a party to see standings" when there is none (remove the `MOCK_PARTIES[0]` fallback).
- [ ] **Step 2: States.** Loading skeleton/spinner, empty list ("No runners here yet"), error with retry. Make sure the podium renders with 0, 1 or 2 entries (Review Focus 5).
- [ ] **Step 3: Verify** with a fresh account (empty everything) and with the seeded players: global ranks match the SQL (`cells_owned*100 + floor(km*10)`) for a hand-checked user; no `NaN`. Run `npm run typecheck && npm run lint && npm test`.
- [ ] **Step 4: Commit** `git commit -am "feat: live leaderboard (global, nearby, party)"`.

---

### Task 7: Remove mocks from Home, Explore, Player and Profile

**Files:**
- Modify: `src/app/{index,explore,profile}.tsx`, `src/app/player/[id].tsx`, `src/components/map/MapHomeView.tsx`, `MapHomeView.web.tsx`, `src/data/mockProfile.ts`

**Interfaces:** Consumes `nearbyRunnersFromTerritories`, `usePlayer`, `deriveAchievements`, `useMyStats`.

- [ ] **Step 1: Home + Explore "nearby" lists** — build `NearbyRunner[]` from the already-fetched `territories` (no location tracking, no privacy exposure). Drop `isOnline`/`distanceFromUserMeters` UI; show "N cells" instead. When signed in and `territories` is `null`/empty show an empty state; never fall back to `MOCK_*` when `status !== 'offline'`. Gate every remaining mock import on `useAuthStore(s => s.status) === 'offline'`.
- [ ] **Step 2: `MapHomeView*.tsx`** — remove default props `territories = MOCK_TERRITORIES` / `players = MOCK_NEARBY_PLAYERS`; callers pass data explicitly (default `[]`). `PlayerMarkers` renders nothing when no players are passed (live positions are out of scope; ROADMAP marks them opt-in).
- [ ] **Step 3: `player/[id].tsx`** — `usePlayer(id)` for username/level/cells/km/runs; territories from `useTerritoriesInBounds` filtered by `ownerId === id`; own id → redirect to Profile. Unknown id shows "Runner not found".
- [ ] **Step 4: `profile.tsx`** — drop `...MOCK_PROFILE` spread when signed in; `winsCount` card hidden until wins are tracked (no live source yet); achievements from `deriveAchievements(stats)` (all-locked when `stats` is undefined); `xp` fallback `2480` only in offline mode.
- [ ] **Step 5: Verify** — `grep -rn "MOCK_\|data/mock" src/app src/components` returns only lines inside an `offline` guard. Sign in with a zero-data account and open Home, Explore, Profile, Leaderboard, Parties: no crash, no mock names (`RunnerOne`, `GhostStride`) visible unless you are actually that seeded user.
- [ ] **Step 6: Commit** `git commit -am "feat: remove mock fallbacks when signed in; live nearby, player, achievements"`.

---

### Task 8: Cleanup, docs, and release build

**Files:** Delete `src/data/mockParties.ts`, `mockLeaderboard.ts`, `mockPlayers.ts` (offline mode no longer needs party/leaderboard mocks — offline Parties/Leaderboard screens show "Sign in to play with others"); keep `mockRunRoute.ts` (tracking simulator) and the minimum of `mockTerritories.ts`/`mockProfile.ts` for offline Home/Profile. Modify `src/data/index.ts`, `README.md`, `ROADMAP.md` status table.

- [ ] **Step 1: Delete and fix imports** until `npm run typecheck` is clean; offline screens render the sign-in prompt.
- [ ] **Step 2: README** — update "Quick start" (offline mode now covers map + run only), env table from this plan, "How a run is saved" mention of party scoring, and the `supabase test db` command. Update ROADMAP §1 status table to reflect parties/leaderboard live.
- [ ] **Step 3: Full check** `npm run typecheck && npm run lint && npm test && npx supabase test db`. Expected: all green.
- [ ] **Step 4: Release APK.** Set EAS env vars (Task 1 Step 6), then `npx eas-cli@latest build --profile preview --platform android`. Install on 2+ phones; repeat the Task 5 Step 6 scenario with real GPS outdoors, plus airplane-mode finish → "failed" state with retry works.
- [ ] **Step 5: Commit** `git add -A && git commit -m "chore: drop mock data paths, document live setup"`.

---

## Self-review notes

- **Spec coverage:** ROADMAP must-haves 1–5 already live (Task 2 verifies); 6 (parties) → Tasks 3, 5; leaderboard global/party → Tasks 3, 4, 6; "nearby" → Tasks 3, 6, 7; simulation switch → `EXPO_PUBLIC_TRACKING_MODE` kept (Task 1). Env/secrets → Task 1 + table.
- **Deliberately not in this plan** (ROADMAP weeks 3–4 / out of scope): live opponent GPS positions, `party_wins`/competition-wins stat and the two win-based achievements, background tracking, anti-cheat beyond what `runScoring.ts` has, push notifications, closed-loop capture.
- **Type consistency:** `NearbyRunner`, `partyFromRows`, `leaderboardFromRows`, `deriveAchievements`, `activePartyId` names are used identically across Tasks 4–7.
