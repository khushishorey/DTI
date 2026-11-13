import { rejectReason, TrackPoint } from '../tracking/filterPoints';

const base: TrackPoint = {
  latitude: 37.78825,
  longitude: -122.4324,
  timestamp: 1_000_000,
  accuracy: 5,
};

// ~11 m north of `base`
const step = (seconds: number, overrides: Partial<TrackPoint> = {}): TrackPoint => ({
  ...base,
  latitude: base.latitude + 0.0001,
  timestamp: base.timestamp + seconds * 1000,
  ...overrides,
});

describe('rejectReason', () => {
  it('accepts the first good point', () => {
    expect(rejectReason(undefined, base)).toBeNull();
  });

  it('accepts a jogging-speed step (11 m in 4 s ≈ 10 km/h)', () => {
    expect(rejectReason(base, step(4))).toBeNull();
  });

  it('rejects mocked locations', () => {
    expect(rejectReason(undefined, { ...base, mocked: true })).toBe('mocked');
  });

  it('rejects inaccurate fixes but accepts unknown accuracy (web)', () => {
    expect(rejectReason(base, step(4, { accuracy: 60 }))).toBe('low-accuracy');
    expect(rejectReason(base, step(4, { accuracy: null }))).toBeNull();
  });

  it('rejects jumps faster than 25 km/h (11 m in 1 s ≈ 40 km/h)', () => {
    expect(rejectReason(base, step(1))).toBe('too-fast');
  });

  it('rejects points that are not newer than the previous one', () => {
    expect(rejectReason(base, step(0))).toBe('stale');
  });
});
