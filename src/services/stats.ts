import { getHexagonAreaAvg } from 'h3-js';
import { TERRITORY_RESOLUTION } from '../lib/h3';
import { requireSupabase } from '../lib/supabase';

export interface MyStats {
  totalDistanceKm: number;
  totalDurationSeconds: number;
  runCount: number;
  cellsOwned: number;
  /** Approximate: cells owned × average res-10 cell area. */
  areaOwnedKm2: number;
  cellsCaptured: number;
  xp: number;
  level: number;
}

const AVG_CELL_KM2 = getHexagonAreaAvg(TERRITORY_RESOLUTION, 'km2');

export async function fetchMyStats(): Promise<MyStats | null> {
  const { data, error } = await requireSupabase()
    .rpc('my_stats')
    .maybeSingle<{
      total_distance_m: number;
      total_duration_s: number;
      run_count: number;
      cells_owned: number;
      cells_captured: number;
      xp: number;
      level: number;
    }>();
  if (error) throw error;
  if (!data) return null;
  return {
    totalDistanceKm: data.total_distance_m / 1000,
    totalDurationSeconds: Number(data.total_duration_s),
    runCount: data.run_count,
    cellsOwned: data.cells_owned,
    areaOwnedKm2: data.cells_owned * AVG_CELL_KM2,
    cellsCaptured: Number(data.cells_captured),
    xp: data.xp,
    level: data.level,
  };
}
