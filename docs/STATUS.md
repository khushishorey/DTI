# run.io — Project Status

_Last updated: 2026-11-13. Companion to [ROADMAP.md](../ROADMAP.md) (the plan) and [README.md](../README.md) (setup)._

**MVP means the DTI demo** (see ROADMAP §2): real people run outside with real GPS, capture hex territory saved in a real backend, and see it on a shared map, leaderboard and party screens.

**The honest summary:** the app is code-complete for the MVP feature set, and typecheck + 48 jest tests + 46 database tests pass. But **nothing has been run against a real hosted Supabase project or on a real phone yet.** Expect bugs on first contact. The next step is deployment and a live test, not more features.

---

## 1. What has been done

### Foundations (weeks 1–2, earlier commits)
- Expo SDK 58 app with Expo Router, Zustand, react-query, full design system ([design.md](../design.md)).
- Auth: get-started, register, login, profile setup (username + territory colour), auth guard.
- GPS tracking with filtering (accuracy, speed, mocked-location), simulated route mode for indoor demos, haversine distance.
- H3 territory model (`h3-js`, resolution 10): cells, outlines, areas, capture rule (≥ 2 valid points in a cell).
- Supabase schema: `profiles`, `runs`, `cells`, `cell_history`, `parties`, `party_members`; Row Level Security on every table; realtime enabled for `cells`, `parties`, `party_members`.
- `submit-run` Edge Function + `apply_run()`: the server re-validates every run, computes cells itself, handles steals, history and XP in one transaction. Clients never write runs or cells directly.
- Real home/profile data: `cells_in_bounds()`, `my_stats()`, recent runs.

