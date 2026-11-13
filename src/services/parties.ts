import { getHexagonAreaAvg } from 'h3-js';
import { TERRITORY_RESOLUTION } from '../lib/h3';
import { requireSupabase } from '../lib/supabase';
import { CreatePartyInput, Party, PartyGameMode, PartyStatus, PartyVisibility } from '../types/party';

const AVG_CELL_KM2 = getHexagonAreaAvg(TERRITORY_RESOLUTION, 'km2');

export interface PartyRow {
  id: string;
  code: string;
  name: string;
  host_id: string;
  game_mode: PartyGameMode;
  visibility: PartyVisibility;
  status: PartyStatus;
  max_participants: number;
  duration_minutes: number;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface MemberRow {
  user_id: string;
  score: number;
  cells_captured: number;
  distance_m: number;
  profiles: { username: string; color: string; avatar_url: string | null } | null;
}

export function partyFromRows(row: PartyRow, members: MemberRow[]): Party {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    visibility: row.visibility,
    gameMode: row.game_mode,
    durationMinutes: row.duration_minutes,
    maxParticipants: row.max_participants,
    status: row.status,
    hostId: row.host_id,
    createdAt: row.created_at,
    startedAt: row.started_at ? Date.parse(row.started_at) : undefined,
    endsAt: row.ends_at ? Date.parse(row.ends_at) : undefined,
    participants: members.map((m) => ({
      id: m.user_id,
      username: m.profiles?.username ?? 'Runner',
      avatarUrl: m.profiles?.avatar_url ?? '',
      color: m.profiles?.color ?? '#999999',
      isHost: m.user_id === row.host_id,
      score: m.score,
      territoryCapturedKm2: m.cells_captured * AVG_CELL_KM2,
      distanceCoveredKm: m.distance_m / 1000,
    })),
  };
}

const PARTY_SELECT = '*, party_members(user_id, score, cells_captured, distance_m, profiles(username, color, avatar_url))';
type PartyWithMembers = PartyRow & { party_members: MemberRow[] };

// Supabase errors are plain objects; surface the SQL message ('Party is full', ...) unchanged.
function fail(error: { message: string }): never {
  throw new Error(error.message);
}

export async function fetchParties(): Promise<Party[]> {
  const { data, error } = await requireSupabase()
    .from('parties')
    .select(PARTY_SELECT)
    .order('created_at', { ascending: false });
  if (error) fail(error);
  return ((data ?? []) as PartyWithMembers[]).map((p) => partyFromRows(p, p.party_members));
}

export async function fetchParty(id: string): Promise<Party | null> {
  const { data, error } = await requireSupabase().from('parties').select(PARTY_SELECT).eq('id', id).maybeSingle();
  if (error) fail(error);
  const row = data as PartyWithMembers | null;
  return row ? partyFromRows(row, row.party_members) : null;
}

async function rpcParty(fn: string, args: Record<string, unknown>): Promise<Party> {
  const { data, error } = await requireSupabase().rpc(fn, args).single<PartyRow>();
  if (error) fail(error);
  // The RPCs return the bare party row; re-fetch so callers get members too.
  const party = await fetchParty(data.id);
  if (!party) throw new Error('Party not found');
  return party;
}

export const createParty = (input: CreatePartyInput) =>
  rpcParty('create_party', {
    p_name: input.name.trim(),
    p_visibility: input.visibility,
    p_game_mode: input.gameMode,
    p_duration_minutes: input.durationMinutes,
    p_max_participants: input.maxParticipants,
  });

export const joinPartyByCode = (code: string) => rpcParty('join_party', { p_code: code });
export const startParty = (id: string) => rpcParty('start_party', { p_party_id: id });
export const finishParty = (id: string) => rpcParty('finish_party', { p_party_id: id });

export async function leaveParty(id: string): Promise<void> {
  const { error } = await requireSupabase().rpc('leave_party', { p_party_id: id });
  if (error) fail(error);
}
