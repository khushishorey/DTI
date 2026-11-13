import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Colors, Radius } from '../../constants/theme';
import { DEMO_BOUNDS, DEMO_REGION } from '../../constants/map';
import { MOCK_NEARBY_PLAYERS } from '../../data/mockPlayers';
import { MOCK_TERRITORIES } from '../../data/mockTerritories';
import { RUN_START } from '../../data/mockRunRoute';
import type { Bounds } from '../../services/territory';
import { Coordinates, Territory } from '../../types/territory';
import { MapCanvas } from './MapCanvas.web';

interface MapHomeViewProps {
  onSelectTerritory: (territory: Territory) => void;
  territories?: Territory[];
  players?: typeof MOCK_NEARBY_PLAYERS;
  centerOnLocationKey?: number;
  onBoundsChange?: (bounds: Bounds) => void;
}

/**
 * Web preview of the territory map. There is no map tile layer on web, so territories and
 * players are projected onto a stylised canvas covering the demo area at their real
 * coordinates (same data as the native map, just no streets).
 */
export function MapHomeView({
  onSelectTerritory,
  territories = MOCK_TERRITORIES,
  players = MOCK_NEARBY_PLAYERS,
  centerOnLocationKey = 0,
  onBoundsChange,
}: MapHomeViewProps) {
  // The map fills the screen; use the window size until the first layout measurement.
  const window = useWindowDimensions();
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const size = measured ?? { width: window.width, height: window.height };
  const project = useMemo(() => createProjection(size.width, size.height), [size.width, size.height]);

  useEffect(() => {
    onBoundsChange?.(DEMO_BOUNDS);
  }, [onBoundsChange]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setMeasured({ width, height });
  };

  const me = project(RUN_START);

  return (
    <MapCanvas key={centerOnLocationKey} onLayout={onLayout} accessibilityLabel="Territory map preview">
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          {territories.map((territory) => (
            <Polygon
              key={territory.id}
              points={territory.coordinates.map((c) => {
                const { x, y } = project(c);
                return `${x},${y}`;
              }).join(' ')}
              fill={withAlpha(territory.ownerColor, territory.isCurrentPlayer ? 0.24 : 0.17)}
              stroke={withAlpha(territory.ownerColor, 0.85)}
              strokeWidth={territory.isCurrentPlayer ? 2 : 1.4}
              onPress={() => onSelectTerritory(territory)}
              accessibilityLabel={`${territory.name}, owned by ${territory.ownerName}`}
            />
          ))}
        </Svg>
      ) : null}

      {size.width > 0 ? (
        <View pointerEvents="none" style={[styles.currentHalo, { left: me.x - 22, top: me.y - 22 }]}>
          <View style={styles.currentDot} />
        </View>
      ) : null}

      {size.width > 0
        ? players.map((player) => {
            const { x, y } = project(player.location);
            return (
              <View key={player.id} pointerEvents="none" style={[styles.playerMarker, { left: x - 7, top: y - 7 }]}>
                <View style={[styles.playerDot, { backgroundColor: player.territoryColor }]} />
                <View style={styles.playerName}>
                  <View style={[styles.playerNameDot, { backgroundColor: player.territoryColor }]} />
                  <View style={styles.playerNameRule} />
                </View>
              </View>
            );
          })
        : null}
    </MapCanvas>
  );
}

/** Equirectangular projection that covers the canvas with the demo region (equal x/y scale). */
function createProjection(width: number, height: number) {
  const lngScale = Math.cos((DEMO_REGION.latitude * Math.PI) / 180);
  const scale = Math.max(
    width / (DEMO_REGION.longitudeDelta * lngScale),
    height / DEMO_REGION.latitudeDelta,
  );
  return (point: Coordinates) => ({
    x: width / 2 + (point.longitude - DEMO_REGION.longitude) * lngScale * scale,
    y: height / 2 - (point.latitude - DEMO_REGION.latitude) * scale,
  });
}

function withAlpha(hex: string, alpha: number) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

const styles = StyleSheet.create({
  currentHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(183, 243, 74, 0.18)',
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: {
    width: 15,
    height: 15,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
  playerMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  playerDot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  playerName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    backgroundColor: 'rgba(11, 15, 14, 0.86)',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  playerNameDot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
  },
  playerNameRule: {
    width: 38,
    height: 3,
    backgroundColor: Colors.textSecondary,
    opacity: 0.75,
    borderRadius: Radius.full,
  },
});