### Go-live work (this session, 12 commits on top)
| Area | What was built |
|---|---|
| **Env & config** | `.env` is now gitignored (it wasn't); `.env.example` documents every variable; `app.config.ts` replaces `app.json`; `eas.json` with development / preview / production profiles; README env table. |
| **Party backend** | New migration `20261120000000_parties_live.sql`: `create_party`, `join_party` (race-safe, case/space-insensitive code), `leave_party`, `start_party` (host only, ≥ 2 runners), `finish_party`, `get_party_leaderboard`, `get_leaderboard_nearby`, `player_summary`. |
| **Party scoring** | `apply_run` credits a party only if the runner is a member, the party is `in_progress` and the run ended inside its window; otherwise the run still counts globally. Score = `cells×100 + floor(distance_m/100)`. A malformed party id is ignored instead of losing the run. |
| **Database security** | Hosts can no longer edit party status/times directly (column grant to `name`, `visibility` only). Private parties and their codes are visible only to members and the host. 46 pgTAP tests cover all of it. |
| **Client data layer** | Services + react-query hooks + tested adapters for parties, leaderboards, player profiles; derived achievements; realtime subscription with a unique channel per screen mount. |
| **Screens made live** | Party list / create / join / lobby (realtime member list) / live standings / results; global, nearby and party leaderboards; player profile; nearby runners; achievements; Home, Explore, Profile. Runs are tagged with the active live party. Auto-finish at party end retries on failure with a visible RETRY. |
| **Mocks removed** | Online users never see mock data. Mocks remain only when no Supabase keys are set (offline demo mode for map + run). |
| **Free maps** | Google Maps removed (it needs a billing-enabled Google Cloud key on Android). Replaced by **MapLibre + OpenFreeMap tiles: no API key, no billing**. Home map now asks for location, follows live GPS, shows a user dot and accuracy ring, and has a working recenter button. Run map follows the runner live. Territories render as one GeoJSON layer instead of one view per hex. |
| **Expo Go safety** | MapLibre is a native module missing from Expo Go. The app detects that and shows the SVG preview map instead of crashing. A development build is needed for the real map. |
| **Process** | Built via subagent-driven development: each task implemented, then reviewed for spec + quality, then a final whole-branch review that found and fixed 4 real bugs (UI duration limits the DB rejected, realtime channel reuse that would freeze live standings, active party surviving sign-out, private party codes readable by everyone). |

### Uncommitted edits made by you before this commit (included in it)
- `app.config.ts`: Android `package: com.dti.runio`.
- `package.json`: `android` / `ios` scripts now run `expo run:android` / `expo run:ios` (development build).

### Is H3 usable?
Yes, and it is already in use. `h3-js` runs in plain JS, is independent of the map provider (MapLibre only draws the outlines H3 returns), and is covered by tests. It has **not yet been confirmed on a real Hermes/Android runtime**; the first development-build run settles that.

---

## 2. What is left — NEEDED FOR MVP

Do these in order; the first four unblock everything else.

| # | Task | Why / notes |
|---|---|---|
| 1 | **Create the hosted Supabase project** and fix `.env` | The current `EXPO_PUBLIC_SUPABASE_ANON_KEY` is invalid (40 chars; a real anon key is a long `eyJ…` token or `sb_publishable_…`). Never use the `service_role` / `sb_secret_` key in the app. |
| 2 | **Deploy the backend**: `npx supabase link`, `npx supabase db push`, `npx supabase functions deploy submit-run` | The party migration was edited in place and has never been applied anywhere. Push it before making further changes; after that, only add new migration files. |
| 3 | **Supabase Auth settings**: turn off email confirmation (demo), set Site URL `runio://` and redirect `runio://**` | README step; otherwise new accounts can't sign in immediately. |
| 4 | **Build a development build** and install it on ≥ 2 phones: `npx expo run:android` (needs Android Studio) or `eas build --profile development --platform android` | Required for the MapLibre map and real GPS. Android package is set (`com.dti.runio`). **iOS bundle identifier is still not set** (only needed if you build for iOS). EAS needs the `EXPO_PUBLIC_SUPABASE_*` values added with `eas env:create` because `.env` is not uploaded. |
| 5 | **Live end-to-end test with two accounts**: sign up → run (simulated and real GPS) → cells appear on the other phone → steal → party create / join / start / run / results | None of the new party, realtime, leaderboard or map code has been run live. Specifically verify: lobby → live standings keeps updating (realtime channel), `maybeSingle`/embeds work through PostgREST, H3 on Hermes. Fix whatever breaks. |
| 6 | **Seed a believable demo map** | Without runs the map is empty. `supabase/seed.sql` creates 4 demo accounts with the known password `runio-demo-123`: push it **only to a throwaway/demo project**, never one with real users. |
| 7 | **Bad-GPS and permission states** | Clear screens for location denied, GPS lost, low accuracy. The code handles errors but the UX hasn't been checked on a device. The indoor fallback is `EXPO_PUBLIC_TRACKING_MODE=simulated`. |
| 8 | **Bad-network behaviour check** | Finish a run in airplane mode: it must show "failed" with RETRY, not lose the run. Implemented, not yet tested on device. |
| 9 | **Demo prep**: 5-minute demo script, backup screen recording, dry run twice, slides (problem → solution → architecture → demo → future work) | ROADMAP week 4. Keep the last 2–3 days free as buffer. |
| 10 | **Fix small copy/UX issues found in the live test** | e.g. the "VIEW LIVE" party button actually joins the party; relabel if confusing. |

---

## 3. What is left — NOT NEEDED FOR MVP

Good to have after the demo, or required only for a public store release.

### Product / features
- **Background tracking** (runs continue with the screen locked): needs `expo-task-manager` and a foreground service. ROADMAP says keeping the screen on is acceptable for the demo. **The biggest gap for a real release.**
- **Live positions of other runners** (opt-in, only while running). Nearby lists currently come from territory ownership only.
- **Competition-wins stat** and the two win-based achievements (hidden online).
- **Push notifications** ("your cell was stolen", "party starting").
- **Territory rules beyond v1**: decay, fortification (2 passes), closed-loop capture.
- Friends, clubs, chat, seasons, Strava / Health Connect import.
- Party edge cases: late uploads after a party ends lose party credit; a host can still delete a finished party; the active party is forgotten on app restart; leaderboard/player data isn't refreshed right after a run.

### Security & trust
- Stronger anti-cheat (repeated routes, accelerometer cadence), rate limits on `submit-run`.
- Party member lists / standings of private parties are readable by anyone who knows the party id.
- Restrict the host's right to delete live or completed parties.

### Accounts & compliance (store release)
- Password reset, email verification flow, other sign-in providers, account deletion (required by app stores).
- Privacy policy and location-data disclosure.

### Production operations
- Staging project separate from production, backups, error monitoring (e.g. Sentry), index/load checks.
- Offline run queue that survives an app restart.
- Replace OpenFreeMap with a paid or self-hosted tile source if usage grows (it has no uptime guarantee).
- Store listings, signed release builds, Play internal testing / TestFlight.

### Engineering hygiene
- ESLint is not configured, so `expo lint` can't run (AGENTS.md asks for lint before finishing a task). Add a config.
- UI and end-to-end tests (today: 48 jest tests for logic, 46 pgTAP tests for the database).
- Minor items deferred during review (all low-risk): duplicated per-cell-area constant, unbounded `fetchParties`, an untested retry cap in `create_party`, realtime delete events not pushed for a disbanded lobby, an `AVG` style cleanup, ROADMAP wording.
- Map performance pass on a mid-range phone with hundreds of cells.

---

## 4. How to verify the current state

```bash
npm run typecheck          # clean
npm test                   # 48 tests
npx supabase start && npx supabase db reset && npx supabase test db   # 46 database tests (needs Docker)
```

Local-only dev without a backend: leave the Supabase keys unset. The app runs in offline mode (map + run with mock data).
