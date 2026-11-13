import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { DEMO_REGION } from '../../constants/map';
import { Colors } from '../../constants/theme';
import { cellsToGeoJSON, MAP_STYLE_URL, pointToGeoJSON, routeToGeoJSON } from '../../lib/mapGeo';
import { Coordinates } from '../../types/territory';

interface RunMapViewProps {
  route: Coordinates[];
  /** H3 cells captured so far, drawn as hexes under the route. */
  capturedCells?: string[];
  followCurrentLocation?: boolean;
}

const FOLLOW_ZOOM = 16.5;
const FIT_PADDING = { top: 60, right: 60, bottom: 60, left: 60 };

export function RunMapView({ route, capturedCells = [], followCurrentLocation = false }: RunMapViewProps) {
  const cameraRef = useRef<CameraRef>(null);
  const hexes = useMemo(() => cellsToGeoJSON(capturedCells), [capturedCells]);
  const line = useMemo(() => routeToGeoJSON(route), [route]);
  const current = route[route.length - 1];
  const dot = useMemo(() => pointToGeoJSON(current), [current]);

  // Follow the runner live, or frame the whole route (summary screen).
  useEffect(() => {
    if (followCurrentLocation && current) {
      cameraRef.current?.easeTo({ center: [current.longitude, current.latitude], zoom: FOLLOW_ZOOM, duration: 400 });
    } else if (route.length >= 2) {
      const lngs = route.map((p) => p.longitude);
      const lats = route.map((p) => p.latitude);
      cameraRef.current?.fitBounds([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], {
        padding: FIT_PADDING,
        duration: 0,
      });
    }
  }, [followCurrentLocation, current, route]);

  const start = route[0] ?? { latitude: DEMO_REGION.latitude, longitude: DEMO_REGION.longitude };

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE_URL}
      compass={false}
      scaleBar={false}
      touchRotate={false}
      touchPitch={false}
      accessibilityLabel="Running route map"
    >
      <Camera ref={cameraRef} initialViewState={{ center: [start.longitude, start.latitude], zoom: FOLLOW_ZOOM }} />
      <GeoJSONSource id="run-cells" data={hexes}>
        <Layer id="run-cells-fill" type="fill" paint={{ 'fill-color': Colors.primary, 'fill-opacity': 0.18 }} />
        <Layer id="run-cells-line" type="line" paint={{ 'line-color': Colors.primary, 'line-width': 1.5 }} />
      </GeoJSONSource>
      <GeoJSONSource id="run-route" data={line}>
        <Layer
          id="run-route-glow"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': Colors.primary, 'line-width': 10, 'line-opacity': 0.22 }}
        />
        <Layer
          id="run-route-line"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': Colors.primary, 'line-width': 4 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="run-position" data={dot}>
        <Layer
          id="run-position-halo"
          type="circle"
          paint={{ 'circle-radius': 18, 'circle-color': Colors.primary, 'circle-opacity': 0.22 }}
        />
        <Layer
          id="run-position-dot"
          type="circle"
          paint={{
            'circle-radius': 7.5,
            'circle-color': Colors.primary,
            'circle-stroke-width': 3,
            'circle-stroke-color': Colors.textPrimary,
          }}
        />
      </GeoJSONSource>
    </Map>
  );
}
