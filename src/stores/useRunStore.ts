import { create } from 'zustand';
import { haversineMeters } from '../lib/geo';
import { MIN_POINTS_TO_CAPTURE, cellsAreaKm2, pointToCell } from '../lib/h3';
import { rejectReason, TrackPoint } from '../lib/tracking/filterPoints';
import { defaultTrackingMode, TrackingMode } from '../lib/tracking/sources';
import { PaceSample, RunSession, RunStatus } from '../types/run';

/** Pace is averaged over this trailing window so a single GPS wobble doesn't swing it. */
const PACE_WINDOW_MS = 30_000;
/** Below this distance in the window the pace is too noisy to show. */
const MIN_PACE_WINDOW_METERS = 15;

interface RunState {
  currentSession: RunSession | null;
  status: RunStatus;
  /** Starts a run; tracking defaults to real GPS on phones and the simulator on web. */
  startRun: (trackingMode?: TrackingMode) => void;
  pauseRun: () => void;
  resumeRun: () => void;
  endRun: () => void;
  /** Feed one raw GPS reading; it is filtered, then distance, pace and cells are updated. */
  addTrackPoint: (point: TrackPoint) => void;
  /** Advance the run clock by one second (only while running). */
  tick: () => void;
}

export const useRunStore = create<RunState>((set) => ({
  currentSession: null,
  status: 'idle',

  startRun: (trackingMode = defaultTrackingMode()) =>
    set({
      status: 'running',
      currentSession: {
        id: `run-${Date.now()}`,
        startTime: Date.now(),
        durationSeconds: 0,
        distanceMeters: 0,
        currentPaceSecondsPerKm: 0,
        route: [],
        trackPoints: [],
        rejectedPointCount: 0,
        cellPointCounts: {},
        capturedCells: [],
        paceWindow: [],
        startsNewSegment: true,
        trackingMode,
        territoriesClaimedCount: 0,
        territoryCapturedKm2: 0,
        xpEarned: 0,
        caloriesBurned: 0,
        status: 'running',
      },
    }),

  pauseRun: () =>
    set((state) => ({
      status: 'paused',
      currentSession: state.currentSession ? { ...state.currentSession, status: 'paused' } : null,
    })),

  resumeRun: () =>
    set((state) => ({
      status: 'running',
      // Start a new segment so the pause gap isn't counted as distance or read as a teleport.
      currentSession: state.currentSession
        ? { ...state.currentSession, status: 'running', paceWindow: [], startsNewSegment: true }
        : null,
    })),

  endRun: () =>
    set((state) => {
      const session = state.currentSession;
      if (!session) return state;
      return {
        status: 'finished',
        currentSession: {
          ...session,
          endTime: Date.now(),
          territoriesClaimedCount: session.capturedCells.length,
          territoryCapturedKm2: cellsAreaKm2(session.capturedCells),
          // Provisional: the server will recompute XP in submit_run (week 2).
          xpEarned:
            50 +
            Math.floor(session.distanceMeters / 100) +
            Math.floor(session.durationSeconds / 60) * 10 +
            session.capturedCells.length * 5,
          status: 'finished',
        },
      };
    }),

  addTrackPoint: (point) =>
    set((state) => {
      const session = state.currentSession;
      if (state.status !== 'running' || !session) return state;

      // The first point of a segment (run start or after resume) has nothing to compare against.
      const previous = session.startsNewSegment ? undefined : session.trackPoints.at(-1);
      if (rejectReason(previous, point)) {
        return { currentSession: { ...session, rejectedPointCount: session.rejectedPointCount + 1 } };
      }

      const distanceMeters = session.distanceMeters + (previous ? haversineMeters(previous, point) : 0);

      const cell = pointToCell(point);
      const count = (session.cellPointCounts[cell] ?? 0) + 1;
      const capturedCells =
        count === MIN_POINTS_TO_CAPTURE ? [...session.capturedCells, cell] : session.capturedCells;

      const paceWindow: PaceSample[] = [
        ...session.paceWindow.filter((s) => point.timestamp - s.timestamp <= PACE_WINDOW_MS),
        { timestamp: point.timestamp, distanceMeters },
      ];

      return {
        currentSession: {
          ...session,
          distanceMeters,
          currentPaceSecondsPerKm: rollingPace(paceWindow) ?? session.currentPaceSecondsPerKm,
          route: [...session.route, { latitude: point.latitude, longitude: point.longitude }],
          trackPoints: [...session.trackPoints, point],
          cellPointCounts: { ...session.cellPointCounts, [cell]: count },
          capturedCells,
          currentCell: cell,
          paceWindow,
          startsNewSegment: false,
          caloriesBurned: Math.round(distanceMeters * 0.06),
        },
      };
    }),

  tick: () =>
    set((state) => {
      if (state.status !== 'running' || !state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          durationSeconds: state.currentSession.durationSeconds + 1,
        },
      };
    }),
}));

function rollingPace(window: PaceSample[]): number | null {
  if (window.length < 2) return null;
  const first = window[0];
  const last = window[window.length - 1];
  const meters = last.distanceMeters - first.distanceMeters;
  const seconds = (last.timestamp - first.timestamp) / 1000;
  if (meters < MIN_PACE_WINDOW_METERS || seconds <= 0) return null;
  return seconds / (meters / 1000);
}
