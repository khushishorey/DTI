# run.io

A running game where your runs capture territory. Run through hex cells on a real map to claim them, steal rivals' cells, and compete in timed party challenges.

Built with Expo (React Native + TypeScript), Expo Router, Zustand, react-native-maps, H3 and Supabase. See [ROADMAP.md](ROADMAP.md) for the plan and [design.md](design.md) for the design system.

## Quick start (no backend needed)

```bash
npm install
npx expo start
```

Press `w` for web, or scan the QR code with a development build. Without Supabase keys the app runs in **offline demo mode**: there's no sign-in, and screens use mock data. Runs still work: on web they replay a simulated route, and on a phone they use real GPS.

## Connect the backend (Supabase)

1. Create a free project at supabase.com.
2. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).
3. Apply the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   npx supabase functions deploy submit-run
   ```
4. Restart `npx expo start`. The app now opens on the welcome / sign-up screens.

For the demo, turn off email confirmation (Authentication → Providers → Email) so new accounts can sign in straight away.

### Local database (optional, needs Docker)

```bash
npx supabase start      # local Postgres + Auth + Realtime
npx supabase db reset   # applies migrations + supabase/seed.sql
```

The seed adds 4 demo players with territory around the demo map area. They log in as `<username>@demo.run.io` with password `runio-demo-123` (local only). Regenerate it with `node scripts/generate-seed.cjs`.

## How a run is saved

When a run ends, the app sends its GPS points to the `submit-run` Edge Function ([supabase/functions/submit-run](supabase/functions/submit-run/index.ts)). The function re-checks every point with the rules in [`_shared/runScoring.ts`](supabase/functions/_shared/runScoring.ts) and works out the captured cells itself. It then calls the `apply_run()` database function, which in one transaction saves the run, takes over the cells, records who they were taken from and awards XP. The app never writes runs or cells directly.

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

Run typecheck, lint and tests before opening a PR.

## Project layout

```
src/app/            screens (Expo Router). (auth)/ = welcome, login, register, setup
src/components/     UI by feature (common, map, party, profile, leaderboard, auth)
src/lib/            geo + H3 helpers, GPS tracking, Supabase client
src/services/       the only code that talks to Supabase
src/stores/         Zustand stores (run, auth, party, territory)
supabase/           migrations, seed, CLI config
```
