import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { Coordinates } from '../../types/territory';
import { Colors, Radius } from '../../constants/theme';
import { DARK_MAP_STYLE } from './MapHomeView';

interface RunMapViewProps {
  route: Coordinates[];
  followCurrentLocation?: boolean;
}

export function RunMapView({ route, followCurrentLocation = false }: RunMapViewProps) {
  const region = useMemo<Region>(() => {
    const points = route.length > 0 ? route : [{ latitude: 37.78825, longitude: -122.4324 }];
    if (followCurrentLocation) {
      const latest = points[points.length - 1];
      return {
        latitude: latest.latitude,
        longitude: latest.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      };
    }
    const latitudes = points.map((point) => point.latitude);
    const longitudes = points.map((point) => point.longitude);
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);
    return {
      latitude: (minLatitude + maxLatitude) / 2,
      longitude: (minLongitude + maxLongitude) / 2,
      latitudeDelta: Math.max(0.003, (maxLatitude - minLatitude) * 1.8),
      longitudeDelta: Math.max(0.003, (maxLongitude - minLongitude) * 1.8),
    };
  }, [route, followCurrentLocation]);
  const currentLocation = route[route.length - 1];

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={region}
      region={followCurrentLocation ? region : undefined}
      customMapStyle={DARK_MAP_STYLE}
      userInterfaceStyle="dark"
      mapType="standard"
      showsCompass={false}
      showsScale={false}
      showsPointsOfInterests
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      accessibilityLabel="Simulated running route map"
    >
      {route.length > 1 ? (
        <>
          <Polyline coordinates={route} strokeColor="rgba(183, 243, 74, 0.22)" strokeWidth={10} />
          <Polyline coordinates={route} strokeColor={Colors.primary} strokeWidth={4} />
        </>
      ) : null}
      {currentLocation ? (
        <Marker coordinate={currentLocation} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerHalo}>
            <View style={styles.markerDot} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerHalo: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(183, 243, 74, 0.22)',
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 15,
    height: 15,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
});
