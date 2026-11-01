import { Coordinates } from './territory';

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface RunSession {
  id: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  distanceMeters: number;
  currentPaceSecondsPerKm: number;
  route: Coordinates[];
  territoriesClaimedCount: number;
  territoryCapturedKm2: number;
  xpEarned: number;
  caloriesBurned: number;
  status: RunStatus;
}
