import { partyFromRows } from '../../services/parties';
import { leaderboardFromRows } from '../../services/leaderboard';
import { nearbyRunnersFromTerritories } from '../../services/players';
import { deriveAchievements } from '../achievements';
import type { MyStats } from '../../services/stats';
import type { Territory } from '../../types/territory';

jest.mock('../supabase', () => ({ supabase: null, requireSupabase: jest.fn(), isSupabaseConfigured: false }));

const partyRow = {
  id: 'p1', code: 'ABC123', name: 'Crew', host_id: 'u1', game_mode: 'territory_control' as const,
  visibility: 'public' as const, status: 'in_progress' as const, max_participants: 8, duration_minutes: 30,
  started_at: '2026-11-20T10:00:00Z', ends_at: '2026-11-20T10:30:00Z', created_at: '2026-11-20T09:00:00Z',
};
const members = [
  { user_id: 'u1', score: 10, cells_captured: 2, distance_m: 1500, profiles: { username: 'Host', color: '#fff', avatar_url: null } },
  { user_id: 'u2', score: 5, cells_captured: 0, distance_m: 0, profiles: { username: 'Guest', color: '#000', avatar_url: 'x' } },
];

describe('partyFromRows', () => {
  it('maps host, scores and epoch times', () => {
    const party = partyFromRows(partyRow, members);
    expect(party.startedAt).toBe(Date.parse('2026-11-20T10:00:00Z'));
    expect(party.endsAt).toBe(Date.parse('2026-11-20T10:30:00Z'));
    expect(party.participants[0]).toMatchObject({ id: 'u1', isHost: true, distanceCoveredKm: 1.5, score: 10 });
    expect(party.participants[1].isHost).toBe(false);
    expect(party.participants[0].territoryCapturedKm2).toBeGreaterThan(0);
  });
  it('handles party with no startedAt', () => {
    const party = partyFromRows({ ...partyRow, started_at: null, ends_at: null, status: 'lobby' }, []);
    expect(party.startedAt).toBeUndefined();
    expect(party.endsAt).toBeUndefined();
  });
});

describe('leaderboardFromRows', () => {
  it('flags current user and handles empty list', () => {
    expect(leaderboardFromRows([])).toEqual([]);
    const rows = [
      { rank: 1, user_id: 'a', username: 'A', avatar_url: null, cells_owned: 3, total_km: 4, score: 9 },
      { rank: 2, user_id: 'me', username: 'Me', avatar_url: null, cells_owned: 1, total_km: 2, score: 5 },
    ];
    const out = leaderboardFromRows(rows, 'me');
    expect(out.map((e) => e.isCurrentUser)).toEqual([false, true]);
    expect(out[1]).toMatchObject({ rank: 2, distanceKm: 2, score: 5 });
  });
});

describe('nearbyRunnersFromTerritories', () => {
  it('counts cells per owner, excludes me, sorts desc', () => {
    const t = (ownerId: string, ownerName: string): Territory => ({
      id: Math.random().toString(), name: '', ownerId, ownerName, ownerColor: '#abc', isCurrentPlayer: ownerId === 'me',
      areaKm2: 0, capturedAt: '', coordinates: [],
    });
    const out = nearbyRunnersFromTerritories([t('a', 'A'), t('b', 'B'), t('b', 'B'), t('me', 'Me')], 'me');
    expect(out).toEqual([
      { id: 'b', username: 'B', color: '#abc', cellCount: 2 },
      { id: 'a', username: 'A', color: '#abc', cellCount: 1 },
    ]);
  });
});

describe('deriveAchievements', () => {
  const zero: MyStats = { totalDistanceKm: 0, totalDurationSeconds: 0, runCount: 0, cellsOwned: 0, areaOwnedKm2: 0, cellsCaptured: 0, xp: 0, level: 1 };
  it('for a zero-stat player: none unlocked, no NaN', () => {
    const list = deriveAchievements(zero);
    expect(list).toHaveLength(4);
    expect(list.some((a) => a.unlocked)).toBe(false);
    expect(list.every((a) => !String(a.progress).includes('NaN'))).toBe(true);
  });
  it('unlocks first-stride at runCount 1', () => {
    expect(deriveAchievements({ ...zero, runCount: 1 }).find((a) => a.id === 'first-stride')?.unlocked).toBe(true);
  });
});
