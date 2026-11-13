// submit-run: the only way a run (and territory) gets into the database.
// POST { startedAt, endedAt, durationSeconds, points[], partyId? } with the user's JWT.
// Validates and scores the run (../_shared/runScoring.ts), then applies it atomically via
// the apply_run() SQL function using the service role.
//
// Deploy: npx supabase functions deploy submit-run
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { cellToLatLng, latLngToCell } from 'npm:h3-js@4.5.0';
import { parseSubmission, scoreRun } from '../_shared/runScoring.ts';

const TERRITORY_RESOLUTION = 10; // keep in sync with src/lib/h3.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Sign in to submit runs.' }, 401);
  const { data: auth, error: authError } = await createClient(url, anonKey).auth.getUser(token);
  if (authError || !auth.user) return json({ error: 'Your session has expired. Sign in again.' }, 401);

  let submission;
  try {
    submission = parseSubmission(await req.json());
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid run.' }, 400);
  }

  const scored = scoreRun(submission, {
    toCell: (lat, lng) => latLngToCell(lat, lng, TERRITORY_RESOLUTION),
    cellCenter: (cell) => cellToLatLng(cell) as [number, number],
  });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc('apply_run', {
    p_user_id: auth.user.id,
    p_party_id: submission.partyId,
    p_started_at: new Date(submission.startedAt).toISOString(),
    p_ended_at: new Date(Math.max(submission.endedAt, submission.startedAt)).toISOString(),
    p_distance_m: scored.distanceMeters,
    p_duration_s: scored.durationSeconds,
    p_route_wkt: scored.routeWkt,
    p_status: scored.status,
    p_reject_reason: scored.rejectReason,
    p_cells: scored.cells,
  });
  if (error) {
    console.error('apply_run failed', error);
    return json({ error: 'Could not save your run. Try again.' }, 500);
  }

  const result = data as {
    run_id: string;
    status: 'accepted' | 'rejected';
    reject_reason: string | null;
    cells_new: number;
    cells_stolen: number;
    cells_defended: number;
    xp_earned: number;
  };

  return json({
    runId: result.run_id,
    status: result.status,
    rejectReason: result.reject_reason,
    distanceMeters: scored.distanceMeters,
    durationSeconds: scored.durationSeconds,
    droppedPointCount: scored.droppedPointCount,
    cells: scored.status === 'accepted' ? scored.cells.map((c) => c.h3) : [],
    cellsNew: result.cells_new,
    cellsStolen: result.cells_stolen,
    cellsDefended: result.cells_defended,
    xpEarned: result.xp_earned,
  });
});
