import React, { useEffect, useRef, useState } from 'react';
import MapView, { MapStyleElement, Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { DEMO_REGION, regionToBounds } from '../../constants/map';
import type { Bounds } from '../../services/territory';
import { MOCK_TERRITORIES } from '../../data/mockTerritories';
import { MOCK_NEARBY_PLAYERS } from '../../data/mockPlayers';
import { Territory } from '../../types/territory';
import { CurrentPlayerMarker, PlayerMarkers } from './PlayerMarkers';
import { TerritoryOverlays } from './TerritoryOverlays';

const INITIAL_REGION: Region = DEMO_REGION;

export const DARK_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#141B18' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#87928B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141B18' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#29332D' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#18211D' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#77837B' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#28332D' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#18211D' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#A2ADA5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#35433B' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#202A24' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0C1311' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64756C' }] },
];

interface MapHomeViewProps {
  onSelectTerritory: (territory: Territory) => void;
  territories?: Territory[];
  players?: typeof MOCK_NEARBY_PLAYERS;
  centerOnLocationKey?: number;
  /** Called with the visible area whenever the map settles, to load cells in view. */
  onBoundsChange?: (bounds: Bounds) => void;
}

export function MapHomeView({
  onSelectTerritory,
  territories = MOCK_TERRITORIES,
  players = MOCK_NEARBY_PLAYERS,
  centerOnLocationKey = 0,
  onBoundsChange,
}: MapHomeViewProps) {
  const mapRef = useRef<MapView>(null);
  const [userRegion, setUserRegion] = useState<Region | null>(null);

  // Open on the player's real position when location permission was already granted
  // (we don't prompt here; the run screen asks when it's needed).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { granted } = await Location.getForegroundPermissionsAsync();
      if (!granted) return;
      const position = await Location.getLastKnownPositionAsync();
      if (!position || cancelled) return;
      const region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: INITIAL_REGION.latitudeDelta,
        longitudeDelta: INITIAL_REGION.longitudeDelta,
      };
      setUserRegion(region);
      mapRef.current?.animateToRegion(region, 350);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (centerOnLocationKey > 0) {
      mapRef.current?.animateToRegion(userRegion ?? INITIAL_REGION, 350);
    }
  }, [centerOnLocationKey, userRegion]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={INITIAL_REGION}
      customMapStyle={DARK_MAP_STYLE}
      userInterfaceStyle="dark"
      mapType="standard"
      showsCompass={false}
      showsScale={false}
      showsPointsOfInterests
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      accessibilityLabel="Territory map"
      showsUserLocation={Boolean(userRegion)}
      onMapReady={() => onBoundsChange?.(regionToBounds(INITIAL_REGION))}
      onRegionChangeComplete={(region) => onBoundsChange?.(regionToBounds(region))}
    >
      <TerritoryOverlays territories={territories} onSelect={onSelectTerritory} />
      {userRegion ? null : <CurrentPlayerMarker />}
      <PlayerMarkers players={players} />
    </MapView>
  );
}
