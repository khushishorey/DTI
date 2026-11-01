import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { MOCK_NEARBY_PLAYERS } from '../../data/mockPlayers';
import { MOCK_TERRITORIES } from '../../data/mockTerritories';
import { Territory } from '../../types/territory';
import { MapCanvas } from './MapCanvas.web';

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
  return (
    <MapCanvas key={centerOnLocationKey} accessibilityLabel="Simulated territory map preview">
      {territories.map((territory, index) => {
        const position = TERRITORY_POSITIONS[index % TERRITORY_POSITIONS.length];
        return (
          <Pressable
            key={territory.id}
            accessibilityRole="button"
            accessibilityLabel={`${territory.name}, owned by ${territory.ownerName}`}
            onPress={() => onSelectTerritory(territory)}
            style={[
              styles.territory,
              {
                left: `${position.left}%`,
                top: `${position.top}%`,
                width: position.width,
                height: position.height,
                borderColor: withAlpha(territory.ownerColor, 0.82),
                backgroundColor: withAlpha(territory.ownerColor, 0.17),
                transform: [{ rotate: position.rotate }],
              },
            ]}
          >
            <View style={[styles.territoryDot, { backgroundColor: territory.ownerColor }]} />
          </Pressable>
        );
      })}

      <View style={styles.currentHalo}>
        <View style={styles.currentDot} />
      </View>

      {players.map((player, index) => {
        const position = PLAYER_POSITIONS[index % PLAYER_POSITIONS.length];
        return (
          <View key={player.id} style={[styles.playerMarker, { left: `${position.left}%`, top: `${position.top}%` }]}>
            <View style={[styles.playerDot, { backgroundColor: player.territoryColor }]} />
            <View style={styles.playerName}><View style={[styles.playerNameDot, { backgroundColor: player.territoryColor }]} /><View style={styles.playerNameRule} /></View>
          </View>
        );
      })}
    </MapCanvas>
  );
}

function withAlpha(hex: string, alpha: number) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

const TERRITORY_POSITIONS = [
  { left: 43, top: 36, width: 146, height: 104, rotate: '-18deg' },
  { left: 21, top: 53, width: 138, height: 91, rotate: '17deg' },
  { left: 57, top: 19, width: 148, height: 88, rotate: '11deg' },
  { left: 57, top: 64, width: 138, height: 96, rotate: '-12deg' },
  { left: 12, top: 22, width: 130, height: 88, rotate: '9deg' },
  { left: 34, top: 69, width: 128, height: 82, rotate: '-7deg' },
];
const PLAYER_POSITIONS = [
  { left: 29, top: 31 },
  { left: 77, top: 46 },
  { left: 39, top: 74 },
];

const styles = StyleSheet.create({
  territory: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 23,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: Spacing.sm,
  },
  territoryDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
  },
  currentHalo: {
    position: 'absolute',
    left: '47%',
    top: '45%',
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
