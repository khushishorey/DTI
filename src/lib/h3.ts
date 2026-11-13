import { cellArea, cellToBoundary, getResolution, latLngToCell } from 'h3-js';
import { Coordinates } from '../types/territory';

/**
 * Territory grid resolution. Res 10 cells have ~66 m edges and ~0.015 km² area,
 * so a 5 km run touches a few dozen cells. Must match the server (`submit_run`).
 */
export const TERRITORY_RESOLUTION = 10;

/** A cell counts as captured once a run has at least this many valid points inside it. */
export const MIN_POINTS_TO_CAPTURE = 2;

export function pointToCell(point: Coordinates, resolution = TERRITORY_RESOLUTION): string {
  return latLngToCell(point.latitude, point.longitude, resolution);
}

/** Number of route points that fell inside each cell, in the order cells were first entered. */
export function countPointsPerCell(
  route: Coordinates[],
  resolution = TERRITORY_RESOLUTION,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const point of route) {
    const cell = pointToCell(point, resolution);
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }
  return counts;
}

/** Cells the route has captured under the v1 rule (≥ MIN_POINTS_TO_CAPTURE points inside). */
export function capturedCells(
  route: Coordinates[],
  resolution = TERRITORY_RESOLUTION,
  minPoints = MIN_POINTS_TO_CAPTURE,
): string[] {
  return [...countPointsPerCell(route, resolution)]
    .filter(([, count]) => count >= minPoints)
    .map(([cell]) => cell);
}

/** Total area of the given cells in km². */
export function cellsAreaKm2(cells: string[]): number {
  return cells.reduce((sum, cell) => sum + cellArea(cell, 'km2'), 0);
}

/** Cell outline as map coordinates, ready for a <Polygon>. */
export function cellPolygon(cell: string): Coordinates[] {
  return cellToBoundary(cell).map(([latitude, longitude]) => ({ latitude, longitude }));
}

export function cellResolution(cell: string): number {
  return getResolution(cell);
}
