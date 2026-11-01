import { Coordinates } from '../types/territory';

export const RUN_START: Coordinates = { latitude: 37.78825, longitude: -122.4324 };

// A gentle, continuously simulated jog through the demo neighborhood.
export const SIMULATED_RUN_ROUTE: Coordinates[] = Array.from({ length: 61 }, (_, step) => ({
  latitude: RUN_START.latitude + step * 0.00007 + Math.sin(step * 0.7) * 0.000035,
  longitude: RUN_START.longitude + step * 0.0001 + Math.sin(step * 0.42) * 0.00003,
}));
