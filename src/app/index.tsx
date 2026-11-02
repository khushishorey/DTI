import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Play, Users, Zap } from 'lucide-react-native';
import { MapHomeView } from '../components/map/MapHomeView';
import { Avatar } from '../components/common/Avatar';
import { AppBottomNavigation } from '../components/common/AppBottomNavigation';
import { BottomSheet } from '../components/common/BottomSheet';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { ThemedText } from '../components/common/ThemedText';
import { MOCK_NEARBY_PLAYERS } from '../data/mockPlayers';
import { MOCK_TERRITORIES } from '../data/mockTerritories';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { useRunStore } from '../stores/useRunStore';
import { Territory } from '../types/territory';

export default function Index() {
  const insets = useSafeAreaInsets();
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const runStatus = useRunStore((state) => state.status);
  const startRun = useRunStore((state) => state.startRun);

  const territoryStats = useMemo(() => {
    const owned = MOCK_TERRITORIES.filter((territory) => territory.isCurrentPlayer);
    return {
      area: owned.reduce((total, territory) => total + territory.areaKm2, 0),
      count: owned.length,
    };
  }, []);

  const isRunning = runStatus === 'running' || runStatus === 'paused';

  return (
    <View style={styles.screen}>
      <MapHomeView onSelectTerritory={setSelectedTerritory} />

      <View style={[styles.topOverlay, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={styles.brandGroup}>
            <View style={styles.brandMark}>
              <Icon icon={Zap} size={19} color={Colors.textInverse} strokeWidth={2.8} />
            </View>
            <View>
              <ThemedText style={styles.brandName}>run.io</ThemedText>
              <View style={styles.locationRow}>
                <Icon icon={MapPin} size={12} color={Colors.primary} strokeWidth={2.5} />
                <ThemedText style={styles.locationText}>PACIFIC HEIGHTS</ThemedText>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Party invitations, one new notification"
            style={({ pressed }) => [styles.partyButton, pressed && styles.pressed]}
            onPress={() => router.push('/parties')}
          >
            <Icon icon={Users} size={20} color={Colors.textPrimary} />
            <ThemedText style={styles.partyButtonText}>PARTY</ThemedText>
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.infoRow}>
          <Card padding="md" style={styles.statsCard}>
            <View style={styles.statMain}>
              <View style={styles.statIcon}>
                <Icon icon={MapPin} size={15} color={Colors.primary} strokeWidth={2.4} />
              </View>
              <View>
                <ThemedText style={styles.statValue}>{territoryStats.area.toFixed(3)}</ThemedText>
                <ThemedText style={styles.statUnit}>KM² CLAIMED</ThemedText>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statSecondary}>
              <ThemedText style={styles.statSecondaryValue}>{territoryStats.count}</ThemedText>
              <ThemedText style={styles.statSecondaryLabel}>TERRITORIES</ThemedText>
            </View>
          </Card>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${MOCK_NEARBY_PLAYERS.length} nearby runners. Tap to explore.`}
            onPress={() => router.push('/explore')}
            style={({ pressed }) => [styles.nearbyCard, pressed && styles.pressed]}
          >
            <View style={styles.nearbyHeader}>
              <View style={styles.onlineDot} />
              <ThemedText style={styles.nearbyTitle}>NEARBY</ThemedText>
              <ThemedText style={styles.nearbyCount}>{MOCK_NEARBY_PLAYERS.length}</ThemedText>
            </View>
            <View style={styles.nearbyAvatars}>
              {MOCK_NEARBY_PLAYERS.slice(0, 3).map((player) => (
                <View key={player.id} style={styles.nearbyAvatarWrap}>
                  <Avatar name={player.username} size={28} borderWidth={2} borderColor={Colors.surface} />
                  <View style={[styles.avatarStatus, { backgroundColor: player.territoryColor }]} />
                </View>
              ))}
            </View>
            <ThemedText style={styles.nearbySubtext}>IN YOUR ZONE</ThemedText>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerPills}>
          {MOCK_NEARBY_PLAYERS.map((player) => (
            <Pressable
              key={player.id}
              accessibilityRole="button"
              accessibilityLabel={`Runner ${player.username}, ${formatDistance(player.distanceFromUserMeters)} away`}
              onPress={() => router.push({ pathname: '/player/[id]', params: { id: player.id } })}
              style={({ pressed }) => [styles.playerPill, pressed && styles.pressed]}
            >
              <View style={[styles.playerPillDot, { backgroundColor: player.territoryColor }]} />
              <ThemedText style={styles.playerPillName}>{player.username}</ThemedText>
              <ThemedText style={styles.playerDistance}>{formatDistance(player.distanceFromUserMeters)}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.mapHint} pointerEvents="none">
          <View style={styles.mapHintDot} />
          <ThemedText style={styles.mapHintText}>TAP A TERRITORY TO INSPECT</ThemedText>
        </View>
      </View>

      <View style={[styles.bottomOverlay, { bottom: insets.bottom + 88 }]} pointerEvents="box-none">
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: Colors.primary }]} />
            <ThemedText style={styles.legendText}>YOURS</ThemedText>
          </View>
          <View style={styles.legendDivider} />
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: Colors.competitorOrange }]} />
            <ThemedText style={styles.legendText}>RIVALS</ThemedText>
          </View>
        </View>

        <Button
          title={isRunning ? 'RUN IN PROGRESS' : 'START RUNNING'}
          size="lg"
          fullWidth
          leftIcon={<Icon icon={Play} size={18} color={Colors.textInverse} strokeWidth={2.5} />}
          onPress={() => {
            if (!isRunning) {
              startRun();
              router.push('/run');
            } else {
              router.push('/run');
            }
          }}
          accessibilityHint="Starts a simulated run session"
          style={styles.startButton}
        />
        <ThemedText style={styles.runCaption}>EVERY RUN COUNTS. EVERY TERRITORY MATTERS.</ThemedText>
      </View>

      <AppBottomNavigation activeTab="home" />

      <BottomSheet
        visible={Boolean(selectedTerritory)}
        onClose={() => setSelectedTerritory(null)}
        title={selectedTerritory?.name}
        subtitle={selectedTerritory ? `Owned by ${selectedTerritory.isCurrentPlayer ? 'you' : selectedTerritory.ownerName}` : undefined}
        showCloseButton
      >
        {selectedTerritory ? (
          <View style={styles.territorySheetContent}>
            <View style={styles.territoryDetails}>
              <View style={[styles.ownerSwatch, { backgroundColor: selectedTerritory.ownerColor }]} />
              <View style={styles.territoryDetailText}>
                <ThemedText style={styles.territoryArea}>{selectedTerritory.areaKm2.toFixed(3)} km²</ThemedText>
                <ThemedText variant="caption">Captured {formatDate(selectedTerritory.capturedAt)}</ThemedText>
              </View>
            </View>
            {!selectedTerritory.isCurrentPlayer && selectedTerritory.ownerId ? (
              <Button
                title="VIEW RUNNER PROFILE"
                variant="secondary"
                fullWidth
                onPress={() => {
                  const ownerId = selectedTerritory.ownerId;
                  setSelectedTerritory(null);
                  router.push({ pathname: '/player/[id]', params: { id: ownerId } });
                }}
                style={styles.sheetButton}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function formatDistance(meters: number) {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topOverlay: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: Typography.sizes.xl,
    lineHeight: 23,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.black,
    letterSpacing: -0.6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: Typography.weights.bold,
  },
  partyButton: {
    position: 'relative',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(20, 27, 24, 0.96)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
  },
  partyButtonText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.7,
  },
  notificationDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    top: 6,
    right: 8,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  pressed: {
    opacity: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.sm,
  },
  statsCard: {
    flex: 1,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 27, 24, 0.96)',
  },
  statMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIcon: {
    width: 29,
    height: 29,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    lineHeight: 20,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.7,
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  statSecondary: {
    alignItems: 'center',
    paddingRight: 2,
  },
  statSecondaryValue: {
    color: Colors.primary,
    fontSize: Typography.sizes.lg,
    lineHeight: 20,
    fontWeight: Typography.weights.bold,
  },
  statSecondaryLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  nearbyCard: {
    width: 114,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 27, 24, 0.96)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  nearbyTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  nearbyCount: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  nearbyAvatars: {
    flexDirection: 'row',
    marginTop: 3,
  },
  nearbyAvatarWrap: {
    marginHorizontal: -3,
  },
  avatarStatus: {
    position: 'absolute',
    width: 7,
    height: 7,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: Colors.surface,
    borderRadius: Radius.full,
  },
  nearbySubtext: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.7,
    marginTop: 4,
  },
  playerPills: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  playerPill: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20, 27, 24, 0.92)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
  },
  playerPillPressed: {
    backgroundColor: Colors.surfaceHighlight,
    borderColor: Colors.primary,
  },
  playerPillDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  playerPillName: {
    maxWidth: 96,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
  },
  playerDistance: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  mapHint: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 15, 14, 0.88)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  mapHintDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  mapHintText: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: Typography.weights.bold,
  },
  bottomOverlay: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  mapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(20, 27, 24, 0.94)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.6,
  },
  legendDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
  startButton: {
    minHeight: 58,
    borderRadius: Radius.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  runCaption: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
  },
  territorySheetContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  territoryDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ownerSwatch: {
    width: 14,
    height: 42,
    borderRadius: Radius.full,
  },
  territoryDetailText: {
    gap: 3,
  },
  territoryArea: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  sheetButton: {
    minHeight: 46,
  },
});
