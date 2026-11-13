import { getHexagonAreaAvg } from 'h3-js';
import { TERRITORY_RESOLUTION } from '../lib/h3';
import { requireSupabase } from '../lib/supabase';
import { LeaderboardEntry } from '../types/user';
import { Bounds } from './territory';

const AVG_CELL_KM2 = getHexagonAreaAvg(TERRITORY_RESOLUTION, 'km2');

/** Row from get_leaderboard / get_leaderboard_nearby (cells_owned, total_km) or get_party_leaderboard (cells_captured, distance_m). */
export interface LeaderboardRow {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  cells_owned?: number;
  total_km?: number;
  cells_captured?: number;
  distance_m?: number;
}

export function leaderboardFromRows(rows: LeaderboardRow[], myUserId?: string): LeaderboardEntry[] {
  return rows.map((r) => ({
    rank: Number(r.rank),
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url ?? '',
    territoryCapturedKm2: (r.cells_owned ?? r.cells_captured ?? 0) * AVG_CELL_KM2,
    distanceKm: r.total_km ?? (r.distance_m ?? 0) / 1000,
    score: r.score,
    isCurrentUser: r.user_id === myUserId,
  }));
}

async function rows(fn: string, args?: Record<string, unknown>): Promise<LeaderboardRow[]> {
  const { data, error } = await requireSupabase().rpc(fn, args);
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardRow[];
}

export const fetchGlobalLeaderboard = async (myUserId?: string) =>
  leaderboardFromRows(await rows('get_leaderboard'), myUserId);

export const fetchNearbyLeaderboard = async (bounds: Bounds, myUserId?: string) =>
  leaderboardFromRows(
    await rows('get_leaderboard_nearby', {
      min_lat: bounds.minLat,
      min_lng: bounds.minLng,
      max_lat: bounds.maxLat,
      max_lng: bounds.maxLng,
    }),
    myUserId,
  );

export const fetchPartyLeaderboard = async (partyId: string, myUserId?: string) =>
  leaderboardFromRows(await rows('get_party_leaderboard', { p_party_id: partyId }), myUserId);
