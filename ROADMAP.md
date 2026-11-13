# run.io — 4-Week Roadmap to the DTI Demo

**Goal:** a working demo for the DTI evaluation. Real people run outside with real GPS, capture hex territory that is saved in a real backend, and see the results on a shared map, leaderboard and party screens.
**Team:** 3 people · **Timeline:** 4 weeks · **Stack decision:** Expo + Supabase (Postgres/PostGIS, Auth, Realtime) + H3 hex grid

---

## 1. Where the app is today (Nov 13, 2026)

Checked by running the web build and reading the code:

| Area | Status |
|---|---|
| Screens | Done: Home map, Explore, Run, Summary, Leaderboard, Profile, Player, Auth, Parties (list, create, join, lobby, live leaderboard, results) |
| Design system | Done: theme tokens, Button/Card/Input/Modal/BottomSheet/Avatar/Badge, `design.md` |
| Auth, run tracking, capture | **Live**: Supabase auth, real GPS (simulator behind `EXPO_PUBLIC_TRACKING_MODE`), H3 capture, server-validated `submit-run` |
| Parties, leaderboard, profile | **Live**: create/join by code, lobby, realtime standings, global/nearby/party leaderboards, real profile stats and achievements. Mock data is used only offline (map + run) |
| Tests | Jest unit tests (geo, H3, GPS filter, run scoring, adapters) and pgTAP (`npx supabase test db`) |
| Still open | Live opponent positions on the map, `party_wins` / wins stat and the two win-based achievements, background tracking, anti-cheat beyond `runScoring.ts`, push notifications |

**Summary:** the core loop and parties are live. What is left is the "still open" row above plus the on-device release test.

---

## 2. What the demo has to show (scope lock)

Must have (the evaluation depends on these):
1. Sign up / log in, then a profile with a name and territory colour.
2. Start a run → **real GPS** route drawn live → hex cells light up as you pass through them.
3. End the run → the server checks it and saves it → summary with real km, time, pace, cells captured and XP.
4. The home and explore maps show **everyone's** cells, coloured by owner. Running through a rival's cell **steals** it.
5. A leaderboard (global and per party) computed from real data.
6. Parties: create → share a code → friends join → lobby → timed challenge → live standings → results.
7. **A simulation-mode switch**, so the demo still works indoors or if GPS fails in the room.

Out of scope until after the evaluation: closed-loop capture, push notifications, chat and friends lists, store release, payments, advanced anti-cheat.

---

## 3. Technical design

### 3.1 Territory model: H3 hex grid
- Library: `h3-js`. It runs in plain JS; check early that it works in Hermes and add a `TextDecoder` polyfill if it doesn't.
- **Resolution 10:** about a 66 m hex edge and about 0.015 km² per cell. A 5 km run touches roughly 40–80 cells, which feels rewarding without filling the map.
- Capture rule (v1): a cell is captured when the runner has **≥ 2 valid GPS points inside it** during the run. The cell gets `owner = runner` and `captured_at = now`.
- Steal rule: same as capture. The latest valid run wins the cell. Optional extra: cells captured in the last 24 h are "fortified" and need 2 passes.
- Area shown in the UI is `cells × cellArea(res10)`. This replaces the `distance / 25000` placeholder.
- The client computes cells for **live feedback**. The **server recomputes them** from the raw points and its result counts.

