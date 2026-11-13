import React, { useMemo } from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { Colors } from '../../constants/theme';
import { NearbyCompetitor } from '../../types/user';

/** Other runners as coloured dots (offline demo only; live positions are not shared online). */
export function PlayerMarkers({ players }: { players: NearbyCompetitor[] }) {
  const data = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: 'FeatureCollection',
      features: players.map((p) => ({
        type: 'Feature',
        properties: { color: p.territoryColor },
        geometry: { type: 'Point', coordinates: [p.location.longitude, p.location.latitude] },
      })),
    }),
    [players],
  );
  if (players.length === 0) return null;
  return (
    <GeoJSONSource id="players" data={data}>
      <Layer
        id="players-dot"
        type="circle"
        paint={{
          'circle-radius': 6.5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': Colors.textPrimary,
        }}
      />
    </GeoJSONSource>
  );
}
