import React, { useMemo } from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { territoriesToGeoJSON } from '../../lib/mapGeo';
import { Territory } from '../../types/territory';

/** Layer id the map queries to find which territory was tapped. */
export const TERRITORY_FILL_LAYER = 'territories-fill';

/**
 * All territories as one GeoJSON source (two layers) instead of one native view per hex,
 * which keeps the map smooth with hundreds of cells. Colour/opacity come from feature properties.
 */
export function TerritoryOverlays({ territories }: { territories: Territory[] }) {
  const data = useMemo(() => territoriesToGeoJSON(territories), [territories]);
  return (
    <GeoJSONSource id="territories" data={data}>
      <Layer
        id={TERRITORY_FILL_LAYER}
        type="fill"
        paint={{ 'fill-color': ['get', 'color'], 'fill-opacity': ['get', 'fillOpacity'] }}
      />
      <Layer
        id="territories-line"
        type="line"
        paint={{ 'line-color': ['get', 'color'], 'line-width': ['get', 'lineWidth'], 'line-opacity': 0.85 }}
      />
    </GeoJSONSource>
  );
}
