import { cellArea } from 'h3-js';
import { Colors } from '../constants/theme';
import { cellPolygon } from '../lib/h3';
import { requireSupabase } from '../lib/supabase';
import { Territory } from '../types/territory';

export interface Bounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

/** One owned cell, as returned by cells_in_bounds(). */
export interface CellOwnership {
  h3: string;
  owner_id: string;
  owner_name: string;
  owner_color: string;
  captured_at: string;
  previous_owner_id: string | null;
  previous_owner_name: string | null;
}

/** A cell taken from someone within this window shows as "contested" on Explore. */
const CONTESTED_WINDOW_MS = 24 * 3600 * 1000;

export async function fetchCellsInBounds(bounds: Bounds): Promise<CellOwnership[]> {
  const { data, error } = await requireSupabase().rpc('cells_in_bounds', {
    min_lat: bounds.minLat,
    min_lng: bounds.minLng,
    max_lat: bounds.maxLat,
    max_lng: bounds.maxLng,
  });
  if (error) throw error;
  // Untyped client: the shape is defined by cells_in_bounds() in the core_loop migration.
  return (data ?? []) as CellOwnership[];
}

/** Owner of a single cell, or null when nobody owns it yet. */
export async function fetchCellOwner(h3: string): Promise<{ ownerId: string; ownerName: string; ownerColor: string } | null> {
  const { data, error } = await requireSupabase()
    .from('cells')
    .select('owner_id, owner:profiles(username, color)')
    .eq('h3', h3)
    .maybeSingle<{ owner_id: string; owner: { username: string; color: string } | null }>();
  if (error) throw error;
  if (!data) return null;
  return {
    ownerId: data.owner_id,
    ownerName: data.owner?.username ?? 'Unknown runner',
    ownerColor: data.owner?.color ?? Colors.textSecondary,
  };
}

/** Adapt server cells to the Territory shape the existing map components draw. */
export function cellsToTerritories(cells: CellOwnership[], myUserId: string | undefined, now = Date.now()): Territory[] {
  return cells.map((cell) => {
    const stolenRecently =
      cell.previous_owner_id !== null && now - new Date(cell.captured_at).getTime() < CONTESTED_WINDOW_MS;
    return {
      id: cell.h3,
      name: cellName(cell.h3),
      ownerId: cell.owner_id,
      ownerName: cell.owner_name,
      ownerColor: cell.owner_color,
      isCurrentPlayer: cell.owner_id === myUserId,
      areaKm2: cellArea(cell.h3, 'km2'),
      capturedAt: cell.captured_at,
      coordinates: cellPolygon(cell.h3),
      status: stolenRecently ? 'contested' : 'owned',
      previousOwnerName: cell.previous_owner_name ?? undefined,
    };
  });
}

/** Short, stable, human-friendly label for a hex, e.g. "Cell 3F7A". */
export function cellName(h3: string): string {
  return `Cell ${h3.slice(-7, -3).toUpperCase()}`;
}

/** Round viewport bounds outward so small pans reuse the same cached query. */
export function snapBounds(bounds: Bounds, step = 0.004): Bounds {
  return {
    minLat: Math.floor(bounds.minLat / step) * step,
    minLng: Math.floor(bounds.minLng / step) * step,
    maxLat: Math.ceil(bounds.maxLat / step) * step,
    maxLng: Math.ceil(bounds.maxLng / step) * step,
  };
}
