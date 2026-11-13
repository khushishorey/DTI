/**
 * Server-side run validation for the submit-run Edge Function.
 *
 * Dependency-free on purpose: it runs in Deno (Edge Function) and in Node (Jest), so the
 * H3 functions are passed in. The rules mirror src/lib/tracking/filterPoints.ts and
 * src/lib/h3.ts in the app, but this copy is the one that counts.
 */

export interface SubmittedPoint {
  latitude: number;
  longitude: number;
  /** ms since epoch */
  timestamp: number;
  accuracy: number | null;
  mocked?: boolean;
  /** First point after the run started or resumed: no distance from the previous point. */
  segmentStart?: boolean;
}

export interface RunSubmission {
  startedAt: number;
  endedAt: number;
  /** Active (un-paused) seconds as measured by the app. */
  durationSeconds: number;
  points: SubmittedPoint[];
  partyId?: string | null;
}

export interface H3Adapter {
  toCell: (latitude: number, longitude: number) => string;
  cellCenter: (cell: string) => [number, number];
}

export type RunRejectReason =
  | 'invalid-times'
  | 'too-few-points'
  | 'too-fast'
  | 'mocked-location'
  | 'too-long';

export interface ScoredRun {
  status: 'accepted' | 'rejected';
  rejectReason: RunRejectReason | null;
  distanceMeters: number;
  durationSeconds: number;
  acceptedPointCount: number;
  droppedPointCount: number;
  cells: { h3: string; lat: number; lng: number }[];
  /** WKT LINESTRING of accepted points (lng lat), or null when there are fewer than 2. */
  routeWkt: string | null;
}

export const RULES = {
  maxAccuracyMeters: 25,
  /** Point-to-point speed above this means a GPS jump or a vehicle. */
  maxPointSpeedKmh: 25,
  /** Whole-run average above this is not a run. */
  maxAverageSpeedKmh: 20,
  /** Share of points flagged as mocked that rejects the run outright. */
  maxMockedShare: 0.2,
  minPointsInCell: 2,
  maxRunHours: 6,
  maxPoints: 20_000,
  maxRoutePoints: 2_000,
  clockSkewMs: 2 * 60_000,
} as const;

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMeters(a: SubmittedPoint, b: SubmittedPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Throws a readable error when the request body isn't a RunSubmission. */
export function parseSubmission(body: unknown): RunSubmission {
  if (!body || typeof body !== 'object') throw new Error('Body must be a JSON object.');
  const b = body as Record<string, unknown>;
  const num = (key: string) => {
    const v = b[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`"${key}" must be a number.`);
    return v;
  };
  if (!Array.isArray(b.points)) throw new Error('"points" must be an array.');
  if (b.points.length > RULES.maxPoints) throw new Error(`At most ${RULES.maxPoints} points per run.`);
  const points = b.points.map((p, i): SubmittedPoint => {
    const q = p as Record<string, unknown>;
    const lat = q.latitude, lng = q.longitude, t = q.timestamp, acc = q.accuracy;
    if (typeof lat !== 'number' || lat < -90 || lat > 90) throw new Error(`points[${i}].latitude is invalid.`);
    if (typeof lng !== 'number' || lng < -180 || lng > 180) throw new Error(`points[${i}].longitude is invalid.`);
    if (typeof t !== 'number' || !Number.isFinite(t)) throw new Error(`points[${i}].timestamp is invalid.`);
    if (acc !== null && acc !== undefined && typeof acc !== 'number') throw new Error(`points[${i}].accuracy is invalid.`);
    return {
      latitude: lat,
      longitude: lng,
      timestamp: t,
      accuracy: acc ?? null,
      mocked: q.mocked === true,
      segmentStart: q.segmentStart === true,
    };
  });
  // A bad partyId must not cost the runner their run (apply_run would fail on a non-uuid): drop it.
  const partyId =
    typeof b.partyId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.partyId)
      ? b.partyId
      : null;
  return {
    startedAt: num('startedAt'),
    endedAt: num('endedAt'),
    durationSeconds: num('durationSeconds'),
    points,
    partyId,
  };
}

export function scoreRun(run: RunSubmission, h3: H3Adapter, now = Date.now()): ScoredRun {
  const rejected = (rejectReason: RunRejectReason, extra: Partial<ScoredRun> = {}): ScoredRun => ({
    status: 'rejected',
    rejectReason,
    distanceMeters: 0,
    durationSeconds: 0,
    acceptedPointCount: 0,
    droppedPointCount: 0,
    cells: [],
    routeWkt: null,
    ...extra,
  });

  const wallSeconds = (run.endedAt - run.startedAt) / 1000;
  if (wallSeconds < 0 || run.endedAt > now + RULES.clockSkewMs || run.durationSeconds < 0) {
    return rejected('invalid-times');
  }
  if (wallSeconds > RULES.maxRunHours * 3600) return rejected('too-long');

  const points = run.points
    .filter(
      (p) =>
        p.timestamp >= run.startedAt - RULES.clockSkewMs && p.timestamp <= run.endedAt + RULES.clockSkewMs,
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const mockedCount = points.filter((p) => p.mocked).length;
  if (points.length > 0 && mockedCount / points.length > RULES.maxMockedShare) {
    return rejected('mocked-location');
  }

  const accepted: SubmittedPoint[] = [];
  let distanceMeters = 0;
  for (const point of points) {
    if (point.mocked) continue;
    if (point.accuracy !== null && point.accuracy > RULES.maxAccuracyMeters) continue;
    const previous = point.segmentStart ? undefined : accepted[accepted.length - 1];
    if (previous) {
      const seconds = (point.timestamp - previous.timestamp) / 1000;
      if (seconds <= 0) continue;
      const meters = haversineMeters(previous, point);
      if ((meters / seconds) * 3.6 > RULES.maxPointSpeedKmh) continue;
      distanceMeters += meters;
    }
    accepted.push(point);
  }

  const durationSeconds = Math.round(Math.min(run.durationSeconds, wallSeconds));
  const base = {
    distanceMeters,
    durationSeconds,
    acceptedPointCount: accepted.length,
    droppedPointCount: points.length - accepted.length,
    routeWkt: toLineString(accepted),
  };

  if (accepted.length < 2) return rejected('too-few-points', base);
  if (durationSeconds > 0 && (distanceMeters / durationSeconds) * 3.6 > RULES.maxAverageSpeedKmh) {
    return rejected('too-fast', base);
  }

  const counts = new Map<string, number>();
  for (const p of accepted) {
    const cell = h3.toCell(p.latitude, p.longitude);
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }
  const cells = [...counts]
    .filter(([, count]) => count >= RULES.minPointsInCell)
    .map(([cell]) => {
      const [lat, lng] = h3.cellCenter(cell);
      return { h3: cell, lat, lng };
    });

  return { status: 'accepted', rejectReason: null, cells, ...base };
}

function toLineString(points: SubmittedPoint[]): string | null {
  if (points.length < 2) return null;
  const step = Math.max(1, Math.ceil(points.length / RULES.maxRoutePoints));
  const sampled = points.filter((_, i) => i % step === 0 || i === points.length - 1);
  return `LINESTRING(${sampled.map((p) => `${p.longitude} ${p.latitude}`).join(', ')})`;
}
