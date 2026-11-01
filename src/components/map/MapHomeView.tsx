import React, { useEffect, useRef } from 'react';
import MapView, { MapStyleElement, Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { MOCK_TERRITORIES } from '../../data/mockTerritories';
import { MOCK_NEARBY_PLAYERS } from '../../data/mockPlayers';
import { Territory } from '../../types/territory';
import { CurrentPlayerMarker, PlayerMarkers } from './PlayerMarkers';
import { TerritoryOverlays } from './TerritoryOverlays';

const INITIAL_REGION: Region = {
  latitude: 37.7874,
  longitude: -122.4315,
  latitudeDelta: 0.012,
  longitudeDelta: 0.010,
};

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
}

export function MapHomeView({
  onSelectTerritory,
  territories = MOCK_TERRITORIES,
  players = MOCK_NEARBY_PLAYERS,
  centerOnLocationKey = 0,
}: MapHomeViewProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (centerOnLocationKey > 0) {
      mapRef.current?.animateToRegion(INITIAL_REGION, 350);
    }
  }, [centerOnLocationKey]);

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
    >
      <TerritoryOverlays territories={territories} onSelect={onSelectTerritory} />
      <CurrentPlayerMarker />
      <PlayerMarkers players={players} />
    </MapView>
  );
}
