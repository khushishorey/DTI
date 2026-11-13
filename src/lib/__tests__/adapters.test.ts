import { latLngToCell } from 'h3-js';
import { cellName, cellsToTerritories, snapBounds, CellOwnership } from '../../services/territory';
import { runToActivity } from '../../utils/runActivity';
import type { RecentRun } from '../../services/runs';

jest.mock('../supabase', () => ({ supabase: null, requireSupabase: jest.fn(), isSupabaseConfigured: false }));

const NOW = new Date('2026-11-16T12:00:00Z').getTime();
const h3 = latLngToCell(37.78825, -122.4324, 10);

const cell = (overrides: Partial<CellOwnership> = {}): CellOwnership => ({
  h3,
  owner_id: 'me',
  owner_name: 'RunnerOne',
  owner_color: '#B7F34A',
  captured_at: new Date(NOW - 3600_000).toISOString(),
  previous_owner_id: null,
  previous_owner_name: null,
  ...overrides,
});

describe('cellsToTerritories', () => {
  it('turns a cell into a hex territory owned by the current player', () => {
    const [territory] = cellsToTerritories([cell()], 'me', NOW);
    expect(territory).toMatchObject({ id: h3, isCurrentPlayer: true, status: 'owned', ownerName: 'RunnerOne' });
    expect(territory.coordinates).toHaveLength(6);
    expect(territory.areaKm2).toBeGreaterThan(0.01);
    expect(territory.name).toBe(cellName(h3));
  });

  it('marks cells stolen in the last 24 h as contested and remembers the previous owner', () => {
    const stolen = cell({ owner_id: 'ghost', previous_owner_id: 'me', previous_owner_name: 'RunnerOne' });
    expect(cellsToTerritories([stolen], 'me', NOW)[0]).toMatchObject({
      isCurrentPlayer: false,
      status: 'contested',
      previousOwnerName: 'RunnerOne',
    });
    const old = { ...stolen, captured_at: new Date(NOW - 3 * 86400_000).toISOString() };
    expect(cellsToTerritories([old], 'me', NOW)[0].status).toBe('owned');
  });
});

describe('snapBounds', () => {
  it('rounds outward so small pans hit the same cache entry', () => {
    const a = snapBounds({ minLat: 37.7811, minLng: -122.4371, maxLat: 37.7932, maxLng: -122.4262 });
    const b = snapBounds({ minLat: 37.7813, minLng: -122.4369, maxLat: 37.7935, maxLng: -122.4265 });
    expect(a).toEqual(b);
    expect(a.minLat).toBeLessThanOrEqual(37.7811);
    expect(a.maxLng).toBeGreaterThanOrEqual(-122.4262);
  });
});

describe('runToActivity', () => {
  const run = (overrides: Partial<RecentRun> = {}): RecentRun => ({
    id: 'r1',
    started_at: new Date(2026, 10, 16, 7, 42).toISOString(),
    ended_at: new Date(2026, 10, 16, 8, 10).toISOString(),
    distance_m: 5200,
    duration_s: 1680,
    cells_captured: 12,
    xp_earned: 400,
    status: 'accepted',
    reject_reason: null,
    party_id: null,
    ...overrides,
  });

  it('describes an accepted run', () => {
    const row = runToActivity(run(), new Date(2026, 10, 16, 12, 0));
    expect(row.title).toBe('Morning run');
    expect(row.subtitle).toBe('12 cells · 28 min · +400 XP');
    expect(row.date).toMatch(/^Today · /);
    expect(row.distanceKm).toBeCloseTo(5.2);
    expect(row.territoryKm2).toBeGreaterThan(0.1);
  });

  it('flags a rejected run and gives it no territory', () => {
    const row = runToActivity(run({ status: 'rejected', reject_reason: 'too-fast' }), new Date(2026, 10, 17, 9, 0));
    expect(row.subtitle).toMatch(/^Didn’t count · /);
    expect(row.territoryKm2).toBe(0);
    expect(row.date).toMatch(/^Yesterday · /);
  });
});
