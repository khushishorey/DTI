import { cellToLatLng, latLngToCell } from 'h3-js';
import {
  parseSubmission,
  RunSubmission,
  scoreRun,
  SubmittedPoint,
} from '../../../supabase/functions/_shared/runScoring';

const h3 = {
  toCell: (lat: number, lng: number) => latLngToCell(lat, lng, 10),
  cellCenter: (cell: string) => cellToLatLng(cell) as [number, number],
};

const START = { latitude: 37.78825, longitude: -122.4324 };
const T0 = 1_800_000_000_000;

/** A steady jog north: one point every `everySeconds`, `metersPerPoint` apart. */
function jog(count: number, { everySeconds = 4, metersPerPoint = 10, from = 0 } = {}): SubmittedPoint[] {
  const degPerMeter = 1 / 111_195;
  return Array.from({ length: count }, (_, i) => ({
    latitude: START.latitude + (from + i) * metersPerPoint * degPerMeter,
    longitude: START.longitude,
    timestamp: T0 + (from + i) * everySeconds * 1000,
    accuracy: 5,
  }));
}

function submission(points: SubmittedPoint[], overrides: Partial<RunSubmission> = {}): RunSubmission {
  const last = points[points.length - 1]?.timestamp ?? T0;
  return {
    startedAt: T0,
    endedAt: last,
    durationSeconds: (last - T0) / 1000,
    points,
    ...overrides,
  };
}

const NOW = T0 + 24 * 3600 * 1000;

describe('scoreRun', () => {
  it('accepts a normal jog and captures cells along it', () => {
    const result = scoreRun(submission(jog(150)), h3, NOW); // ~1.5 km at 9 km/h
    expect(result.status).toBe('accepted');
    expect(result.distanceMeters).toBeGreaterThan(1400);
    expect(result.distanceMeters).toBeLessThan(1600);
    expect(result.cells.length).toBeGreaterThanOrEqual(8);
    expect(result.routeWkt).toMatch(/^LINESTRING\(-122\.4324 37\.78825, /);
  });

  it('drops GPS jumps but keeps the run', () => {
    const points = jog(60);
    points[30] = { ...points[30], latitude: points[30].latitude + 0.01 }; // ~1 km spike
    const result = scoreRun(submission(points), h3, NOW);
    expect(result.status).toBe('accepted');
    expect(result.droppedPointCount).toBe(1);
    expect(result.distanceMeters).toBeLessThan(620);
  });

  it('drops inaccurate points', () => {
    const points = jog(20).map((p, i) => (i % 2 ? { ...p, accuracy: 80 } : p));
    expect(scoreRun(submission(points), h3, NOW).droppedPointCount).toBe(10);
  });

  it('rejects a run that is too fast overall (a bike at ~23 km/h)', () => {
    const points = jog(100, { everySeconds: 3, metersPerPoint: 19 }); // ~23 km/h, under the per-point cap
    expect(scoreRun(submission(points), h3, NOW)).toMatchObject({ status: 'rejected', rejectReason: 'too-fast' });
  });

  it('rejects runs from a fake-location app', () => {
    const points = jog(20).map((p, i) => (i < 10 ? { ...p, mocked: true } : p));
    expect(scoreRun(submission(points), h3, NOW).rejectReason).toBe('mocked-location');
  });

  it('rejects runs with no usable movement', () => {
    expect(scoreRun(submission(jog(1)), h3, NOW).rejectReason).toBe('too-few-points');
  });

  it('rejects runs that end in the future or are absurdly long', () => {
    expect(scoreRun(submission(jog(10), { endedAt: NOW + 3600_000 }), h3, NOW).rejectReason).toBe('invalid-times');
    expect(scoreRun(submission(jog(10), { endedAt: T0 + 7 * 3600_000 }), h3, NOW).rejectReason).toBe('too-long');
  });

  it('never trusts a longer duration than the wall clock allows', () => {
    const result = scoreRun(submission(jog(30), { durationSeconds: 99_999 }), h3, NOW);
    expect(result.durationSeconds).toBe(116);
  });

  it('does not count distance across a pause', () => {
    const before = jog(10);
    // Resume 200 m further on, 5 minutes later (walked while paused).
    const after = jog(10, { from: 30, everySeconds: 4 }).map((p, i) => ({
      ...p,
      timestamp: p.timestamp + 300_000,
      segmentStart: i === 0,
    }));
    const result = scoreRun(submission([...before, ...after]), h3, NOW);
    expect(result.distanceMeters).toBeCloseTo(180, -1);
  });
});

describe('parseSubmission', () => {
  it('accepts a well-formed body', () => {
    const body = JSON.parse(JSON.stringify(submission(jog(3))));
    expect(parseSubmission(body).points).toHaveLength(3);
  });

  it('rejects malformed bodies with a readable message', () => {
    expect(() => parseSubmission(null)).toThrow('JSON object');
    expect(() => parseSubmission({ startedAt: 1, endedAt: 2, durationSeconds: 1 })).toThrow('"points"');
    expect(() =>
      parseSubmission({ startedAt: 1, endedAt: 2, durationSeconds: 1, points: [{ latitude: 200, longitude: 0, timestamp: 1 }] }),
    ).toThrow('latitude');
  });

  it('drops a malformed partyId instead of losing the run', () => {
    const body = JSON.parse(JSON.stringify(submission(jog(3))));
    expect(parseSubmission({ ...body, partyId: 'not-a-uuid' }).partyId).toBeNull();
    expect(parseSubmission({ ...body, partyId: 42 }).partyId).toBeNull();
    const id = '0b6e5c1a-3f2d-4e8b-9a7c-1d2e3f4a5b6c';
    expect(parseSubmission({ ...body, partyId: id }).partyId).toBe(id);
  });
});
