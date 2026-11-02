import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { NearbyCompetitor } from '../../types/user';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from '../common/ThemedText';

interface PlayerMarkersProps {
  players: NearbyCompetitor[];
}

export function PlayerMarkers({ players }: PlayerMarkersProps) {
  return (
    <>
      {players.map((player) => (
        <Marker
          key={player.id}
          coordinate={player.location}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
          accessibilityLabel={`${player.username}, level ${player.level}`}
        >
          <View style={styles.marker}>
            <View style={[styles.markerDot, { backgroundColor: player.territoryColor }]} />
            <ThemedText style={styles.markerLabel} numberOfLines={1}>
              {player.username}
            </ThemedText>
          </View>
        </Marker>
      ))}
    </>
  );
}

export function CurrentPlayerMarker() {
  return (
    <Marker
      coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
      accessibilityLabel="Your simulated location"
    >
      <View style={styles.currentMarker}>
        <View style={styles.currentHalo} />
        <View style={styles.currentDot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
  },
  markerDot: {
    width: 13,
    height: 13,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.textPrimary,
    marginBottom: 3,
  },
  markerLabel: {
    overflow: 'hidden',
    maxWidth: 112,
    backgroundColor: 'rgba(11, 15, 14, 0.88)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
  },
  currentMarker: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(183, 243, 74, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(183, 243, 74, 0.5)',
  },
  currentDot: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
});
