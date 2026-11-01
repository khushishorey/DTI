import { create } from 'zustand';
import { RunSession, RunStatus } from '../types/run';
import { Coordinates } from '../types/territory';
import { RUN_START } from '../data/mockRunRoute';

interface RunState {
  currentSession: RunSession | null;
  status: RunStatus;
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  endRun: () => void;
  addRoutePoint: (point: Coordinates) => void;
  updateStats: (distanceMeters: number, paceSecondsPerKm: number) => void;
  tick: (routePoint?: Coordinates) => void;
}

export const useRunStore = create<RunState>((set) => ({
  currentSession: null,
  status: 'idle',

  startRun: () =>
    set({
      status: 'running',
      currentSession: {
        id: `run-${Date.now()}`,
        startTime: Date.now(),
        durationSeconds: 0,
        distanceMeters: 0,
        currentPaceSecondsPerKm: 0,
        route: [RUN_START],
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
      currentSession: state.currentSession
        ? { ...state.currentSession, status: 'paused' }
        : null,
    })),

  resumeRun: () =>
    set((state) => ({
      status: 'running',
      currentSession: state.currentSession
        ? { ...state.currentSession, status: 'running' }
        : null,
    })),

  endRun: () =>
    set((state) => ({
      status: 'finished',
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            endTime: Date.now(),
            territoryCapturedKm2: Math.max(0.006, state.currentSession.distanceMeters / 25000),
            territoriesClaimedCount: 1,
            xpEarned:
              50 +
              Math.floor(state.currentSession.distanceMeters / 100) +
              Math.floor(state.currentSession.durationSeconds / 60) * 10,
            status: 'finished',
          }
        : null,
    })),

  addRoutePoint: (point) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          route: [...state.currentSession.route, point],
        },
      };
    }),

  updateStats: (distanceMeters, paceSecondsPerKm) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          distanceMeters,
          currentPaceSecondsPerKm: paceSecondsPerKm,
        },
      };
    }),

  tick: (routePoint) =>
    set((state) => {
      if (state.status !== 'running' || !state.currentSession) return state;
      const durationSeconds = state.currentSession.durationSeconds + 1;
      const paceSecondsPerKm = 430;
      const distanceMeters = (durationSeconds / paceSecondsPerKm) * 1000;
      const route = routePoint
        ? [...state.currentSession.route, routePoint]
        : state.currentSession.route;

      return {
        currentSession: {
          ...state.currentSession,
          durationSeconds,
          distanceMeters,
          currentPaceSecondsPerKm: paceSecondsPerKm,
          route,
          caloriesBurned: Math.round(distanceMeters * 0.06),
        },
      };
    }),
}));
