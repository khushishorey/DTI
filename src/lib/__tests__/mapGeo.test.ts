import { boundsFromLngLat, cellsToGeoJSON, pointToGeoJSON, routeToGeoJSON, territoriesToGeoJSON, toRing } from '../mapGeo';
import { pointToCell } from '../h3';
import type { Territory } from '../../types/territory';

const square = [
  { latitude: 1, longitude: 10 },
  { latitude: 1, longitude: 11 },
  { latitude: 2, longitude: 11 },
];

describe('mapGeo', () => {
  it('toRing swaps to [lng, lat] and closes the ring', () => {
    const ring = toRing(square);
    expect(ring[0]).toEqual([10, 1]);
    expect(ring).toHaveLength(4);
    expect(ring[3]).toEqual(ring[0]);
  });

  it('toRing of nothing stays empty (no phantom closing point)', () => {
    expect(toRing([])).toEqual([]);
  });

  it('territoriesToGeoJSON carries id and owner colour; my cells are heavier', () => {
    const base = { name: 'x', ownerId: 'o', ownerName: 'O', areaKm2: 1, capturedAt: '', coordinates: square };
    const fc = territoriesToGeoJSON([
      { ...base, id: 'a', ownerColor: '#112233', isCurrentPlayer: true },
      { ...base, id: 'b', ownerColor: '#445566', isCurrentPlayer: false },
    ] as Territory[]);
    expect(fc.features.map((f) => f.properties?.id)).toEqual(['a', 'b']);
    expect(fc.features[0].properties?.color).toBe('#112233');
    expect(fc.features[0].properties?.lineWidth).toBeGreaterThan(fc.features[1].properties?.lineWidth);
  });

  it('cellsToGeoJSON makes one closed hexagon (7 ring points) per cell', () => {
    const cell = pointToCell({ latitude: 37.7874, longitude: -122.4315 });
    const fc = cellsToGeoJSON([cell]);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.coordinates[0]).toHaveLength(7);
  });

  it('routeToGeoJSON needs two points', () => {
    expect(routeToGeoJSON([square[0]]).features).toHaveLength(0);
    expect(routeToGeoJSON(square).features[0].geometry.coordinates).toHaveLength(3);
  });

  it('pointToGeoJSON handles no position', () => {
    expect(pointToGeoJSON(undefined).features).toHaveLength(0);
    expect(pointToGeoJSON(square[0]).features[0].geometry.coordinates).toEqual([10, 1]);
  });

  it('boundsFromLngLat maps [w,s,e,n] to Bounds', () => {
    expect(boundsFromLngLat([-123, 37, -122, 38])).toEqual({ minLat: 37, minLng: -123, maxLat: 38, maxLng: -122 });
  });
});
