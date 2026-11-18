import type { Bounds } from '../services/territory';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Where the map opens before we know the player's location. Matches the demo route
 * (src/data/mockRunRoute.ts) and the seeded players (supabase/seed.sql).
 */
export const DEMO_REGION: MapRegion = {
  latitude: 25.4305,
  longitude: 81.7720,
  latitudeDelta: 0.007,
  longitudeDelta: 0.007,
};

export function regionToBounds(region: MapRegion): Bounds {
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLng: region.longitude - region.longitudeDelta / 2,
    maxLng: region.longitude + region.longitudeDelta / 2,
  };
}

export const DEMO_BOUNDS = regionToBounds(DEMO_REGION);
