import { FunctionsHttpError } from '@supabase/supabase-js';
import { cellsAreaKm2 } from '../lib/h3';
import { requireSupabase, supabase } from '../lib/supabase';
import { RunSession } from '../types/run';

/** What the server decided about a finished run (or the local estimate in offline mode). */
export interface RunResult {
  /** null in offline demo mode: nothing was saved. */
  runId: string | null;
  status: 'accepted' | 'rejected';
  rejectReason: string | null;
  distanceMeters: number;
  durationSeconds: number;
  cells: string[];
  cellsNew: number;
  cellsStolen: number;
  cellsDefended: number;
  xpEarned: number;
  areaKm2: number;
}

/** Row from public.runs, as shown in Profile → Recent activity. */
export interface RecentRun {
  id: string;
  started_at: string;
  ended_at: string;
  distance_m: number;
  duration_s: number;
  cells_captured: number;
  xp_earned: number;
  status: 'submitted' | 'accepted' | 'rejected';
  reject_reason: string | null;
  party_id: string | null;
}

export async function submitRun(session: RunSession, partyId: string | null = null): Promise<RunResult> {
  if (!supabase) return localResult(session);

  const { data, error } = await supabase.functions.invoke<Omit<RunResult, 'areaKm2'>>('submit-run', {
    body: {
      startedAt: session.startTime,
      endedAt: session.endTime ?? Date.now(),
      durationSeconds: session.durationSeconds,
      partyId,
      points: session.trackPoints,
    },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  if (!data) throw new Error('The server returned no result.');
  return { ...data, areaKm2: cellsAreaKm2(data.cells) };
}

export async function fetchMyRuns(limit = 10): Promise<RecentRun[]> {
  const { data, error } = await requireSupabase()
    .from('runs')
    .select('id, started_at, ended_at, distance_m, duration_s, cells_captured, xp_earned, status, reject_reason, party_id')
    .order('started_at', { ascending: false })
    .limit(limit)
    .returns<RecentRun[]>();
  if (error) throw error;
  return data;
}

const REJECT_MESSAGES: Record<string, string> = {
  'too-fast': 'This run was faster than running pace, so it didn’t count.',
  'mocked-location': 'A fake-location app was detected, so this run didn’t count.',
  'too-few-points': 'Not enough GPS data was recorded to count this run.',
  'invalid-times': 'The run’s times didn’t add up. Check your phone’s clock.',
  'too-long': 'Runs longer than 6 hours can’t be counted.',
};

export function rejectReasonMessage(reason: string | null): string {
  return (reason && REJECT_MESSAGES[reason]) ?? 'This run didn’t count.';
}

/** Offline demo mode: score the run from the app's own numbers; nothing is saved. */
function localResult(session: RunSession): RunResult {
  const cells = session.capturedCells;
  return {
    runId: null,
    status: 'accepted',
    rejectReason: null,
    distanceMeters: session.distanceMeters,
    durationSeconds: session.durationSeconds,
    cells,
    cellsNew: cells.length,
    cellsStolen: 0,
    cellsDefended: 0,
    xpEarned:
      50 +
      Math.floor(session.distanceMeters / 100) +
      Math.floor(session.durationSeconds / 60) * 10 +
      cells.length * 5,
    areaKm2: cellsAreaKm2(cells),
  };
}

async function functionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      // fall through to the generic message
    }
  }
  return 'Couldn’t reach the server to save your run.';
}
