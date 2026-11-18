import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { haversineMeters } from '../geo';
import { SIMULATED_RUN_ROUTE } from '../../data/mockRunRoute';
import { Coordinates } from '../../types/territory';
import { TrackPoint } from './filterPoints';

export type TrackingMode = 'real' | 'simulated';

export type TrackingErrorCode = 'permission-denied' | 'unavailable';

export class TrackingError extends Error {
  constructor(public readonly code: TrackingErrorCode, message: string) {
    super(message);
  }
}

/**
 * Anything that can produce GPS points for a run. `start` resolves to a stop function.
 * Both the device GPS and the demo simulator implement this, so the run store never
 * needs to know which one is active.
 */
export interface TrackingSource {
  mode: TrackingMode;
  start(onPoint: (point: TrackPoint) => void): Promise<() => void>;
}

/**
 * Real GPS by default on phones; simulator on web (no useful GPS on a laptop) or when
 * EXPO_PUBLIC_TRACKING_MODE=simulated is set, e.g. for an indoor demo.
 */
export function defaultTrackingMode(): TrackingMode {
  const forced = process.env.EXPO_PUBLIC_TRACKING_MODE;
  if (forced === 'real' || forced === 'simulated') return forced;
  return Platform.OS === 'web' ? 'simulated' : 'real';
}

export function createTrackingSource(mode: TrackingMode): TrackingSource {
  return mode === 'real' ? deviceSource : createSimulatedSource();
}

const deviceSource: TrackingSource = {
  mode: 'real',
  async start(onPoint) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new TrackingError('permission-denied', 'Location permission is needed to track your run.');
    }
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 2000,
      },
      (location) =>
        onPoint({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? null,
          timestamp: location.timestamp,
          mocked: location.mocked,
        }),
      (reason) => console.warn('[tracking] location error', reason),
    );
    return () => subscription.remove();
  },
};

/** Jogs along SIMULATED_RUN_ROUTE at a steady ~5:00 /km (~3.28 m/s), completing the 262m demo route in ~80s. */
const SIMULATED_SPEED_MPS = 262 / 80;

function createSimulatedSource(): TrackingSource {
  // Distance already covered survives pause/resume because the source object is reused.
  let travelledMeters = 0;
  return {
    mode: 'simulated',
    async start(onPoint) {
      const emit = () =>
        onPoint({
          ...pointAlongRoute(SIMULATED_RUN_ROUTE, travelledMeters),
          accuracy: 5,
          timestamp: Date.now(),
        });
      emit();
      const timer = setInterval(() => {
        travelledMeters += SIMULATED_SPEED_MPS;
        emit();
      }, 1000);
      return () => clearInterval(timer);
    },
  };
}

/** Position `meters` along a polyline; stays at the last vertex once the route is exhausted. */
export function pointAlongRoute(route: Coordinates[], meters: number): Coordinates {
  let remaining = meters;
  for (let i = 1; i < route.length; i++) {
    const segment = haversineMeters(route[i - 1], route[i]);
    if (remaining <= segment) {
      const t = segment === 0 ? 0 : remaining / segment;
      return {
        latitude: route[i - 1].latitude + (route[i].latitude - route[i - 1].latitude) * t,
        longitude: route[i - 1].longitude + (route[i].longitude - route[i - 1].longitude) * t,
      };
    }
    remaining -= segment;
  }
  return route[route.length - 1];
}
