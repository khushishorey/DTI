import type { Bounds } from '../services/territory';
import type { Coordinates, Territory } from '../types/territory';
import { cellPolygon } from './h3';

/** Free vector tiles from OpenFreeMap: no API key, no account, no billing. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

type LngLat = [number, number];

/** MapLibre wants [lng, lat] and a closed ring. */
export function toRing(points: Coordinates[]): LngLat[] {
  const ring = points.map((p): LngLat => [p.longitude, p.latitude]);
  if (ring.length > 0) ring.push(ring[0]);
  return ring;
}

export function territoriesToGeoJSON(territories: Territory[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: 'FeatureCollection',
    features: territories.map((t) => ({
      type: 'Feature',
      id: t.id,
      properties: {
        id: t.id,
        color: t.ownerColor,
        fillOpacity: t.isCurrentPlayer ? 0.28 : 0.2,
        lineWidth: t.isCurrentPlayer ? 2.2 : 1.5,
      },
      geometry: { type: 'Polygon', coordinates: [toRing(t.coordinates)] },
    })),
  };
}

/** Cells captured during a run, drawn under the route. */
export function cellsToGeoJSON(cells: string[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  return {
    type: 'FeatureCollection',
    features: cells.map((cell) => ({
      type: 'Feature',
      properties: { id: cell },
      geometry: { type: 'Polygon', coordinates: [toRing(cellPolygon(cell))] },
    })),
  };
}

/** A line needs two points; fewer yields an empty collection so the layer simply draws nothing. */
export function routeToGeoJSON(route: Coordinates[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  if (route.length < 2) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: route.map((p): LngLat => [p.longitude, p.latitude]) },
      },
    ],
  };
}

export function pointToGeoJSON(point: Coordinates | undefined): GeoJSON.FeatureCollection<GeoJSON.Point> {
  if (!point) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] } },
    ],
  };
}

/** MapLibre bounds are [west, south, east, north]. */
export function boundsFromLngLat([west, south, east, north]: [number, number, number, number]): Bounds {
  return { minLat: south, minLng: west, maxLat: north, maxLng: east };
}
