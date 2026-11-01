import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Coordinates } from '../../types/territory';
import { Colors, Radius } from '../../constants/theme';
import { MapCanvas } from './MapCanvas.web';

interface RunMapViewProps {
  route: Coordinates[];
}

export function RunMapView({ route }: RunMapViewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const points = useMemo(() => projectRoute(route, size.width, size.height), [route, size]);
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <MapCanvas onLayout={onLayout} accessibilityLabel="Simulated GPS route preview">
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

function projectRoute(route: Coordinates[], width: number, height: number) {
  if (!route.length || !width || !height) return [];
  const latitudes = route.map((point) => point.latitude);
  const longitudes = route.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = maxLat - minLat || 0.00001;
  const lngRange = maxLng - minLng || 0.00001;
  const padding = 30;

  return route.map((point) => ({
    x: padding + ((point.longitude - minLng) / lngRange) * Math.max(1, width - padding * 2),
    y: padding + ((maxLat - point.latitude) / latRange) * Math.max(1, height - padding * 2),
  }));
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
