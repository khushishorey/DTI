# run.io

A running game where your runs capture territory. Run through hex cells on a real map to claim them, steal rivals' cells, and compete in timed party challenges.

Built with Expo (React Native + TypeScript), Expo Router, Zustand, react-native-maps, H3 and Supabase. See [ROADMAP.md](ROADMAP.md) for the plan and [design.md](design.md) for the design system.

## Quick start (no backend needed)

```bash
npm install
npx expo start
```

Press `w` for web, or scan the QR code with a development build. Without Supabase keys the app runs in **offline demo mode**: no sign-in, and only the map and running work (Home, Explore and Profile use mock data). Parties and the leaderboard need a backend and sign-in, so offline they show a "Sign in" notice. Runs still work: on web they replay a simulated route, and on a phone they use real GPS.

## Connect the backend (Supabase)

1. Create a free project at supabase.com.
2. Copy `.env.example` to `.env` and fill it in (local dev). For EAS builds `.env` is gitignored and invisible to EAS, so run `npx eas-cli@latest env:create` for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (visibility `plaintext` or `sensitive`) and `GOOGLE_MAPS_ANDROID_API_KEY` (visibility `secret`). See the table below.
3. Apply the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   npx supabase functions deploy submit-run
   ```
4. Restart `npx expo start`. The app now opens on the welcome / sign-up screens.

For the demo, turn off email confirmation (Authentication → Providers → Email) so new accounts can sign in straight away.

### Environment variables

| Name | Where it lives | Required? | Used by |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` locally; EAS env var (all profiles) | **Yes** | `src/lib/supabase.ts` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same | **Yes** (public, safe because of RLS) | `src/lib/supabase.ts` |
| `EXPO_PUBLIC_TRACKING_MODE` (`real`\|`simulated`) | `.env`; EAS `preview` profile may set `simulated` for demo APKs | Optional | `src/lib/tracking/sources.ts` |
| `GOOGLE_MAPS_ANDROID_API_KEY` | `.env` (read by `app.config.ts` at build time, **not** `EXPO_PUBLIC_`); EAS secret | **Yes for Android builds** (map is blank without it) | `app.config.ts` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected into Edge Functions by Supabase | Nothing to set | `supabase/functions/submit-run/index.ts` |
| `SUPABASE_ACCESS_TOKEN` | Your shell / CI only (`npx supabase login` or CI secret) | Needed to deploy | Supabase CLI |
| `SUPABASE_DB_PASSWORD` | Your shell / CI only | Needed for `db push` | Supabase CLI |
| `EXPO_TOKEN` | CI only | Only if building from CI | EAS CLI |

### Local database (optional, needs Docker)

```bash
npx supabase start      # local Postgres + Auth + Realtime
npx supabase db reset   # applies migrations + supabase/seed.sql
```

The seed adds 4 demo players with territory around the demo map area. They log in as `<username>@demo.run.io` with password `runio-demo-123` (local only). Regenerate it with `node scripts/generate-seed.cjs`.

Run the database tests (pgTAP, against the local database) with `npx supabase test db`.

## How a run is saved

When a run ends, the app sends its GPS points to the `submit-run` Edge Function ([supabase/functions/submit-run](supabase/functions/submit-run/index.ts)). The function re-checks every point with the rules in [`_shared/runScoring.ts`](supabase/functions/_shared/runScoring.ts) and works out the captured cells itself. It then calls the `apply_run()` database function, which in one transaction saves the run, takes over the cells, records who they were taken from and awards XP. If the run was done for a live party, the party tag is validated server-side (you must be a member of a live party, otherwise the run only counts for the leaderboard) and the party score is `cells * 100 + floor(distance_m / 100)`. The app never writes runs or cells directly.

## GPS and territory

- **Tracking** (`src/lib/tracking/`): `expo-location` in the foreground. Points with accuracy worse than 25 m, implied speed above 25 km/h, or a mocked location are dropped. Set `EXPO_PUBLIC_TRACKING_MODE=simulated` to replay a route indoors.
- **Territory** (`src/lib/h3.ts`): H3 resolution 10 hexes (~66 m edge, ~0.015 km²). A cell is captured once a run has 2 valid points inside it.
- Background tracking (screen off) needs a development build: `npx expo run:android` or `eas build --profile development`. Expo Go is not enough.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Expo dev server |
| `npm test` | Jest unit tests (geo, H3, GPS filter, server run scoring, data adapters) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |

Run typecheck, lint and tests (plus `npx supabase test db` for SQL changes) before opening a PR. The go-live plan is in [docs/superpowers/plans](docs/superpowers/plans/2026-11-13-go-live-backend.md).

## Project layout

```
src/app/            screens (Expo Router). (auth)/ = welcome, login, register, setup
src/components/     UI by feature (common, map, party, profile, leaderboard, auth)
src/hooks/          React Query hooks (parties, leaderboard, run submission), GPS tracker
src/lib/            geo + H3 helpers, GPS tracking, achievements, Supabase client
src/services/       the only code that talks to Supabase
src/stores/         Zustand stores (run, auth, territory, active party id)
src/data/           mock data, used only in offline demo mode and the tracking simulator
supabase/           migrations, pgTAP tests, seed, Edge Functions, CLI config
docs/superpowers/   implementation plans
app.config.ts       Expo config (reads env); eas.json = build profiles
```

## Release checklist (manual)

1. Set the EAS env vars (see the table above).
2. `npx eas-cli@latest build --profile preview --platform android`.
3. Install the APK on 2+ phones and run the party scenario outdoors with real GPS.
4. In airplane mode, finish a run: it should show the "failed" state, and retry should work once back online.
