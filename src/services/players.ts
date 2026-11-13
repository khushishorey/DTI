import { requireSupabase } from '../lib/supabase';
import { Territory } from '../types/territory';

export interface NearbyRunner {
  id: string;
  username: string;
  color: string;
  cellCount: number;
}

export interface PlayerSummary {
  userId: string;
  username: string;
  color: string;
  avatarUrl: string;
  level: number;
  xp: number;
  cellsOwned: number;
  totalKm: number;
  runCount: number;
}

export async function fetchPlayer(id: string): Promise<PlayerSummary | null> {
  const { data, error } = await requireSupabase()
    .rpc('player_summary', { p_user_id: id })
    .maybeSingle<{
      user_id: string;
      username: string;
      color: string;
      avatar_url: string | null;
      level: number;
      xp: number;
      cells_owned: number;
      total_km: number;
      run_count: number;
    }>();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    userId: data.user_id,
    username: data.username,
    color: data.color,
    avatarUrl: data.avatar_url ?? '',
    level: data.level,
    xp: data.xp,
    cellsOwned: data.cells_owned,
    totalKm: data.total_km,
    runCount: data.run_count,
  };
}

export function nearbyRunnersFromTerritories(territories: Territory[], myUserId?: string): NearbyRunner[] {
  const byOwner = new Map<string, NearbyRunner>();
  for (const t of territories) {
    if (t.ownerId === myUserId) continue;
    const runner = byOwner.get(t.ownerId) ?? { id: t.ownerId, username: t.ownerName, color: t.ownerColor, cellCount: 0 };
    runner.cellCount += 1;
    byOwner.set(t.ownerId, runner);
  }
  return [...byOwner.values()].sort((a, b) => b.cellCount - a.cellCount);
}
