import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Camera, Map, UserLocation, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { DEMO_REGION, regionToBounds } from '../../constants/map';
import { boundsFromLngLat, MAP_STYLE_URL } from '../../lib/mapGeo';
import type { Bounds } from '../../services/territory';
import { Territory } from '../../types/territory';
import { NearbyCompetitor } from '../../types/user';
import { PlayerMarkers } from './PlayerMarkers';
import { TERRITORY_FILL_LAYER, TerritoryOverlays } from './TerritoryOverlays';

const START_ZOOM = 15;

interface MapHomeViewProps {
  onSelectTerritory: (territory: Territory) => void;
  territories?: Territory[];
  players?: NearbyCompetitor[];
  centerOnLocationKey?: number;
  /** Called with the visible area whenever the map settles, to load cells in view. */
  onBoundsChange?: (bounds: Bounds) => void;
}

export function MapHomeView({
  onSelectTerritory,
  territories = [],
  players = [],
  centerOnLocationKey = 0,
  onBoundsChange,
}: MapHomeViewProps) {
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const [permitted, setPermitted] = useState(false);
  const me = useRef<[number, number] | null>(null); // [lng, lat], latest GPS fix
  const centeredOnce = useRef(false);

  // Ask for location when the map opens, then follow the real GPS position live.
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || cancelled) return;
      setPermitted(true);
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 3000 },
        (position) => {
          me.current = [position.coords.longitude, position.coords.latitude];
          if (!centeredOnce.current) {
            centeredOnce.current = true; // jump to the player once; after that they can pan freely
            cameraRef.current?.easeTo({ center: me.current, zoom: START_ZOOM, duration: 500 });
          }
        },
      );
      if (cancelled) subscription.remove();
    })().catch(() => {});
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (centerOnLocationKey > 0 && me.current) {
      cameraRef.current?.easeTo({ center: me.current, zoom: START_ZOOM, duration: 350 });
    }
  }, [centerOnLocationKey]);

  const onPress = useCallback(
    async (event: { nativeEvent: { point: [number, number] } }) => {
      const features = await mapRef.current?.queryRenderedFeatures(event.nativeEvent.point, {
        layers: [TERRITORY_FILL_LAYER],
      });
      const id = features?.[0]?.properties?.id;
      const territory = territories.find((t) => t.id === id);
      if (territory) onSelectTerritory(territory);
    },
    [territories, onSelectTerritory],
  );

  return (
    <Map
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE_URL}
      compass={false}
      scaleBar={false}
      touchRotate={false}
      touchPitch={false}
      accessibilityLabel="Territory map"
      onPress={onPress}
      onDidFinishLoadingMap={() => onBoundsChange?.(regionToBounds(DEMO_REGION))}
      onRegionDidChange={(event) => onBoundsChange?.(boundsFromLngLat(event.nativeEvent.bounds))}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: [DEMO_REGION.longitude, DEMO_REGION.latitude], zoom: START_ZOOM }}
      />
      <TerritoryOverlays territories={territories} />
      <PlayerMarkers players={players} />
      {permitted ? <UserLocation animated accuracy /> : null}
    </Map>
  );
}
