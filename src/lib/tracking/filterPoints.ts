import { haversineMeters } from '../geo';
import { Coordinates } from '../../types/territory';

/** One raw GPS reading, independent of where it came from (device or simulator). */
export interface TrackPoint extends Coordinates {
  /** ms since epoch */
  timestamp: number;
  /** horizontal accuracy radius in meters; null when the platform does not report it */
  accuracy: number | null;
  /** true when the OS says the reading came from a mock-location provider */
  mocked?: boolean;
  /** Set by the run store on the first accepted point after start/resume. */
  segmentStart?: boolean;
}

export type RejectReason = 'low-accuracy' | 'mocked' | 'too-fast' | 'stale';

export interface FilterOptions {
  maxAccuracyMeters: number;
  maxSpeedKmh: number;
}

export const DEFAULT_FILTER: FilterOptions = {
  maxAccuracyMeters: 25,
  maxSpeedKmh: 25,
};

/**
 * Decide whether `next` is a trustworthy continuation of the last accepted point.
 * Returns null when the point is accepted, otherwise why it was rejected.
 */
export function rejectReason(
  previous: TrackPoint | undefined,
  next: TrackPoint,
  options: FilterOptions = DEFAULT_FILTER,
): RejectReason | null {
  if (next.mocked) return 'mocked';
  if (next.accuracy !== null && next.accuracy > options.maxAccuracyMeters) return 'low-accuracy';
  if (!previous) return null;

  const elapsedSeconds = (next.timestamp - previous.timestamp) / 1000;
  if (elapsedSeconds <= 0) return 'stale';

  const speedKmh = (haversineMeters(previous, next) / elapsedSeconds) * 3.6;
  if (speedKmh > options.maxSpeedKmh) return 'too-fast';
  return null;
}