### 3.2 GPS tracking
- `npx expo install expo-location expo-task-manager`.
- Foreground first: `watchPositionAsync` with `accuracy: BestForNavigation`, `distanceInterval: 5`, `timeInterval: 2000`.
- Filter points: drop any point with `accuracy > 25 m`, any jump that implies a speed above 25 km/h, and any point where Android reports `mocked: true`.
- Compute distance with haversine between filtered points. Use a rolling 30 s pace.
- Background tracking (screen locked) needs `expo-task-manager` and a **development build** (Expo Go can't do it). Planned for week 4. For the demo, keeping the screen on is acceptable.
- Keep the current simulator behind a `TrackingSource` interface (`real` | `simulated`) so both feed the same store.

### 3.3 Supabase schema (Postgres)
```sql
profiles      (id uuid pk -> auth.users, username text unique, color text, avatar_url, xp int, level int, created_at)
runs          (id uuid pk, user_id fk, party_id fk null, started_at, ended_at, distance_m, duration_s,
               cells_captured int, xp_earned int, route geography(LineString), status text)
cells         (h3 text pk, owner_id fk, captured_at timestamptz, run_id fk)
cell_history  (id bigserial, h3, from_owner, to_owner, run_id, at)        -- powers "stolen from" UI
parties       (id uuid pk, code text unique, host_id, name, mode text, max_players, duration_min,
               status text ('lobby'|'live'|'finished'), starts_at, ends_at)
party_members (party_id, user_id, joined_at, score int, pk(party_id,user_id))
leaderboard   VIEW: score = cells_owned*100 + total_km*10 + party_wins*250   (matches the current UI copy)
```
- **Row Level Security on every table.** Users can only write their own profile and runs. `cells` is written **only** by the `submit_run` function, never directly by the client.
- `submit_run(run_id, points jsonb)`: an Edge Function or Postgres RPC that re-filters the points, rejects runs averaging > 20 km/h, computes H3 cells, upserts `cells` and `cell_history`, awards XP, and updates the party score.
- Realtime: subscribe to `party_members` (lobby and live standings) and `cells`, filtered by visible area or just everything (the demo dataset is small).
- Map queries: fetch cells in the visible region with `h3.polygonToCells(viewportBounds, 10)`, then `select * from cells where h3 = any($1)`.

### 3.4 App architecture changes
- `src/lib/supabase.ts`: the client. Keys in `.env` as `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`; the anon key is safe on the client when RLS is on.
- `src/services/`: `auth.ts`, `runs.ts`, `cells.ts`, `parties.ts`. These are the only modules that talk to Supabase.
- Data fetching: add `@tanstack/react-query` for server data. Keep Zustand for local UI state and the live run.
- Replace `src/data/mock*.ts` one screen at a time. Keep the mocks as a dev seed or for offline mode.
- Routing: `src/app/(auth)/{welcome,login,register,setup}.tsx` and an auth guard in `_layout.tsx`.
- `TerritoryOverlays` renders H3 cells as `Polygon`s. Render **only cells in the viewport** and switch to a cluster or heat view when zoomed out, to keep `react-native-maps` fast.
- Android maps: add a Google Maps API key in `app.json → android.config.googleMaps.apiKey`, through a config plugin or env, never committed.

---

## 4. Week-by-week plan

Roles (swap names as you like; based on who did what in the git history):
- **A: Backend & data.** Supabase, schema, RLS, `submit_run`, leaderboard. *(suggested: Khushi)*
- **B: Run & territory engine.** GPS, filtering, H3, capture, run and summary screens. *(suggested: Geethika, who built the map and run components)*
- **C: App & social UX.** Auth screens, wiring screens to real data, parties and realtime, polish. *(suggested: Jalendu, who did the UI/UX pass)*

### Week 1 (Nov 16–22): Foundations
| Owner | Tasks | Done when |
|---|---|---|
| A | Create the Supabase project; write schema migrations (`supabase/migrations`); RLS policies; seed script with 5 fake players and cells around campus | `supabase db reset` builds everything; RLS tested with 2 users |
| B | Install `expo-location`; `useLocationTracker` hook with filtering; `TrackingSource` interface (real/simulated); `src/lib/h3.ts` (pointsToCells, cellArea, cellBoundary) with unit tests (Jest) | Walking around campus shows a real route and distance on the run screen |
| C | Auth screens (welcome, login, register, profile setup with colour pick); auth guard; `src/lib/supabase.ts`; replace the hard-coded "RunnerOne" profile with real data | New user signs up → lands on home with their name |
| All | Make an **EAS development build** (Android APK) so everyone tests on real phones; fix the README; agree on a branch → PR → review flow | Everyone has the dev build installed |

### Week 2 (Nov 23–29): Core loop (run → capture → map)
| Owner | Tasks | Done when |
|---|---|---|
| A | `submit_run` function (validate, compute cells, upsert ownership, history, XP); `cells_in_viewport` query | Posting a recorded run updates `cells` correctly, including steals |
| B | Live hex highlighting during the run (cells you've entered turn your colour); "territory in range" card uses the real cell and owner; end run → upload points → summary uses the server response | A real 1 km walk captures cells that appear on another phone's map |
| C | Home and Explore maps render real cells from Supabase, coloured by owner; tap a cell → bottom sheet (owner, captured at, "stolen from"); profile stats and activity history from `runs` | No mock data left on Home, Explore or Profile |

### Week 3 (Nov 30 – Dec 6): Social & competition
| Owner | Tasks | Done when |
|---|---|---|
| A | Leaderboard view (global and nearby by region); party scoring (cells captured during the party window); party lifecycle (lobby → live → finished) via `starts_at`/`ends_at` | Leaderboard numbers match a hand calculation |
| B | Party run mode: runs started inside a live party are tagged with `party_id`; live score updates while running; nearby players (opt-in, last-known position, only while running) | Two people in a live party see each other's scores move |
| C | Wire the party screens: create (generate a 6-char code), join with code, lobby with realtime member list, live leaderboard, results; leaderboard screen on real data | A full party round works end to end on 3 phones |

### Week 4 (Dec 7–13): Hardening & demo
| Owner | Tasks | Done when |
|---|---|---|
| A | Basic anti-cheat flags (speed, mocked location, teleport jumps) → run marked `rejected`; DB backups; indexes on `cells.owner_id`, `runs.user_id` | A fake 50 km/h run is rejected |
| B | Background tracking with `expo-task-manager` (screen-off runs); battery and accuracy tuning; GPS-lost and permission-denied states | A 15-min run with the screen locked records correctly |
| C | Loading, empty and error states on every screen; onboarding tips; simulation-mode toggle in settings for the demo; performance pass on map rendering | No blank screens or crashes on a bad network |
| All | **Demo prep:** seed a believable campus map; write a 5-minute demo script; record a backup video; test on 3+ devices; final APK via EAS; slides covering problem → solution → architecture → live demo → future work | Full dry run done twice |

Buffer: keep the last 2–3 days of week 4 free. Something always slips.

---

## 5. Ways of working
- **Branches:** `feat/<area>-<thing>`. Open small PRs into `main`; each needs 1 reviewer; keep `main` always demo-able.
- **Before every PR:** `npx tsc --noEmit` and `npx expo lint` (as `AGENTS.md` already requires) and `npm test` for the H3 and capture logic.
- **Weekly:** 15-minute sync on Sunday (demo what's merged, re-plan the next week). Track tasks as GitHub Issues with a project board (Todo / Doing / Review / Done).
- **Secrets:** `.env` in `.gitignore`; share a `.env.example`.
- **Housekeeping:** upgrade Node to ≥ 24.3 (npm warns that a dependency needs it); run `npm audit` (8 moderate issues).

---

## 6. Risks & mitigations
| Risk | Mitigation |
|---|---|
| GPS doesn't work indoors during the evaluation | Simulation toggle + pre-recorded runs + backup video |
| Expo Go can't do background location or custom native modules | Use an EAS dev build from week 1 |
| `h3-js` problems on Hermes | Test on day 1; fall back to a server-only H3 (PostGIS `h3` extension) with simple squares on the client |
| Map slows down with many polygons | Viewport-only queries, cap rendered cells, simpler view when zoomed out |
| GPS drift creates fake captures | Accuracy filter + ≥ 2 points per cell + server recompute |
| Location privacy | Share live position only during runs and only with opt-in; store routes privately (RLS: owner only) |
| Teammate blocked on another's work | Week 1 sets up interfaces (`services/*`, `TrackingSource`) so mocks can stand in until the real thing lands |

---

## 7. After the evaluation (if you continue)
Closed-loop "enclosure" captures · territory decay/defence · push notifications ("your cell was stolen") · friends & clubs · seasons with rewards · Strava/Health Connect import · iOS TestFlight and Play Store internal testing · stronger anti-cheat (accelerometer cadence checks).
