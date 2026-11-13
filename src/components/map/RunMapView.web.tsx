import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Coordinates } from '../../types/territory';
import { Colors, Radius } from '../../constants/theme';
import { MapCanvas } from './MapCanvas.web';
import Svg, { Polygon } from 'react-native-svg';
import { cellPolygon } from '../../lib/h3';

interface RunMapViewProps {
  route: Coordinates[];
  capturedCells?: string[];
  followCurrentLocation?: boolean;
}

export function RunMapView({ route, capturedCells = [] }: RunMapViewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hexes = useMemo(() => capturedCells.map(cellPolygon), [capturedCells]);
  const project = useMemo(
    () => createProjection([...route, ...hexes.flat()], size.width, size.height),
    [route, hexes, size],
  );
  const points = useMemo(() => route.map(project), [route, project]);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <MapCanvas onLayout={onLayout} accessibilityLabel="Running route and captured cells">
      {hexes.length > 0 && size.width > 0 ? (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {hexes.map((hex, index) => (
            <Polygon
              key={capturedCells[index]}
              points={hex.map((vertex) => { const { x, y } = project(vertex); return `${x},${y}`; }).join(' ')}
              fill="rgba(183, 243, 74, 0.18)"
              stroke={Colors.primary}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
      ) : null}
      {points.slice(1).map((point, index) => {
        const previous = points[index];
        const dx = point.x - previous.x;
        const dy = point.y - previous.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const midX = (point.x + previous.x) / 2;
        const midY = (point.y + previous.y) / 2;
        return (
          <View
            key={`${index}-${point.x.toFixed(1)}`}
            pointerEvents="none"
            style={[
              styles.routeGlow,
              {
                width: length,
                left: midX - length / 2,
                top: midY - 4,
                transform: [{ rotate: `${angle}rad` }],
              },
            ]}
          />
        );
      })}
      {points.length > 1 ? (
        <View
          pointerEvents="none"
          style={[
            styles.routeLine,
            {
              left: points[points.length - 1].x - 5,
              top: points[points.length - 1].y - 5,
            },
          ]}
        />
      ) : null}
      {points.length > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.locationHalo,
            { left: points[points.length - 1].x - 20, top: points[points.length - 1].y - 20 },
          ]}
        >
          <View style={styles.locationDot} />
        </View>
      ) : null}
    </MapCanvas>
  );
}

/** Equirectangular projection that fits all points in the view with equal x/y scale. */
function createProjection(all: Coordinates[], width: number, height: number) {
  if (!all.length || !width || !height) return () => ({ x: 0, y: 0 });
  const latitudes = all.map((point) => point.latitude);
  const longitudes = all.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const padding = 30;
  const spanX = Math.max((maxLng - minLng) * lngScale, 0.0005);
  const spanY = Math.max(maxLat - minLat, 0.0005);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  return (point: Coordinates) => ({
    x: width / 2 + (point.longitude - centerLng) * lngScale * scale,
    y: height / 2 - (point.latitude - centerLat) * scale,
  });
}

const styles = StyleSheet.create({
  routeGlow: {
    position: 'absolute',
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(183, 243, 74, 0.35)',
    transformOrigin: 'center',
  },
  routeLine: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  locationHalo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(183, 243, 74, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
});
