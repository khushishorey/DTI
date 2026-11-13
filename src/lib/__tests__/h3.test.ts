import { cellArea, gridDisk, latLngToCell } from 'h3-js';
import { routeDistanceMeters, haversineMeters } from '../geo';
import {
  TERRITORY_RESOLUTION,
  capturedCells,
  cellPolygon,
  cellResolution,
  cellsAreaKm2,
  countPointsPerCell,
  pointToCell,
} from '../h3';

const START = { latitude: 37.78825, longitude: -122.4324 };

describe('geo', () => {
  it('measures ~111 m for 0.001° of latitude', () => {
    const d = haversineMeters(START, { ...START, latitude: START.latitude + 0.001 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it('sums route segments', () => {
    const route = [0, 1, 2].map((i) => ({ ...START, latitude: START.latitude + i * 0.001 }));
    expect(routeDistanceMeters(route)).toBeCloseTo(2 * haversineMeters(route[0], route[1]), 5);
    expect(routeDistanceMeters([START])).toBe(0);
  });
});

describe('h3 territory helpers', () => {
  it('uses resolution 10 cells of roughly 0.015 km²', () => {
    const cell = pointToCell(START);
    expect(cellResolution(cell)).toBe(TERRITORY_RESOLUTION);
    expect(cellArea(cell, 'km2')).toBeGreaterThan(0.01);
    expect(cellArea(cell, 'km2')).toBeLessThan(0.02);
  });

  it('needs at least two points inside a cell to capture it', () => {
    expect(capturedCells([START])).toEqual([]);
    expect(capturedCells([START, START])).toEqual([pointToCell(START)]);
  });

  it('counts points per cell', () => {
    const elsewhere = { latitude: START.latitude + 0.01, longitude: START.longitude };
    const counts = countPointsPerCell([START, START, elsewhere]);
    expect(counts.get(pointToCell(START))).toBe(2);
    expect(counts.get(pointToCell(elsewhere))).toBe(1);
  });

  it('captures several cells along a ~600 m straight run sampled every ~5 m', () => {
    const route = Array.from({ length: 120 }, (_, i) => ({
      latitude: START.latitude + i * 0.000045,
      longitude: START.longitude,
    }));
    const cells = capturedCells(route);
    expect(cells.length).toBeGreaterThanOrEqual(4);
    expect(cellsAreaKm2(cells)).toBeCloseTo(
      cells.reduce((sum, c) => sum + cellArea(c, 'km2'), 0),
      10,
    );
  });

  it('turns a cell into a closed hexagon polygon around its centre', () => {
    const cell = latLngToCell(START.latitude, START.longitude, TERRITORY_RESOLUTION);
    const polygon = cellPolygon(cell);
    expect(polygon).toHaveLength(6);
    for (const vertex of polygon) {
      expect(haversineMeters(START, vertex)).toBeLessThan(150);
    }
    expect(gridDisk(cell, 1)).toHaveLength(7);
  });
});
