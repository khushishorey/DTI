import { Coordinates } from './territory';
import type { TrackingMode } from '../lib/tracking/sources';
import type { TrackPoint } from '../lib/tracking/filterPoints';

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface PaceSample {
  timestamp: number;
  distanceMeters: number;
}

export interface RunSession {
  id: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  distanceMeters: number;
  currentPaceSecondsPerKm: number;
  /** Accepted (filtered) points, in order. */
  route: Coordinates[];
  /** Raw accepted points with timestamps — what gets uploaded to the server at the end. */
  trackPoints: TrackPoint[];
  rejectedPointCount: number;
  /** H3 cell → number of accepted points inside it. */
  cellPointCounts: Record<string, number>;
  /** Cells that have reached the capture threshold, in capture order. */
  capturedCells: string[];
  /** Cell the runner is currently inside, if any point has been accepted. */
  currentCell?: string;
  /** Recent distance samples used for a rolling pace. */
  paceWindow: PaceSample[];
  /** True until the first point after start/resume is accepted; that point adds no distance. */
  startsNewSegment: boolean;
  trackingMode: TrackingMode;
  territoriesClaimedCount: number;
  territoryCapturedKm2: number;
  xpEarned: number;
  caloriesBurned: number;
  status: RunStatus;
}
